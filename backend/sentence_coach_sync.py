#!/usr/bin/env python3
"""Dependency-free sync service for Russian Sentence Coach progress.

Schema v2: sentence IDs are free-form strings supplied by the client (custom
sentences from the user's own bank, HVPT phrases pulled from the HVPT API, or
anything else). The frontend picks stable composite keys (e.g. "custom:<uuid>"
or "hvpt:<phraseId>") and the server simply preserves them. Legacy v1 payloads
using the old hard-coded sentence set still load — their keys are treated the
same as any other free-form id.
"""

from __future__ import annotations

import argparse
import json
import logging
import math
import os
import re
import shutil
import threading
import time
from datetime import datetime, timezone
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from tempfile import NamedTemporaryFile
from typing import Any
from urllib.parse import urlsplit

MAX_REQUEST_BYTES = 1024 * 1024  # 1 MB — custom sentence banks can be big.
HISTORY_LIMIT = 240
MAX_MULTI_HIDDEN = 6
MAX_CUSTOM_SENTENCES = 1000
MAX_SENTENCE_TEXT = 500
MAX_SENTENCE_ENGLISH = 500
MAX_SENTENCE_KEY = 160
SENTENCE_KEY_RE = re.compile(r"^[A-Za-z0-9._:\-]{1,160}$")

MODE_ORDER = ("copy", "flash", "listen")
MODE_SET = frozenset(MODE_ORDER)
MODE_ALIASES = {"single": "flash", "multi": "flash"}
SETTINGS_MODE_SET = MODE_SET | frozenset(MODE_ALIASES.keys())

SOURCE_KIND_SET = frozenset(("custom", "hvpt"))
ORDER_MODE_SET = frozenset(("shuffle", "sequential"))

LOG = logging.getLogger("sentence_coach_sync")


class ValidationError(ValueError):
    """Raised when a request body is not valid enough to store."""


def current_time_ms() -> int:
    return int(time.time() * 1000)


def is_finite_number(value: Any) -> bool:
    return (
        not isinstance(value, bool)
        and isinstance(value, (int, float))
        and math.isfinite(value)
    )


def number_or(value: Any, fallback: int | float) -> int | float:
    if is_finite_number(value):
        return value
    return fallback


def clamp(value: int | float, minimum: int | float, maximum: int | float) -> int | float:
    return min(maximum, max(minimum, value))


def normalize_key(value: Any) -> str:
    """Return a safe, server-side canonical form of a sentence key.

    Accepts alphanumerics, dot, colon, underscore, and dash; anything else is
    stripped so the key is always safe to use as a JSON object key.
    """
    raw = str(value or "").strip()
    if not raw:
        return ""
    if len(raw) > MAX_SENTENCE_KEY:
        raw = raw[:MAX_SENTENCE_KEY]
    cleaned = re.sub(r"[^A-Za-z0-9._:\-]", "", raw)
    return cleaned


def normalize_text(value: Any, limit: int) -> str:
    raw = str(value or "").strip()
    if len(raw) > limit:
        raw = raw[:limit]
    return raw


def coerce_mode(value: Any, fallback: str = "copy") -> str:
    if not isinstance(value, str):
        return fallback
    if value in MODE_SET:
        return value
    return MODE_ALIASES.get(value, fallback)


def create_aggregate_stats() -> dict[str, Any]:
    return {
        "attempts": 0,
        "totalAccuracy": 0,
        "totalWpm": 0,
        "totalMs": 0,
        "cleanAttempts": 0,
    }


def create_sentence_stats() -> dict[str, Any]:
    by_mode = {
        mode: {
            "attempts": 0,
            "totalAccuracy": 0,
            "totalWpm": 0,
            "lastSeenAt": 0,
            "bestAccuracy": 0,
        }
        for mode in MODE_ORDER
    }
    return {
        "attempts": 0,
        "totalAccuracy": 0,
        "bestAccuracy": 0,
        "lastSeenAt": 0,
        "byMode": by_mode,
    }


def create_default_state(now_ms: int = 0) -> dict[str, Any]:
    return {
        "version": 2,
        "createdAt": now_ms,
        "updatedAt": now_ms,
        "settings": {
            "mode": "copy",
            "hiddenWordCount": 1,
            "previewSeconds": 3,
            "sourceKind": "custom",
            "hvptDeckId": "",
            "hvptGroupId": "",
            "orderMode": "shuffle",
        },
        "totals": create_aggregate_stats(),
        "history": [],
        "byMode": {mode: create_aggregate_stats() for mode in MODE_ORDER},
        "bySentence": {},
        "customSentences": [],
    }


def copy_aggregate_stats(target: dict[str, Any], source: Any) -> None:
    if not isinstance(source, dict):
        return
    target["attempts"] = max(0, int(number_or(source.get("attempts"), target["attempts"])))
    target["totalAccuracy"] = max(
        0,
        float(number_or(source.get("totalAccuracy"), target["totalAccuracy"])),
    )
    target["totalWpm"] = max(0, float(number_or(source.get("totalWpm"), target["totalWpm"])))
    target["totalMs"] = max(0, int(number_or(source.get("totalMs"), target["totalMs"])))
    target["cleanAttempts"] = max(
        0,
        int(number_or(source.get("cleanAttempts"), target["cleanAttempts"])),
    )


def sanitize_history(items: Any, now_ms: int) -> list[dict[str, Any]]:
    if not isinstance(items, list):
        return []

    sanitized: list[dict[str, Any]] = []
    for item in items:
        if not isinstance(item, dict):
            continue
        key = normalize_key(item.get("sentenceKey") or item.get("sentenceId"))
        if not key:
            continue
        sanitized.append(
            {
                "sentenceKey": key,
                "mode": coerce_mode(item.get("mode"), "copy"),
                "accuracy": float(clamp(number_or(item.get("accuracy"), 0), 0, 100)),
                "wpm": max(0, float(number_or(item.get("wpm"), 0))),
                "timeMs": max(0, int(number_or(item.get("timeMs"), 0))),
                "errors": max(0, int(number_or(item.get("errors"), 0))),
                "clean": bool(item.get("clean")),
                "at": max(0, int(number_or(item.get("at"), now_ms))),
            }
        )
    return sanitized[-HISTORY_LIMIT:]


def sanitize_by_sentence(items: Any) -> dict[str, dict[str, Any]]:
    result: dict[str, dict[str, Any]] = {}
    if not isinstance(items, dict):
        return result
    for raw_key, raw_value in items.items():
        if not isinstance(raw_value, dict):
            continue
        key = normalize_key(raw_key)
        if not key:
            continue
        target = create_sentence_stats()
        target["attempts"] = max(0, int(number_or(raw_value.get("attempts"), 0)))
        target["totalAccuracy"] = max(0, float(number_or(raw_value.get("totalAccuracy"), 0)))
        target["bestAccuracy"] = float(clamp(number_or(raw_value.get("bestAccuracy"), 0), 0, 100))
        target["lastSeenAt"] = max(0, int(number_or(raw_value.get("lastSeenAt"), 0)))

        source_by_mode = raw_value.get("byMode")
        if isinstance(source_by_mode, dict):
            for mode in MODE_ORDER:
                mode_source = source_by_mode.get(mode)
                if not isinstance(mode_source, dict):
                    # v1 used "single" / "multi" lane keys — fold them into flash.
                    legacy_modes = [
                        source_by_mode.get(legacy)
                        for legacy in MODE_ALIASES
                        if MODE_ALIASES[legacy] == mode
                    ]
                    legacy_modes = [item for item in legacy_modes if isinstance(item, dict)]
                    if not legacy_modes:
                        continue
                    mode_target = target["byMode"][mode]
                    for legacy_source in legacy_modes:
                        mode_target["attempts"] += max(
                            0, int(number_or(legacy_source.get("attempts"), 0))
                        )
                        mode_target["totalAccuracy"] += max(
                            0, float(number_or(legacy_source.get("totalAccuracy"), 0))
                        )
                        mode_target["totalWpm"] += max(
                            0, float(number_or(legacy_source.get("totalWpm"), 0))
                        )
                        mode_target["lastSeenAt"] = max(
                            mode_target["lastSeenAt"],
                            int(number_or(legacy_source.get("lastSeenAt"), 0)),
                        )
                        mode_target["bestAccuracy"] = max(
                            mode_target["bestAccuracy"],
                            float(
                                clamp(
                                    number_or(legacy_source.get("bestAccuracy"), 0), 0, 100
                                )
                            ),
                        )
                    continue
                mode_target = target["byMode"][mode]
                mode_target["attempts"] = max(
                    0, int(number_or(mode_source.get("attempts"), 0))
                )
                mode_target["totalAccuracy"] = max(
                    0,
                    float(number_or(mode_source.get("totalAccuracy"), 0)),
                )
                mode_target["totalWpm"] = max(
                    0, float(number_or(mode_source.get("totalWpm"), 0))
                )
                mode_target["lastSeenAt"] = max(
                    0, int(number_or(mode_source.get("lastSeenAt"), 0))
                )
                mode_target["bestAccuracy"] = float(
                    clamp(number_or(mode_source.get("bestAccuracy"), 0), 0, 100)
                )
        result[key] = target
    return result


def sanitize_custom_sentences(items: Any, now_ms: int) -> list[dict[str, Any]]:
    if not isinstance(items, list):
        return []
    seen: set[str] = set()
    cleaned: list[dict[str, Any]] = []
    for item in items:
        if not isinstance(item, dict):
            continue
        raw_id = str(item.get("id") or "").strip()
        id_ = normalize_key(raw_id)
        if not id_ or id_ in seen:
            continue
        text = normalize_text(item.get("text"), MAX_SENTENCE_TEXT)
        if not text:
            continue
        english = normalize_text(item.get("english"), MAX_SENTENCE_ENGLISH)
        created_at = max(0, int(number_or(item.get("createdAt"), now_ms)))
        updated_at = max(created_at, int(number_or(item.get("updatedAt"), now_ms)))
        cleaned.append(
            {
                "id": id_,
                "text": text,
                "english": english,
                "createdAt": created_at,
                "updatedAt": updated_at,
            }
        )
        seen.add(id_)
        if len(cleaned) >= MAX_CUSTOM_SENTENCES:
            break
    return cleaned


def sanitize_state(parsed: Any, now_ms: int | None = None) -> dict[str, Any]:
    fallback_now = current_time_ms() if now_ms is None else now_ms
    base = create_default_state(fallback_now)
    if not isinstance(parsed, dict):
        return base

    base["createdAt"] = max(
        0, int(number_or(parsed.get("createdAt"), base["createdAt"]))
    )
    base["updatedAt"] = max(
        0, int(number_or(parsed.get("updatedAt"), base["updatedAt"]))
    )

    settings = parsed.get("settings")
    if isinstance(settings, dict):
        base["settings"]["mode"] = coerce_mode(settings.get("mode"), base["settings"]["mode"])

        hidden_word_count = settings.get("hiddenWordCount")
        if not is_finite_number(hidden_word_count):
            hidden_word_count = settings.get("multiHiddenCount")
        base["settings"]["hiddenWordCount"] = int(
            clamp(
                number_or(hidden_word_count, base["settings"]["hiddenWordCount"]),
                1,
                MAX_MULTI_HIDDEN,
            )
        )
        base["settings"]["previewSeconds"] = int(
            clamp(
                number_or(settings.get("previewSeconds"), base["settings"]["previewSeconds"]),
                1,
                6,
            )
        )
        source_kind = settings.get("sourceKind")
        if isinstance(source_kind, str) and source_kind in SOURCE_KIND_SET:
            base["settings"]["sourceKind"] = source_kind
        deck_id = normalize_key(settings.get("hvptDeckId"))
        base["settings"]["hvptDeckId"] = deck_id if deck_id else ""
        group_id = normalize_key(settings.get("hvptGroupId"))
        base["settings"]["hvptGroupId"] = group_id if group_id else ""
        order_mode = settings.get("orderMode")
        if isinstance(order_mode, str) and order_mode in ORDER_MODE_SET:
            base["settings"]["orderMode"] = order_mode

    copy_aggregate_stats(base["totals"], parsed.get("totals"))
    base["history"] = sanitize_history(parsed.get("history"), fallback_now)

    by_mode = parsed.get("byMode")
    if isinstance(by_mode, dict):
        for mode in MODE_ORDER:
            copy_aggregate_stats(base["byMode"][mode], by_mode.get(mode))
        # Fold legacy single/multi lane totals into flash.
        for legacy, canonical in MODE_ALIASES.items():
            legacy_stats = by_mode.get(legacy)
            if not isinstance(legacy_stats, dict):
                continue
            canonical_target = base["byMode"][canonical]
            canonical_target["attempts"] += max(
                0, int(number_or(legacy_stats.get("attempts"), 0))
            )
            canonical_target["totalAccuracy"] += max(
                0, float(number_or(legacy_stats.get("totalAccuracy"), 0))
            )
            canonical_target["totalWpm"] += max(
                0, float(number_or(legacy_stats.get("totalWpm"), 0))
            )
            canonical_target["totalMs"] += max(
                0, int(number_or(legacy_stats.get("totalMs"), 0))
            )
            canonical_target["cleanAttempts"] += max(
                0, int(number_or(legacy_stats.get("cleanAttempts"), 0))
            )

    base["bySentence"] = sanitize_by_sentence(parsed.get("bySentence"))
    base["customSentences"] = sanitize_custom_sentences(
        parsed.get("customSentences"), fallback_now
    )

    return base


class ProgressStore:
    """Small atomic JSON store with timestamped backups."""

    def __init__(self, data_dir: str | Path):
        self.data_dir = Path(data_dir)
        self.data_dir.mkdir(parents=True, exist_ok=True)
        self.progress_path = self.data_dir / "progress.json"
        self.backups_dir = self.data_dir / "backups"
        self.backups_dir.mkdir(parents=True, exist_ok=True)
        self._lock = threading.Lock()

    def load(self) -> dict[str, Any]:
        with self._lock:
            if not self.progress_path.exists():
                return create_default_state(0)
            return self._read_current()

    def replace(self, candidate: Any) -> dict[str, Any]:
        if not isinstance(candidate, dict):
            raise ValidationError("Progress payload must be a JSON object.")

        progress = sanitize_state(candidate, current_time_ms())
        with self._lock:
            self._write(progress, create_backup=self.progress_path.exists())
        return progress

    def get_health(self) -> dict[str, Any]:
        updated_at = 0
        progress_exists = self.progress_path.exists()
        if progress_exists:
            try:
                updated_at = int(self._read_current().get("updatedAt", 0))
            except Exception:
                updated_at = 0
        return {
            "status": "ok",
            "progressExists": progress_exists,
            "progressPath": str(self.progress_path),
            "backupsPath": str(self.backups_dir),
            "updatedAt": updated_at,
        }

    def _read_current(self) -> dict[str, Any]:
        payload = json.loads(self.progress_path.read_text(encoding="utf-8"))
        return sanitize_state(payload, current_time_ms())

    def _write(self, progress: dict[str, Any], create_backup: bool) -> None:
        if create_backup and self.progress_path.exists():
            self._backup_current_file()

        payload = json.dumps(progress, ensure_ascii=True, indent=2, sort_keys=True)
        with NamedTemporaryFile(
            "w",
            encoding="utf-8",
            dir=self.data_dir,
            prefix="progress.",
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
                LOG.warning("fsync failed for temporary file %s", handle_name)

        Path(handle_name).replace(self.progress_path)

    def _backup_current_file(self) -> None:
        timestamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S.%fZ")
        shutil.copy2(
            self.progress_path,
            self.backups_dir / f"progress-{timestamp}.json",
        )


class ProgressRequestHandler(BaseHTTPRequestHandler):
    """HTTP API for sentence progress sync."""

    server_version = "SentenceCoachSync/2.0"

    def do_OPTIONS(self) -> None:  # noqa: N802
        self.send_response(HTTPStatus.NO_CONTENT.value)
        self.send_header("Allow", "GET, PUT, OPTIONS")
        self.send_header("Content-Length", "0")
        self.end_headers()

    def do_GET(self) -> None:  # noqa: N802
        path = urlsplit(self.path).path
        if path == "/progress":
            self._handle_get_progress()
            return
        if path == "/health":
            self._write_json(HTTPStatus.OK, self.server.store.get_health())
            return
        self._write_error(HTTPStatus.NOT_FOUND, "Not found.")

    def do_PUT(self) -> None:  # noqa: N802
        path = urlsplit(self.path).path
        if path != "/progress":
            self._write_error(HTTPStatus.NOT_FOUND, "Not found.")
            return

        try:
            payload = self._read_json_body()
            progress = self.server.store.replace(payload)
        except ValidationError as exc:
            self._write_error(HTTPStatus.BAD_REQUEST, str(exc))
            return
        except json.JSONDecodeError:
            self._write_error(HTTPStatus.BAD_REQUEST, "Request body must be valid JSON.")
            return
        except OSError as exc:
            LOG.exception("Failed to persist sentence progress.")
            self._write_error(
                HTTPStatus.INTERNAL_SERVER_ERROR,
                f"Failed to persist progress: {exc}",
            )
            return

        self._write_json(HTTPStatus.OK, progress)

    def log_message(self, format_string: str, *args: Any) -> None:
        LOG.info("%s - %s", self.address_string(), format_string % args)

    def _handle_get_progress(self) -> None:
        try:
            progress = self.server.store.load()
        except OSError as exc:
            LOG.exception("Failed to load sentence progress.")
            self._write_error(
                HTTPStatus.INTERNAL_SERVER_ERROR,
                f"Failed to load progress: {exc}",
            )
            return

        self._write_json(HTTPStatus.OK, progress)

    def _read_json_body(self) -> Any:
        content_length_header = self.headers.get("Content-Length")
        if content_length_header is None:
            raise ValidationError("Content-Length header is required.")

        try:
            content_length = int(content_length_header, 10)
        except ValueError as exc:
            raise ValidationError("Content-Length header must be a non-negative integer.") from exc

        if content_length < 0:
            raise ValidationError("Content-Length header must be a non-negative integer.")
        if content_length > MAX_REQUEST_BYTES:
            raise ValidationError("Request body is too large.")

        body = self.rfile.read(content_length)
        return json.loads(body.decode("utf-8"))

    def _write_json(self, status: HTTPStatus, payload: Any) -> None:
        body = json.dumps(payload, ensure_ascii=True, separators=(",", ":")).encode("utf-8")
        self.send_response(status.value)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _write_error(self, status: HTTPStatus, message: str) -> None:
        self._write_json(status, {"error": message, "status": status.value})


class ProgressHTTPServer(ThreadingHTTPServer):
    """Typed server that exposes the store to request handlers."""

    allow_reuse_address = True

    def __init__(self, server_address: tuple[str, int], store: ProgressStore):
        self.store = store
        super().__init__(server_address, ProgressRequestHandler)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Russian Sentence Coach progress sync service."
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    serve_parser = subparsers.add_parser(
        "serve",
        help="Run the HTTP sync service.",
    )
    serve_parser.add_argument(
        "--host",
        default="127.0.0.1",
        help="Host interface to bind. Default: 127.0.0.1",
    )
    serve_parser.add_argument(
        "--port",
        type=int,
        default=8787,
        help="TCP port to bind. Default: 8787",
    )
    serve_parser.add_argument(
        "--data-dir",
        default="/var/lib/russian-sentence-coach",
        help="Directory for progress.json and timestamped backups.",
    )
    return parser


def serve(args: argparse.Namespace) -> int:
    store = ProgressStore(args.data_dir)
    server = ProgressHTTPServer((args.host, args.port), store)
    LOG.info(
        "Serving Russian Sentence Coach sync on http://%s:%s using %s",
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
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s %(message)s",
    )
    if args.command == "serve":
        return serve(args)
    parser.error(f"Unsupported command: {args.command}")
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
