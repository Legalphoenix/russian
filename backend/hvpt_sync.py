#!/usr/bin/env python3
"""HVPT phrase library and OpenAI TTS cache service."""

from __future__ import annotations

import argparse
import hashlib
import json
import logging
import os
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

MAX_REQUEST_BYTES = 128 * 1024
MAX_TEXT_LENGTH = 4096
MAX_NOTE_LENGTH = 240
MAX_INSTRUCTIONS_LENGTH = 1200
MAX_PHRASE_COUNT = 500
DEFAULT_MODEL = "gpt-4o-mini-tts-2025-12-15"
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
LOG = logging.getLogger("hvpt_sync")


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


def create_library(now_ms: int = 0) -> dict[str, Any]:
    return {
        "version": 1,
        "updatedAt": now_ms,
        "phrases": [],
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


def validate_phrase_payload(payload: Any, *, phrase_id: str | None = None, existing_created_at: int | None = None) -> dict[str, Any]:
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
    now_ms = current_time_ms()
    created_at = existing_created_at if existing_created_at is not None else now_ms

    return {
        "id": phrase_id or uuid.uuid4().hex[:12],
        "title": title_for_phrase(text),
        "text": text,
        "note": note,
        "instructions": instructions,
        "speed": speed,
        "voices": voices,
        "createdAt": created_at,
        "updatedAt": now_ms,
    }


def sanitize_library(payload: Any, now_ms: int | None = None) -> dict[str, Any]:
    stamp = current_time_ms() if now_ms is None else now_ms
    base = create_library(stamp)
    if not isinstance(payload, dict):
        return base

    base["updatedAt"] = max(0, int(number_or(payload.get("updatedAt"), stamp)))
    phrases = payload.get("phrases")
    if not isinstance(phrases, list):
        return base

    sanitized: list[dict[str, Any]] = []
    seen_ids: set[str] = set()
    for item in phrases:
        if not isinstance(item, dict):
            continue
        phrase_id = normalize_text(item.get("id")) or uuid.uuid4().hex[:12]
        if phrase_id in seen_ids:
            continue
        try:
            sanitized_item = validate_phrase_payload(
                item,
                phrase_id=phrase_id,
                existing_created_at=max(0, int(number_or(item.get("createdAt"), stamp))),
            )
        except ValidationError:
            continue
        sanitized_item["updatedAt"] = max(
            sanitized_item["createdAt"],
            int(number_or(item.get("updatedAt"), sanitized_item["updatedAt"])),
        )
        seen_ids.add(phrase_id)
        sanitized.append(sanitized_item)

    base["phrases"] = sorted(sanitized, key=lambda item: item["updatedAt"], reverse=True)[:MAX_PHRASE_COUNT]
    return base


class PhraseStore:
    """Stores saved phrases and cached audio variants."""

    def __init__(self, data_dir: str | Path, model: str = DEFAULT_MODEL):
        self.data_dir = Path(data_dir)
        self.data_dir.mkdir(parents=True, exist_ok=True)
        self.audio_dir = self.data_dir / "audio"
        self.audio_dir.mkdir(parents=True, exist_ok=True)
        self.phrases_path = self.data_dir / "phrases.json"
        self.backups_dir = self.data_dir / "backups"
        self.backups_dir.mkdir(parents=True, exist_ok=True)
        self.model = model
        self._lock = threading.Lock()
        self._client: OpenAI | None = None

    def get_health(self) -> dict[str, Any]:
        return {
            "status": "ok",
            "dataDir": str(self.data_dir),
            "model": self.model,
            "phraseCount": len(self.list_phrases()),
            "openaiInstalled": OpenAI is not None,
            "openaiConfigured": bool(normalize_text(os.environ.get("OPENAI_API_KEY"))),
            "ttsReady": self.is_tts_ready(),
        }

    def is_tts_ready(self) -> bool:
        return OpenAI is not None and bool(normalize_text(os.environ.get("OPENAI_API_KEY")))

    def bootstrap(self) -> dict[str, Any]:
        return {
            "availableVoices": list(BUILT_IN_VOICES),
            "defaultVoices": list(DEFAULT_VOICES),
            "defaultSpeed": DEFAULT_SPEED,
            "model": self.model,
            "ttsReady": self.is_tts_ready(),
            "phrases": self.list_phrases(),
        }

    def list_phrases(self) -> list[dict[str, Any]]:
        with self._lock:
            return list(self._read_library()["phrases"])

    def save_phrase(self, payload: Any, phrase_id: str | None = None) -> dict[str, Any]:
        with self._lock:
            library = self._read_library()
            existing = None
            if phrase_id:
                existing = next((item for item in library["phrases"] if item["id"] == phrase_id), None)
                if existing is None:
                    raise ValidationError("Phrase not found.")
            elif len(library["phrases"]) >= MAX_PHRASE_COUNT:
                raise ValidationError(f"Save limit reached ({MAX_PHRASE_COUNT} phrases).")

            saved = validate_phrase_payload(
                payload,
                phrase_id=phrase_id,
                existing_created_at=existing["createdAt"] if existing else None,
            )
            phrases = [item for item in library["phrases"] if item["id"] != saved["id"]]
            phrases.append(saved)
            library["phrases"] = sorted(phrases, key=lambda item: item["updatedAt"], reverse=True)
            library["updatedAt"] = current_time_ms()
            self._write_library(library, create_backup=self.phrases_path.exists())
            return saved

    def delete_phrase(self, phrase_id: str) -> bool:
        with self._lock:
            library = self._read_library()
            phrases = [item for item in library["phrases"] if item["id"] != phrase_id]
            if len(phrases) == len(library["phrases"]):
                return False
            library["phrases"] = phrases
            library["updatedAt"] = current_time_ms()
            self._write_library(library, create_backup=self.phrases_path.exists())
            return True

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

    def audio_path_for_name(self, file_name: str) -> Path | None:
        candidate = normalize_text(file_name)
        if not candidate or "/" in candidate or "\\" in candidate:
            return None
        path = (self.audio_dir / candidate).resolve()
        if path.parent != self.audio_dir.resolve() or not path.exists():
            return None
        return path

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

    def _read_library(self) -> dict[str, Any]:
        if not self.phrases_path.exists():
            return create_library(0)
        payload = json.loads(self.phrases_path.read_text(encoding="utf-8"))
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

        super().do_GET()

    def do_POST(self) -> None:  # noqa: N802
        path = self._normalize_api_path(urlsplit(self.path).path)
        try:
            if path == "/generate":
                payload = self._read_json_body()
                response = self.server.store.generate_variants(payload)
                self._write_json(HTTPStatus.OK, response)
                return
            if path == "/phrases":
                payload = self._read_json_body()
                phrase = self.server.store.save_phrase(payload)
                self._write_json(HTTPStatus.CREATED, {"phrase": phrase})
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
        prefix = "/phrases/"
        if not path.startswith(prefix):
            self._write_error(HTTPStatus.NOT_FOUND, "Not found.")
            return

        phrase_id = normalize_text(path.removeprefix(prefix))
        try:
            payload = self._read_json_body()
            phrase = self.server.store.save_phrase(payload, phrase_id=phrase_id)
            self._write_json(HTTPStatus.OK, {"phrase": phrase})
        except ValidationError as exc:
            self._write_error(HTTPStatus.BAD_REQUEST, str(exc))
        except json.JSONDecodeError:
            self._write_error(HTTPStatus.BAD_REQUEST, "Request body must be valid JSON.")
        except Exception as exc:  # pragma: no cover - depends on filesystem state
            LOG.exception("PUT handler failed.")
            self._write_error(HTTPStatus.BAD_GATEWAY, self._error_message(exc))

    def do_DELETE(self) -> None:  # noqa: N802
        path = self._normalize_api_path(urlsplit(self.path).path)
        prefix = "/phrases/"
        if not path.startswith(prefix):
            self._write_error(HTTPStatus.NOT_FOUND, "Not found.")
            return

        phrase_id = normalize_text(path.removeprefix(prefix))
        deleted = self.server.store.delete_phrase(phrase_id)
        if not deleted:
            self._write_error(HTTPStatus.NOT_FOUND, "Phrase not found.")
            return
        self._write_json(HTTPStatus.OK, {"deleted": True, "id": phrase_id})

    def _handle_audio(self, file_name: str) -> None:
        path = self.server.store.audio_path_for_name(file_name)
        if path is None:
            self._write_error(HTTPStatus.NOT_FOUND, "Audio clip not found.")
            return

        content = path.read_bytes()
        self.send_response(HTTPStatus.OK.value)
        self.send_header("Content-Type", "audio/mpeg")
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
    return parser


def serve(args: argparse.Namespace) -> int:
    store = PhraseStore(args.data_dir, model=args.model)
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
