#!/usr/bin/env python3
"""HVPT phrase library and OpenAI TTS cache service.

Schema v2: the library is a list of named decks. Each deck owns its own
phrases plus named groups that reference phrase ids. A v1 library (flat
phrases list) is migrated into a single default deck named "Russian" on
first load.
"""

from __future__ import annotations

import argparse
import base64
import hashlib
import json
import logging
import os
import re
import shutil
import threading
import time
import uuid
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from tempfile import NamedTemporaryFile
from typing import Any
from urllib.parse import urlsplit

try:
    from openai import OpenAI
except ImportError:  # pragma: no cover - environment dependent
    OpenAI = None

MAX_REQUEST_BYTES = 1024 * 1024
MAX_RECORDING_BYTES = 10 * 1024 * 1024
MAX_GO_RECORDING_BYTES = 1 * 1024 * 1024
MAX_TEXT_LENGTH = 4096
MAX_NOTE_LENGTH = 240
MAX_INSTRUCTIONS_LENGTH = 1200
MAX_PHRASE_COUNT = 2000
MAX_DECK_COUNT = 40
MAX_DECK_NAME_LENGTH = 60
MAX_GROUP_COUNT = 100
MAX_GROUP_NAME_LENGTH = 60
MAX_BATCH_PHRASES = 200
DEFAULT_DECK_NAME = "Russian"
DEFAULT_MODEL = "gpt-4o-mini-tts-2025-12-15"
DEFAULT_IMAGE_MODEL = "gpt-image-2"
DEFAULT_TRANSCRIPTION_MODEL = "gpt-4o-mini-transcribe"
DEFAULT_IMAGE_SIZE = "1024x1024"
DEFAULT_IMAGE_QUALITY = "medium"
DEFAULT_SPEED = 1.0
DEFAULT_VOICES = ("cedar", "marin", "ash", "verse")
BUILT_IN_VOICES = (
    "alloy",
    "ash",
    "ballad",
    "coral",
    "echo",
    "fable",
    "onyx",
    "nova",
    "sage",
    "shimmer",
    "verse",
    "marin",
    "cedar",
)
VOICE_SET = frozenset(BUILT_IN_VOICES)
IMAGE_QUALITIES = ("auto", "low", "medium", "high")
IMAGE_QUALITY_SET = frozenset(IMAGE_QUALITIES)
IMAGE_METADATA_KEYS = ("imageUrl", "imagePrompt", "imageQuality", "imageModel", "imageUpdatedAt")
IMAGE_URL_RE = re.compile(r"^\./api/images/[A-Za-z0-9._-]+\.(png|jpg|jpeg|webp)$")
LOG = logging.getLogger("hvpt_sync")

DECK_ID_RE = re.compile(r"^[a-zA-Z0-9]+$")
GO_TOKEN_RE = re.compile(r"[a-zа-яё]+", re.IGNORECASE)
GO_TRANSCRIBE_RATE_LIMIT = 45
GO_TRANSCRIBE_RATE_WINDOW_SECONDS = 60


class ValidationError(ValueError):
    """Raised when a request payload is invalid."""


class ServiceConfigError(RuntimeError):
    """Raised when the server is not configured to call OpenAI."""


def current_time_ms() -> int:
    return int(time.time() * 1000)


def normalize_text(value: Any) -> str:
    return str(value or "").strip()


def clamp(value: float, minimum: float, maximum: float) -> float:
    return min(maximum, max(minimum, value))


def number_or(value: Any, fallback: int | float) -> int | float:
    if isinstance(value, bool):
        return fallback
    if isinstance(value, (int, float)):
        return value
    return fallback


def title_for_phrase(text: str) -> str:
    compact = " ".join(text.split())
    if len(compact) <= 56:
        return compact
    return f"{compact[:53].rstrip()}..."


def timestamp_label(timestamp_ms: int) -> str:
    if timestamp_ms <= 0:
        return ""
    dt = datetime.fromtimestamp(timestamp_ms / 1000, tz=timezone.utc)
    return dt.strftime("%Y-%m-%d %H:%M UTC")


def new_deck_id() -> str:
    return f"d{uuid.uuid4().hex[:11]}"


def new_group_id() -> str:
    return f"g{uuid.uuid4().hex[:11]}"


def create_library(now_ms: int = 0) -> dict[str, Any]:
    return {
        "version": 2,
        "updatedAt": now_ms,
        "decks": [create_deck(DEFAULT_DECK_NAME, now_ms, deck_id="default")],
    }


def create_deck(name: str, now_ms: int, deck_id: str | None = None) -> dict[str, Any]:
    return {
        "id": deck_id or new_deck_id(),
        "name": name,
        "createdAt": now_ms,
        "updatedAt": now_ms,
        "phrases": [],
        "groups": [],
    }


def validate_voice_list(value: Any) -> list[str]:
    if not isinstance(value, list):
        raise ValidationError("voices must be a list.")

    voices: list[str] = []
    seen: set[str] = set()
    for item in value:
        voice = normalize_text(item).lower()
        if voice not in VOICE_SET:
            raise ValidationError(f"Unsupported voice: {voice or 'blank'}.")
        if voice in seen:
            continue
        seen.add(voice)
        voices.append(voice)

    if not voices:
        raise ValidationError("Select at least one voice.")
    return voices


def validate_image_quality(value: Any, fallback: str = DEFAULT_IMAGE_QUALITY) -> str:
    quality = normalize_text(value).lower() or fallback
    if quality not in IMAGE_QUALITY_SET:
        raise ValidationError(f"Image quality must be one of: {', '.join(IMAGE_QUALITIES)}.")
    return quality


def validate_image_metadata(payload: dict[str, Any]) -> dict[str, Any]:
    image_url = normalize_text(payload.get("imageUrl"))
    if not image_url:
        return {}
    if len(image_url) > 240 or not IMAGE_URL_RE.match(image_url):
        raise ValidationError("Invalid image URL.")

    image_prompt = normalize_text(payload.get("imagePrompt"))
    if len(image_prompt) > 3000:
        raise ValidationError("Image prompt is too long.")

    image_quality = validate_image_quality(payload.get("imageQuality"), DEFAULT_IMAGE_QUALITY)
    image_model = normalize_text(payload.get("imageModel")) or DEFAULT_IMAGE_MODEL
    image_updated_at = max(0, int(number_or(payload.get("imageUpdatedAt"), current_time_ms())))

    return {
        "imageUrl": image_url,
        "imagePrompt": image_prompt,
        "imageQuality": image_quality,
        "imageModel": image_model,
        "imageUpdatedAt": image_updated_at,
    }


def audio_extension_for_content_type(content_type: str) -> str:
    normalized = normalize_text(content_type).lower()
    if "ogg" in normalized:
        return ".ogg"
    if "wav" in normalized:
        return ".wav"
    if "mp4" in normalized or "m4a" in normalized or "aac" in normalized:
        return ".m4a"
    if "mpeg" in normalized or "mp3" in normalized:
        return ".mp3"
    return ".webm"


def transcription_extension_for_content_type(content_type: str) -> str:
    normalized = normalize_text(content_type).lower()
    if "wav" in normalized:
        return ".wav"
    if "mp4" in normalized or "m4a" in normalized or "aac" in normalized:
        return ".m4a"
    if "mpeg" in normalized or "mp3" in normalized:
        return ".mp3"
    return ".webm"


def contains_go_trigger(transcript: str) -> bool:
    tokens = GO_TOKEN_RE.findall(transcript.casefold())
    return "go" in tokens or "го" in tokens or "гоу" in tokens


def validate_phrase_payload(
    payload: Any,
    *,
    phrase_id: str | None = None,
    existing_created_at: int | None = None,
) -> dict[str, Any]:
    if not isinstance(payload, dict):
        raise ValidationError("Phrase payload must be a JSON object.")

    text = normalize_text(payload.get("text"))
    if not text:
        raise ValidationError("Phrase text is required.")
    if len(text) > MAX_TEXT_LENGTH:
        raise ValidationError(f"Phrase text must be at most {MAX_TEXT_LENGTH} characters.")

    note = normalize_text(payload.get("note"))
    if len(note) > MAX_NOTE_LENGTH:
        raise ValidationError(f"Note must be at most {MAX_NOTE_LENGTH} characters.")

    instructions = normalize_text(payload.get("instructions"))
    if len(instructions) > MAX_INSTRUCTIONS_LENGTH:
        raise ValidationError(f"Instructions must be at most {MAX_INSTRUCTIONS_LENGTH} characters.")

    speed = round(clamp(float(number_or(payload.get("speed"), DEFAULT_SPEED)), 0.25, 4.0), 2)
    if speed < 0.25 or speed > 4.0:
        raise ValidationError("Speed must be between 0.25 and 4.0.")

    voices = validate_voice_list(payload.get("voices") or [])
    recording_url = normalize_text(payload.get("recordingUrl"))
    now_ms = current_time_ms()
    created_at = existing_created_at if existing_created_at is not None else now_ms
    image_metadata = validate_image_metadata(payload)

    result = {
        "id": phrase_id or uuid.uuid4().hex[:12],
        "title": title_for_phrase(text),
        "text": text,
        "note": note,
        "instructions": instructions,
        "speed": speed,
        "voices": voices,
        "recordingUrl": recording_url,
        "createdAt": created_at,
        "updatedAt": now_ms,
    }
    result.update(image_metadata)
    return result


def validate_deck_name(value: Any) -> str:
    name = normalize_text(value)
    if not name:
        raise ValidationError("Deck name is required.")
    if len(name) > MAX_DECK_NAME_LENGTH:
        raise ValidationError(f"Deck name must be at most {MAX_DECK_NAME_LENGTH} characters.")
    return name


def validate_group_name(value: Any) -> str:
    name = normalize_text(value)
    if not name:
        raise ValidationError("Group name is required.")
    if len(name) > MAX_GROUP_NAME_LENGTH:
        raise ValidationError(f"Group name must be at most {MAX_GROUP_NAME_LENGTH} characters.")
    return name


def validate_phrase_ids(value: Any, known_ids: set[str]) -> list[str]:
    if value is None:
        return []
    if not isinstance(value, list):
        raise ValidationError("phraseIds must be a list.")
    result: list[str] = []
    seen: set[str] = set()
    for item in value:
        pid = normalize_text(item)
        if not pid or pid in seen:
            continue
        if pid not in known_ids:
            continue
        seen.add(pid)
        result.append(pid)
    return result


def sanitize_phrase(item: Any, now_ms: int) -> dict[str, Any] | None:
    if not isinstance(item, dict):
        return None
    phrase_id = normalize_text(item.get("id")) or uuid.uuid4().hex[:12]
    try:
        sanitized = validate_phrase_payload(
            item,
            phrase_id=phrase_id,
            existing_created_at=max(0, int(number_or(item.get("createdAt"), now_ms))),
        )
    except ValidationError:
        return None
    sanitized["updatedAt"] = max(
        sanitized["createdAt"],
        int(number_or(item.get("updatedAt"), sanitized["updatedAt"])),
    )
    return sanitized


def sanitize_group(item: Any, known_ids: set[str], now_ms: int) -> dict[str, Any] | None:
    if not isinstance(item, dict):
        return None
    name = normalize_text(item.get("name"))
    if not name:
        return None
    name = name[:MAX_GROUP_NAME_LENGTH]
    group_id = normalize_text(item.get("id")) or new_group_id()
    created_at = max(0, int(number_or(item.get("createdAt"), now_ms)))
    updated_at = max(created_at, int(number_or(item.get("updatedAt"), now_ms)))
    phrase_ids = validate_phrase_ids(item.get("phraseIds"), known_ids)
    return {
        "id": group_id,
        "name": name,
        "phraseIds": phrase_ids,
        "createdAt": created_at,
        "updatedAt": updated_at,
    }


def sanitize_deck(item: Any, now_ms: int) -> dict[str, Any] | None:
    if not isinstance(item, dict):
        return None
    try:
        name = validate_deck_name(item.get("name"))
    except ValidationError:
        return None
    deck_id = normalize_text(item.get("id")) or new_deck_id()
    created_at = max(0, int(number_or(item.get("createdAt"), now_ms)))
    updated_at = max(created_at, int(number_or(item.get("updatedAt"), now_ms)))

    phrases_raw = item.get("phrases")
    phrases: list[dict[str, Any]] = []
    if isinstance(phrases_raw, list):
        seen_ids: set[str] = set()
        for raw in phrases_raw:
            sanitized = sanitize_phrase(raw, now_ms)
            if sanitized is None or sanitized["id"] in seen_ids:
                continue
            seen_ids.add(sanitized["id"])
            phrases.append(sanitized)
        phrases.sort(key=lambda p: p["updatedAt"], reverse=True)
        phrases = phrases[:MAX_PHRASE_COUNT]

    known_ids = {p["id"] for p in phrases}
    groups_raw = item.get("groups")
    groups: list[dict[str, Any]] = []
    if isinstance(groups_raw, list):
        seen_gids: set[str] = set()
        for raw in groups_raw:
            sanitized = sanitize_group(raw, known_ids, now_ms)
            if sanitized is None or sanitized["id"] in seen_gids:
                continue
            seen_gids.add(sanitized["id"])
            groups.append(sanitized)
        groups.sort(key=lambda g: g["createdAt"])
        groups = groups[:MAX_GROUP_COUNT]

    return {
        "id": deck_id,
        "name": name,
        "createdAt": created_at,
        "updatedAt": updated_at,
        "phrases": phrases,
        "groups": groups,
    }


def sanitize_library(payload: Any, now_ms: int | None = None) -> dict[str, Any]:
    stamp = current_time_ms() if now_ms is None else now_ms
    if not isinstance(payload, dict):
        return create_library(stamp)

    version = number_or(payload.get("version"), 1)

    # v1 migration: a flat phrases list at the root becomes the default deck.
    if (not isinstance(payload.get("decks"), list)) and isinstance(payload.get("phrases"), list):
        legacy_deck = {
            "id": "default",
            "name": DEFAULT_DECK_NAME,
            "createdAt": stamp,
            "updatedAt": stamp,
            "phrases": payload.get("phrases", []),
            "groups": [],
        }
        payload = {"version": 2, "updatedAt": stamp, "decks": [legacy_deck]}

    decks_raw = payload.get("decks")
    decks: list[dict[str, Any]] = []
    if isinstance(decks_raw, list):
        seen_ids: set[str] = set()
        for raw in decks_raw:
            sanitized = sanitize_deck(raw, stamp)
            if sanitized is None or sanitized["id"] in seen_ids:
                continue
            seen_ids.add(sanitized["id"])
            decks.append(sanitized)

    if not decks:
        decks = [create_deck(DEFAULT_DECK_NAME, stamp)]

    decks = decks[:MAX_DECK_COUNT]
    return {
        "version": 2,
        "updatedAt": max(0, int(number_or(payload.get("updatedAt"), stamp))),
        "decks": decks,
    }


class PhraseStore:
    """Stores saved phrases and cached audio variants."""

    def __init__(
        self,
        data_dir: str | Path,
        model: str = DEFAULT_MODEL,
        image_model: str = DEFAULT_IMAGE_MODEL,
        transcription_model: str = DEFAULT_TRANSCRIPTION_MODEL,
    ):
        self.data_dir = Path(data_dir)
        self.data_dir.mkdir(parents=True, exist_ok=True)
        self.audio_dir = self.data_dir / "audio"
        self.audio_dir.mkdir(parents=True, exist_ok=True)
        self.image_dir = self.data_dir / "images"
        self.image_dir.mkdir(parents=True, exist_ok=True)
        self.phrases_path = self.data_dir / "phrases.json"
        self.backups_dir = self.data_dir / "backups"
        self.backups_dir.mkdir(parents=True, exist_ok=True)
        self.model = model
        self.image_model = normalize_text(image_model) or DEFAULT_IMAGE_MODEL
        self.transcription_model = normalize_text(transcription_model) or DEFAULT_TRANSCRIPTION_MODEL
        self._lock = threading.Lock()
        self._client: OpenAI | None = None

    # ───── introspection ─────

    def get_health(self) -> dict[str, Any]:
        library = self._read_library()
        total_phrases = sum(len(d["phrases"]) for d in library["decks"])
        return {
            "status": "ok",
            "dataDir": str(self.data_dir),
            "model": self.model,
            "imageModel": self.image_model,
            "transcriptionModel": self.transcription_model,
            "deckCount": len(library["decks"]),
            "phraseCount": total_phrases,
            "openaiInstalled": OpenAI is not None,
            "openaiConfigured": bool(normalize_text(os.environ.get("OPENAI_API_KEY"))),
            "ttsReady": self.is_tts_ready(),
            "imageReady": self.is_image_ready(),
            "transcriptionReady": self.is_transcription_ready(),
        }

    def is_tts_ready(self) -> bool:
        return OpenAI is not None and bool(normalize_text(os.environ.get("OPENAI_API_KEY")))

    def is_image_ready(self) -> bool:
        return OpenAI is not None and bool(normalize_text(os.environ.get("OPENAI_API_KEY")))

    def is_transcription_ready(self) -> bool:
        return OpenAI is not None and bool(normalize_text(os.environ.get("OPENAI_API_KEY")))

    def bootstrap(self) -> dict[str, Any]:
        library = self._read_library()
        return {
            "availableVoices": list(BUILT_IN_VOICES),
            "defaultVoices": list(DEFAULT_VOICES),
            "defaultSpeed": DEFAULT_SPEED,
            "model": self.model,
            "imageModel": self.image_model,
            "transcriptionModel": self.transcription_model,
            "imageQualities": list(IMAGE_QUALITIES),
            "defaultImageQuality": DEFAULT_IMAGE_QUALITY,
            "ttsReady": self.is_tts_ready(),
            "imageReady": self.is_image_ready(),
            "transcriptionReady": self.is_transcription_ready(),
            "decks": library["decks"],
        }

    # ───── deck CRUD ─────

    def create_deck(self, payload: Any) -> dict[str, Any]:
        if not isinstance(payload, dict):
            raise ValidationError("Deck payload must be a JSON object.")
        name = validate_deck_name(payload.get("name"))
        with self._lock:
            library = self._read_library()
            if len(library["decks"]) >= MAX_DECK_COUNT:
                raise ValidationError(f"Deck limit reached ({MAX_DECK_COUNT}).")
            now = current_time_ms()
            deck = create_deck(name, now)
            library["decks"].append(deck)
            library["updatedAt"] = now
            self._write_library(library, create_backup=self.phrases_path.exists())
            return deck

    def rename_deck(self, deck_id: str, payload: Any) -> dict[str, Any]:
        if not isinstance(payload, dict):
            raise ValidationError("Deck payload must be a JSON object.")
        name = validate_deck_name(payload.get("name"))
        with self._lock:
            library = self._read_library()
            deck = self._find_deck(library, deck_id)
            deck["name"] = name
            deck["updatedAt"] = current_time_ms()
            library["updatedAt"] = deck["updatedAt"]
            self._write_library(library, create_backup=self.phrases_path.exists())
            return deck

    def delete_deck(self, deck_id: str) -> bool:
        with self._lock:
            library = self._read_library()
            decks = library["decks"]
            if len(decks) <= 1:
                raise ValidationError("Cannot delete the last deck.")
            remaining = [d for d in decks if d["id"] != deck_id]
            if len(remaining) == len(decks):
                return False
            library["decks"] = remaining
            library["updatedAt"] = current_time_ms()
            self._write_library(library, create_backup=self.phrases_path.exists())
            return True

    # ───── phrase CRUD ─────

    def save_phrase(self, deck_id: str, payload: Any, phrase_id: str | None = None) -> dict[str, Any]:
        with self._lock:
            library = self._read_library()
            deck = self._find_deck(library, deck_id)
            existing = None
            if phrase_id:
                existing = next((item for item in deck["phrases"] if item["id"] == phrase_id), None)
                if existing is None:
                    raise ValidationError("Phrase not found.")
            elif len(deck["phrases"]) >= MAX_PHRASE_COUNT:
                raise ValidationError(f"Save limit reached ({MAX_PHRASE_COUNT} phrases per deck).")

            saved = validate_phrase_payload(
                payload,
                phrase_id=phrase_id,
                existing_created_at=existing["createdAt"] if existing else None,
            )
            if existing and not normalize_text(payload.get("imageUrl")) and existing.get("imageUrl"):
                for key in IMAGE_METADATA_KEYS:
                    if key in existing:
                        saved[key] = existing[key]
            phrases = [item for item in deck["phrases"] if item["id"] != saved["id"]]
            phrases.append(saved)
            deck["phrases"] = sorted(phrases, key=lambda item: item["updatedAt"], reverse=True)
            deck["updatedAt"] = current_time_ms()
            library["updatedAt"] = deck["updatedAt"]
            self._write_library(library, create_backup=self.phrases_path.exists())
            return saved

    def save_phrases_batch(self, deck_id: str, payload: Any) -> list[dict[str, Any]]:
        if not isinstance(payload, dict):
            raise ValidationError("Batch payload must be a JSON object.")
        items = payload.get("phrases")
        if not isinstance(items, list) or not items:
            raise ValidationError("Provide at least one phrase in the batch.")
        if len(items) > MAX_BATCH_PHRASES:
            raise ValidationError(f"Batch limit is {MAX_BATCH_PHRASES} phrases.")

        with self._lock:
            library = self._read_library()
            deck = self._find_deck(library, deck_id)
            if len(deck["phrases"]) + len(items) > MAX_PHRASE_COUNT:
                raise ValidationError(f"Deck would exceed {MAX_PHRASE_COUNT} phrases.")

            created: list[dict[str, Any]] = []
            errors: list[str] = []
            for index, item in enumerate(items):
                try:
                    saved = validate_phrase_payload(item)
                    created.append(saved)
                except ValidationError as exc:
                    errors.append(f"row {index + 1}: {exc}")

            if errors and not created:
                raise ValidationError("; ".join(errors))

            deck["phrases"] = sorted(
                created + deck["phrases"],
                key=lambda p: p["updatedAt"],
                reverse=True,
            )
            deck["updatedAt"] = current_time_ms()
            library["updatedAt"] = deck["updatedAt"]
            self._write_library(library, create_backup=self.phrases_path.exists())
            return created

    def delete_phrase(self, deck_id: str, phrase_id: str) -> bool:
        with self._lock:
            library = self._read_library()
            deck = self._find_deck(library, deck_id)
            phrases = [item for item in deck["phrases"] if item["id"] != phrase_id]
            if len(phrases) == len(deck["phrases"]):
                return False
            deck["phrases"] = phrases
            # Remove deleted phrase from any groups.
            for group in deck["groups"]:
                before = len(group["phraseIds"])
                group["phraseIds"] = [pid for pid in group["phraseIds"] if pid != phrase_id]
                if len(group["phraseIds"]) != before:
                    group["updatedAt"] = current_time_ms()
            deck["updatedAt"] = current_time_ms()
            library["updatedAt"] = deck["updatedAt"]
            self._write_library(library, create_backup=self.phrases_path.exists())
            return True

    # ───── group CRUD ─────

    def create_group(self, deck_id: str, payload: Any) -> dict[str, Any]:
        if not isinstance(payload, dict):
            raise ValidationError("Group payload must be a JSON object.")
        name = validate_group_name(payload.get("name"))
        with self._lock:
            library = self._read_library()
            deck = self._find_deck(library, deck_id)
            if len(deck["groups"]) >= MAX_GROUP_COUNT:
                raise ValidationError(f"Group limit reached ({MAX_GROUP_COUNT}).")
            known_ids = {p["id"] for p in deck["phrases"]}
            phrase_ids = validate_phrase_ids(payload.get("phraseIds"), known_ids)
            now = current_time_ms()
            group = {
                "id": new_group_id(),
                "name": name,
                "phraseIds": phrase_ids,
                "createdAt": now,
                "updatedAt": now,
            }
            deck["groups"].append(group)
            deck["updatedAt"] = now
            library["updatedAt"] = now
            self._write_library(library, create_backup=self.phrases_path.exists())
            return group

    def update_group(self, deck_id: str, group_id: str, payload: Any) -> dict[str, Any]:
        if not isinstance(payload, dict):
            raise ValidationError("Group payload must be a JSON object.")
        with self._lock:
            library = self._read_library()
            deck = self._find_deck(library, deck_id)
            group = next((g for g in deck["groups"] if g["id"] == group_id), None)
            if group is None:
                raise ValidationError("Group not found.")

            if "name" in payload:
                group["name"] = validate_group_name(payload.get("name"))
            if "phraseIds" in payload:
                known_ids = {p["id"] for p in deck["phrases"]}
                group["phraseIds"] = validate_phrase_ids(payload.get("phraseIds"), known_ids)
            group["updatedAt"] = current_time_ms()
            deck["updatedAt"] = group["updatedAt"]
            library["updatedAt"] = group["updatedAt"]
            self._write_library(library, create_backup=self.phrases_path.exists())
            return group

    def delete_group(self, deck_id: str, group_id: str) -> bool:
        with self._lock:
            library = self._read_library()
            deck = self._find_deck(library, deck_id)
            remaining = [g for g in deck["groups"] if g["id"] != group_id]
            if len(remaining) == len(deck["groups"]):
                return False
            deck["groups"] = remaining
            deck["updatedAt"] = current_time_ms()
            library["updatedAt"] = deck["updatedAt"]
            self._write_library(library, create_backup=self.phrases_path.exists())
            return True

    # ───── audio / recording ─────

    def generate_variants(self, payload: Any) -> dict[str, Any]:
        phrase = validate_phrase_payload(payload)
        client = self._get_client()
        variants: list[dict[str, Any]] = []

        with ThreadPoolExecutor(max_workers=min(4, len(phrase["voices"]))) as executor:
            futures = [executor.submit(self._ensure_audio, client, phrase, voice) for voice in phrase["voices"]]
            for future in futures:
                variants.append(future.result())

        variants.sort(key=lambda item: phrase["voices"].index(item["voice"]))
        return {
            "phrase": phrase,
            "variants": variants,
            "generatedAt": current_time_ms(),
        }

    def save_recording(self, content: bytes, extension: str = ".webm") -> dict[str, Any]:
        """Save a user recording to the audio directory."""
        if len(content) > MAX_RECORDING_BYTES:
            raise ValidationError(f"Recording too large (max {MAX_RECORDING_BYTES // (1024 * 1024)}MB).")
        if not content:
            raise ValidationError("Recording is empty.")
        digest = hashlib.sha256(content).hexdigest()[:24]
        file_name = f"rec-{digest}{extension}"
        output_path = self.audio_dir / file_name
        if not output_path.exists():
            self._write_audio(output_path, content)
        return {
            "fileName": file_name,
            "url": f"./api/audio/{file_name}",
            "sizeBytes": output_path.stat().st_size,
        }

    def transcribe_go(self, content: bytes, extension: str = ".webm") -> dict[str, Any]:
        """Transcribe a short clip and report whether it contains the GO trigger."""
        if len(content) > MAX_GO_RECORDING_BYTES:
            raise ValidationError(f"Recording too large (max {MAX_GO_RECORDING_BYTES // (1024 * 1024)}MB).")
        if not content:
            raise ValidationError("Recording is empty.")

        client = self._get_client()
        temp_path: Path | None = None
        try:
            with NamedTemporaryFile("wb", suffix=extension, delete=False) as handle:
                handle.write(content)
                temp_path = Path(handle.name)

            with temp_path.open("rb") as audio_file:
                response = client.audio.transcriptions.create(
                    model=self.transcription_model,
                    file=audio_file,
                    response_format="text",
                    prompt='The speaker is trying to say the English start command "go".',
                )
        finally:
            if temp_path is not None:
                temp_path.unlink(missing_ok=True)

        if isinstance(response, str):
            transcript = normalize_text(response)
        else:
            transcript = normalize_text(getattr(response, "text", ""))

        return {
            "transcript": transcript,
            "hasGo": contains_go_trigger(transcript),
            "model": self.transcription_model,
        }

    # ───── image generation ─────

    def generate_phrase_image(self, deck_id: str, phrase_id: str, payload: Any) -> dict[str, Any]:
        if payload is None:
            payload = {}
        if not isinstance(payload, dict):
            raise ValidationError("Image payload must be a JSON object.")

        quality = validate_image_quality(payload.get("quality"), DEFAULT_IMAGE_QUALITY)
        with self._lock:
            library = self._read_library()
            deck = self._find_deck(library, deck_id)
            phrase = next((item for item in deck["phrases"] if item["id"] == phrase_id), None)
            if phrase is None:
                raise ValidationError("Phrase not found.")
            phrase_snapshot = dict(phrase)

        client = self._get_client()
        image = self._ensure_image(client, phrase_snapshot, quality)

        with self._lock:
            library = self._read_library()
            deck = self._find_deck(library, deck_id)
            phrase = next((item for item in deck["phrases"] if item["id"] == phrase_id), None)
            if phrase is None:
                raise ValidationError("Phrase not found.")
            now_ms = current_time_ms()
            phrase.update(
                {
                    "imageUrl": image["url"],
                    "imagePrompt": image["prompt"],
                    "imageQuality": quality,
                    "imageModel": self.image_model,
                    "imageUpdatedAt": now_ms,
                }
            )
            deck["updatedAt"] = now_ms
            library["updatedAt"] = now_ms
            self._write_library(library, create_backup=self.phrases_path.exists())
            return {"phrase": phrase, "image": image}

    def audio_path_for_name(self, file_name: str) -> Path | None:
        candidate = normalize_text(file_name)
        if not candidate or "/" in candidate or "\\" in candidate:
            return None
        path = (self.audio_dir / candidate).resolve()
        if path.parent != self.audio_dir.resolve() or not path.exists():
            return None
        return path

    def image_path_for_name(self, file_name: str) -> Path | None:
        candidate = normalize_text(file_name)
        if not candidate or "/" in candidate or "\\" in candidate:
            return None
        path = (self.image_dir / candidate).resolve()
        if path.parent != self.image_dir.resolve() or not path.exists():
            return None
        return path

    # ───── internal helpers ─────

    def _find_deck(self, library: dict[str, Any], deck_id: str) -> dict[str, Any]:
        key = normalize_text(deck_id)
        if not key:
            raise ValidationError("Deck id is required.")
        deck = next((d for d in library["decks"] if d["id"] == key), None)
        if deck is None:
            raise ValidationError("Deck not found.")
        return deck

    def _get_client(self) -> OpenAI:
        if OpenAI is None:
            raise ServiceConfigError("The openai Python package is not installed on the server.")

        api_key = normalize_text(os.environ.get("OPENAI_API_KEY"))
        if not api_key:
            raise ServiceConfigError("OPENAI_API_KEY is not configured on the server.")

        if self._client is None:
            self._client = OpenAI(api_key=api_key)
        return self._client

    def _ensure_audio(self, client: OpenAI, phrase: dict[str, Any], voice: str) -> dict[str, Any]:
        payload = {
            "model": self.model,
            "text": phrase["text"],
            "instructions": phrase["instructions"],
            "speed": phrase["speed"],
            "voice": voice,
            "format": "mp3",
        }
        digest = hashlib.sha256(json.dumps(payload, ensure_ascii=False, sort_keys=True).encode("utf-8")).hexdigest()[:24]
        file_name = f"{voice}-{digest}.mp3"
        output_path = self.audio_dir / file_name
        cached = output_path.exists()

        if not cached:
            request: dict[str, Any] = {
                "input": phrase["text"],
                "model": self.model,
                "response_format": "mp3",
                "speed": phrase["speed"],
                "voice": voice,
            }
            if phrase["instructions"]:
                request["instructions"] = phrase["instructions"]

            response = client.audio.speech.create(**request)
            content = response.read()
            self._write_audio(output_path, content)

        return {
            "id": digest,
            "voice": voice,
            "speed": phrase["speed"],
            "cached": cached,
            "url": f"./api/audio/{file_name}",
            "sizeBytes": output_path.stat().st_size,
        }

    def _ensure_image(self, client: OpenAI, phrase: dict[str, Any], quality: str) -> dict[str, Any]:
        prompt = self._build_image_prompt(phrase)
        payload = {
            "model": self.image_model,
            "text": phrase["text"],
            "note": phrase.get("note", ""),
            "prompt": prompt,
            "quality": quality,
            "size": DEFAULT_IMAGE_SIZE,
        }
        digest = hashlib.sha256(json.dumps(payload, ensure_ascii=False, sort_keys=True).encode("utf-8")).hexdigest()[:24]
        file_name = f"img-{digest}.png"
        output_path = self.image_dir / file_name
        cached = output_path.exists()

        if not cached:
            result = client.images.generate(
                model=self.image_model,
                prompt=prompt,
                quality=quality,
                size=DEFAULT_IMAGE_SIZE,
            )
            if not result.data:
                raise RuntimeError("Image generation returned no images.")
            first_image = result.data[0]
            image_base64 = normalize_text(
                first_image.get("b64_json") if isinstance(first_image, dict) else getattr(first_image, "b64_json", "")
            )
            if not image_base64:
                raise RuntimeError("Image generation returned no base64 image data.")
            content = base64.b64decode(image_base64)
            self._write_image(output_path, content)

        return {
            "id": digest,
            "model": self.image_model,
            "quality": quality,
            "size": DEFAULT_IMAGE_SIZE,
            "cached": cached,
            "prompt": prompt,
            "url": f"./api/images/{file_name}",
            "sizeBytes": output_path.stat().st_size,
        }

    def _build_image_prompt(self, phrase: dict[str, Any]) -> str:
        note = normalize_text(phrase.get("note"))
        note_line = f"\nEnglish meaning/note for disambiguation: {note}" if note else ""
        return (
            "Create a square educational illustration for an adult Russian language learner.\n"
            "Purpose: help the learner connect this Russian sentence to a memorable visual scene, "
            "without relying on text in the image.\n"
            f"Russian sentence: {phrase['text']}{note_line}\n"
            "Style: warm, naturalistic editorial illustration with clean shapes, clear lighting, "
            "and one obvious action or situation. Keep the scene specific and literal enough for "
            "sentence recall. If the sentence expresses absence or negation, make the missing item "
            "visually clear through the scene composition. Do not include captions, subtitles, "
            "speech bubbles, labels, UI, Russian text, or English text."
        )

    def _write_audio(self, output_path: Path, content: bytes) -> None:
        with NamedTemporaryFile("wb", dir=self.audio_dir, prefix="audio.", suffix=".tmp", delete=False) as handle:
            handle.write(content)
            handle.flush()
            handle_name = handle.name
            try:
                os.fsync(handle.fileno())
            except OSError:
                LOG.warning("fsync failed for temporary audio file %s", handle_name)
        Path(handle_name).replace(output_path)

    def _write_image(self, output_path: Path, content: bytes) -> None:
        with NamedTemporaryFile("wb", dir=self.image_dir, prefix="image.", suffix=".tmp", delete=False) as handle:
            handle.write(content)
            handle.flush()
            handle_name = handle.name
            try:
                os.fsync(handle.fileno())
            except OSError:
                LOG.warning("fsync failed for temporary image file %s", handle_name)
        Path(handle_name).replace(output_path)

    def _read_library(self) -> dict[str, Any]:
        if not self.phrases_path.exists():
            return create_library(current_time_ms())
        try:
            payload = json.loads(self.phrases_path.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            LOG.exception("Failed to decode %s; starting fresh library.", self.phrases_path)
            return create_library(current_time_ms())
        return sanitize_library(payload, current_time_ms())

    def _write_library(self, library: dict[str, Any], create_backup: bool) -> None:
        if create_backup and self.phrases_path.exists():
            self._backup_current_file()

        payload = json.dumps(library, ensure_ascii=True, indent=2, sort_keys=True)
        with NamedTemporaryFile(
            "w",
            encoding="utf-8",
            dir=self.data_dir,
            prefix="phrases.",
            suffix=".tmp",
            delete=False,
        ) as handle:
            handle.write(payload)
            handle.write("\n")
            handle.flush()
            handle_name = handle.name
            try:
                os.fsync(handle.fileno())
            except OSError:
                LOG.warning("fsync failed for temporary phrases file %s", handle_name)
        Path(handle_name).replace(self.phrases_path)

    def _backup_current_file(self) -> None:
        timestamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S.%fZ")
        shutil.copy2(self.phrases_path, self.backups_dir / f"phrases-{timestamp}.json")


class HvptHTTPServer(ThreadingHTTPServer):
    """Typed server that exposes the phrase store and static root."""

    allow_reuse_address = True

    def __init__(
        self,
        server_address: tuple[str, int],
        store: PhraseStore,
        static_root: str | Path,
    ):
        self.store = store
        self.static_root = Path(static_root).resolve()
        self.go_rate_lock = threading.Lock()
        self.go_rate_by_client: dict[str, list[float]] = {}
        super().__init__(server_address, HvptRequestHandler)


class HvptRequestHandler(SimpleHTTPRequestHandler):
    """Serves the HVPT UI plus same-origin JSON and audio endpoints."""

    server_version = "HVPTCoach/1.0"

    def __init__(self, *args: Any, directory: str | None = None, **kwargs: Any):
        super().__init__(*args, directory=str(Path.cwd()), **kwargs)

    def translate_path(self, path: str) -> str:
        relative = urlsplit(path).path.lstrip("/")
        root = self.server.static_root
        candidate = (root / relative).resolve()
        if candidate == root or root in candidate.parents:
            return str(candidate)
        return str(root)

    def log_message(self, format_string: str, *args: Any) -> None:
        LOG.info("%s - %s", self.address_string(), format_string % args)

    def do_OPTIONS(self) -> None:  # noqa: N802
        self.send_response(HTTPStatus.NO_CONTENT.value)
        self.send_header("Allow", "GET, POST, PUT, DELETE, OPTIONS")
        self.send_header("Content-Length", "0")
        self.end_headers()

    def do_GET(self) -> None:  # noqa: N802
        raw_path = urlsplit(self.path).path
        if raw_path == "/health":
            self._write_json(HTTPStatus.OK, self.server.store.get_health())
            return

        path = self._normalize_api_path(raw_path)
        if path == "/bootstrap":
            self._write_json(HTTPStatus.OK, self.server.store.bootstrap())
            return
        if path.startswith("/audio/"):
            self._handle_audio(path.removeprefix("/audio/"))
            return
        if path.startswith("/images/"):
            self._handle_image(path.removeprefix("/images/"))
            return

        super().do_GET()

    def do_POST(self) -> None:  # noqa: N802
        path = self._normalize_api_path(urlsplit(self.path).path)
        try:
            if path == "/generate":
                payload = self._read_json_body()
                response = self.server.store.generate_variants(payload)
                self._write_json(HTTPStatus.OK, response)
                return
            if path == "/recording":
                content = self._read_raw_body(MAX_RECORDING_BYTES)
                content_type = normalize_text(self.headers.get("Content-Type"))
                ext = audio_extension_for_content_type(content_type)
                result = self.server.store.save_recording(content, extension=ext)
                self._write_json(HTTPStatus.CREATED, result)
                return
            if path == "/transcribe-go":
                if not self._allow_go_transcription():
                    self._write_error(HTTPStatus.TOO_MANY_REQUESTS, "Too many GO transcription requests. Try again shortly.")
                    return
                content = self._read_raw_body(MAX_GO_RECORDING_BYTES)
                content_type = normalize_text(self.headers.get("Content-Type"))
                if not content_type.lower().startswith("audio/"):
                    raise ValidationError("GO transcription requires an audio content type.")
                ext = transcription_extension_for_content_type(content_type)
                result = self.server.store.transcribe_go(content, extension=ext)
                self._write_json(HTTPStatus.OK, result)
                return
            if path == "/decks":
                payload = self._read_json_body()
                deck = self.server.store.create_deck(payload)
                self._write_json(HTTPStatus.CREATED, {"deck": deck})
                return
            match = re.match(r"^/decks/([a-zA-Z0-9]+)/phrases$", path)
            if match:
                payload = self._read_json_body()
                phrase = self.server.store.save_phrase(match.group(1), payload)
                self._write_json(HTTPStatus.CREATED, {"phrase": phrase})
                return
            match = re.match(r"^/decks/([a-zA-Z0-9]+)/phrases/([A-Za-z0-9]+)/image$", path)
            if match:
                payload = self._read_json_body()
                response = self.server.store.generate_phrase_image(match.group(1), match.group(2), payload)
                self._write_json(HTTPStatus.OK, response)
                return
            match = re.match(r"^/decks/([a-zA-Z0-9]+)/phrases/batch$", path)
            if match:
                payload = self._read_json_body()
                phrases = self.server.store.save_phrases_batch(match.group(1), payload)
                self._write_json(HTTPStatus.CREATED, {"phrases": phrases})
                return
            match = re.match(r"^/decks/([a-zA-Z0-9]+)/groups$", path)
            if match:
                payload = self._read_json_body()
                group = self.server.store.create_group(match.group(1), payload)
                self._write_json(HTTPStatus.CREATED, {"group": group})
                return
        except ValidationError as exc:
            self._write_error(HTTPStatus.BAD_REQUEST, str(exc))
            return
        except ServiceConfigError as exc:
            self._write_error(HTTPStatus.SERVICE_UNAVAILABLE, str(exc))
            return
        except json.JSONDecodeError:
            self._write_error(HTTPStatus.BAD_REQUEST, "Request body must be valid JSON.")
            return
        except Exception as exc:  # pragma: no cover - external API failures are environment dependent
            LOG.exception("POST handler failed.")
            self._write_error(HTTPStatus.BAD_GATEWAY, self._error_message(exc))
            return

        self._write_error(HTTPStatus.NOT_FOUND, "Not found.")

    def do_PUT(self) -> None:  # noqa: N802
        path = self._normalize_api_path(urlsplit(self.path).path)
        try:
            match = re.match(r"^/decks/([a-zA-Z0-9]+)$", path)
            if match:
                payload = self._read_json_body()
                deck = self.server.store.rename_deck(match.group(1), payload)
                self._write_json(HTTPStatus.OK, {"deck": deck})
                return
            match = re.match(r"^/decks/([a-zA-Z0-9]+)/phrases/([A-Za-z0-9]+)$", path)
            if match:
                payload = self._read_json_body()
                phrase = self.server.store.save_phrase(
                    match.group(1), payload, phrase_id=match.group(2)
                )
                self._write_json(HTTPStatus.OK, {"phrase": phrase})
                return
            match = re.match(r"^/decks/([a-zA-Z0-9]+)/groups/([A-Za-z0-9]+)$", path)
            if match:
                payload = self._read_json_body()
                group = self.server.store.update_group(match.group(1), match.group(2), payload)
                self._write_json(HTTPStatus.OK, {"group": group})
                return
        except ValidationError as exc:
            self._write_error(HTTPStatus.BAD_REQUEST, str(exc))
            return
        except json.JSONDecodeError:
            self._write_error(HTTPStatus.BAD_REQUEST, "Request body must be valid JSON.")
            return
        except Exception as exc:  # pragma: no cover
            LOG.exception("PUT handler failed.")
            self._write_error(HTTPStatus.BAD_GATEWAY, self._error_message(exc))
            return

        self._write_error(HTTPStatus.NOT_FOUND, "Not found.")

    def do_DELETE(self) -> None:  # noqa: N802
        path = self._normalize_api_path(urlsplit(self.path).path)
        try:
            match = re.match(r"^/decks/([a-zA-Z0-9]+)$", path)
            if match:
                deleted = self.server.store.delete_deck(match.group(1))
                if not deleted:
                    self._write_error(HTTPStatus.NOT_FOUND, "Deck not found.")
                    return
                self._write_json(HTTPStatus.OK, {"deleted": True, "id": match.group(1)})
                return
            match = re.match(r"^/decks/([a-zA-Z0-9]+)/phrases/([A-Za-z0-9]+)$", path)
            if match:
                deleted = self.server.store.delete_phrase(match.group(1), match.group(2))
                if not deleted:
                    self._write_error(HTTPStatus.NOT_FOUND, "Phrase not found.")
                    return
                self._write_json(HTTPStatus.OK, {"deleted": True, "id": match.group(2)})
                return
            match = re.match(r"^/decks/([a-zA-Z0-9]+)/groups/([A-Za-z0-9]+)$", path)
            if match:
                deleted = self.server.store.delete_group(match.group(1), match.group(2))
                if not deleted:
                    self._write_error(HTTPStatus.NOT_FOUND, "Group not found.")
                    return
                self._write_json(HTTPStatus.OK, {"deleted": True, "id": match.group(2)})
                return
        except ValidationError as exc:
            self._write_error(HTTPStatus.BAD_REQUEST, str(exc))
            return
        except Exception as exc:  # pragma: no cover
            LOG.exception("DELETE handler failed.")
            self._write_error(HTTPStatus.BAD_GATEWAY, self._error_message(exc))
            return

        self._write_error(HTTPStatus.NOT_FOUND, "Not found.")

    def _handle_audio(self, file_name: str) -> None:
        path = self.server.store.audio_path_for_name(file_name)
        if path is None:
            self._write_error(HTTPStatus.NOT_FOUND, "Audio clip not found.")
            return

        content = path.read_bytes()
        if file_name.endswith(".webm"):
            content_type = "audio/webm"
        elif file_name.endswith(".ogg"):
            content_type = "audio/ogg"
        elif file_name.endswith(".wav"):
            content_type = "audio/wav"
        elif file_name.endswith(".m4a") or file_name.endswith(".mp4"):
            content_type = "audio/mp4"
        elif file_name.endswith(".aac"):
            content_type = "audio/aac"
        else:
            content_type = "audio/mpeg"
        self.send_response(HTTPStatus.OK.value)
        self.send_header("Content-Type", content_type)
        self.send_header("Cache-Control", "public, max-age=31536000, immutable")
        self.send_header("Content-Length", str(len(content)))
        self.end_headers()
        self.wfile.write(content)

    def _handle_image(self, file_name: str) -> None:
        path = self.server.store.image_path_for_name(file_name)
        if path is None:
            self._write_error(HTTPStatus.NOT_FOUND, "Image not found.")
            return

        content = path.read_bytes()
        suffix = path.suffix.lower()
        if suffix in {".jpg", ".jpeg"}:
            content_type = "image/jpeg"
        elif suffix == ".webp":
            content_type = "image/webp"
        else:
            content_type = "image/png"
        self.send_response(HTTPStatus.OK.value)
        self.send_header("Content-Type", content_type)
        self.send_header("Cache-Control", "public, max-age=31536000, immutable")
        self.send_header("Content-Length", str(len(content)))
        self.end_headers()
        self.wfile.write(content)

    def _normalize_api_path(self, raw_path: str) -> str:
        for prefix in ("/index/hvpt/api", "/hvpt/api", "/api"):
            if raw_path == prefix:
                return "/"
            if raw_path.startswith(prefix + "/"):
                return raw_path[len(prefix) :]
        return raw_path

    def _allow_go_transcription(self) -> bool:
        now = time.monotonic()
        window_start = now - GO_TRANSCRIBE_RATE_WINDOW_SECONDS
        client_key = self._client_rate_key()

        with self.server.go_rate_lock:
            recent = [
                timestamp
                for timestamp in self.server.go_rate_by_client.get(client_key, [])
                if timestamp >= window_start
            ]
            if len(recent) >= GO_TRANSCRIBE_RATE_LIMIT:
                self.server.go_rate_by_client[client_key] = recent
                return False
            recent.append(now)
            self.server.go_rate_by_client[client_key] = recent
        return True

    def _client_rate_key(self) -> str:
        forwarded_for = normalize_text(self.headers.get("X-Forwarded-For"))
        if forwarded_for:
            return forwarded_for.split(",", 1)[0].strip()
        return self.client_address[0] if self.client_address else "unknown"

    def _read_json_body(self) -> Any:
        header = self.headers.get("Content-Length")
        if header is None:
            raise ValidationError("Content-Length header is required.")

        try:
            content_length = int(header, 10)
        except ValueError as exc:
            raise ValidationError("Content-Length header must be a non-negative integer.") from exc

        if content_length < 0:
            raise ValidationError("Content-Length header must be a non-negative integer.")
        if content_length > MAX_REQUEST_BYTES:
            raise ValidationError("Request body is too large.")

        body = self.rfile.read(content_length)
        return json.loads(body.decode("utf-8"))

    def _read_raw_body(self, max_bytes: int) -> bytes:
        header = self.headers.get("Content-Length")
        if header is None:
            raise ValidationError("Content-Length header is required.")
        try:
            content_length = int(header, 10)
        except ValueError as exc:
            raise ValidationError("Content-Length header must be a non-negative integer.") from exc
        if content_length < 0:
            raise ValidationError("Content-Length header must be a non-negative integer.")
        if content_length > max_bytes:
            raise ValidationError("Request body is too large.")
        return self.rfile.read(content_length)

    def _write_json(self, status: HTTPStatus, payload: Any) -> None:
        body = json.dumps(payload, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
        self.send_response(status.value)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _write_error(self, status: HTTPStatus, message: str) -> None:
        self._write_json(status, {"error": message, "status": status.value})

    def _error_message(self, exc: Exception) -> str:
        message = normalize_text(getattr(exc, "message", "")) or normalize_text(str(exc))
        return message or "Unexpected upstream failure."


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="HVPT phrase and audio cache service.")
    subparsers = parser.add_subparsers(dest="command", required=True)

    serve_parser = subparsers.add_parser("serve", help="Run the HTTP service.")
    serve_parser.add_argument("--host", default="127.0.0.1", help="Host interface to bind.")
    serve_parser.add_argument("--port", type=int, default=8792, help="TCP port to bind.")
    serve_parser.add_argument(
        "--data-dir",
        default="/var/lib/russian-hvpt-coach",
        help="Directory for phrases.json, backups, and cached audio clips.",
    )
    serve_parser.add_argument(
        "--static-root",
        default=".",
        help="Static root for local direct-service testing.",
    )
    serve_parser.add_argument(
        "--model",
        default=normalize_text(os.environ.get("OPENAI_TTS_MODEL")) or DEFAULT_MODEL,
        help=f"TTS model to use. Default: {DEFAULT_MODEL}",
    )
    serve_parser.add_argument(
        "--image-model",
        default=normalize_text(os.environ.get("OPENAI_IMAGE_MODEL")) or DEFAULT_IMAGE_MODEL,
        help=f"Image model to use. Default: {DEFAULT_IMAGE_MODEL}",
    )
    serve_parser.add_argument(
        "--transcription-model",
        default=normalize_text(os.environ.get("OPENAI_TRANSCRIPTION_MODEL")) or DEFAULT_TRANSCRIPTION_MODEL,
        help=f"Speech-to-text model to use for GO detection. Default: {DEFAULT_TRANSCRIPTION_MODEL}",
    )
    return parser


def serve(args: argparse.Namespace) -> int:
    store = PhraseStore(
        args.data_dir,
        model=args.model,
        image_model=args.image_model,
        transcription_model=args.transcription_model,
    )
    server = HvptHTTPServer((args.host, args.port), store, args.static_root)
    LOG.info(
        "Serving HVPT Coach on http://%s:%s using %s",
        args.host,
        args.port,
        args.data_dir,
    )
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        LOG.info("Shutdown requested.")
    finally:
        server.server_close()
    return 0


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")
    if args.command == "serve":
        return serve(args)
    parser.error(f"Unsupported command: {args.command}")
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
