#!/usr/bin/env python3
"""Dependency-free sync service for Russian Pronunciation Coach progress."""

from __future__ import annotations

import argparse
import json
import logging
import math
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

MAX_REQUEST_BYTES = 512 * 1024
HISTORY_LIMIT = 240
VIEW_MODES = ("normal", "syllables", "both")
VIEW_MODE_SET = frozenset(VIEW_MODES)
CHUNK_IDS = (
    "s1-c1",
    "s1-c2",
    "s1-c3",
    "s1-c4",
    "s1-c5",
    "s1-c6",
    "s1-c7",
    "s1-c8",
    "s1-c9",
    "s1-c10",
    "s1-c11",
    "s1-c12",
    "s1-c13",
    "s2-c1",
    "s2-c2",
    "s2-c3",
    "s2-c4",
    "s2-c5",
    "s2-c6",
    "s2-c7",
    "s2-c8",
    "s2-c9",
    "s3-c1",
    "s3-c2",
    "s3-c3",
    "s3-c4",
    "s3-c5",
    "s3-c6",
    "s4-c1",
    "s5-c1",
    "s5-c2",
    "s5-c3",
    "s5-c4",
    "s5-c5",
    "s5-c6",
    "s5-c7",
    "s5-c8",
    "s5-c9",
    "s5-c10",
    "s5-c11",
    "s5-c12",
    "s5-c13",
    "s5-c14",
    "s5-c15",
    "s5-c16",
    "s5-c17",
    "s5-c18",
    "s5-c19",
    "s5-c20",
)
CHUNK_ID_SET = frozenset(CHUNK_IDS)
DEFAULT_VIEW_MODE = "normal"
DEFAULT_CURRENT_CHUNK_ID = CHUNK_IDS[0]
LOG = logging.getLogger("pronunciation_sync")


class ValidationError(ValueError):
    """Raised when a request body is not valid enough to store."""


def current_time_ms() -> int:
    return int(time.time() * 1000)


def is_finite_number(value: Any) -> bool:
    return not isinstance(value, bool) and isinstance(value, (int, float)) and math.isfinite(value)


def number_or(value: Any, fallback: int | float) -> int | float:
    if is_finite_number(value):
        return value
    return fallback


def clamp(value: int | float, minimum: int | float, maximum: int | float) -> int | float:
    return min(maximum, max(minimum, value))


def create_chunk_stats() -> dict[str, Any]:
    return {
        "attempts": 0,
        "ratingTotal": 0,
        "lastRating": 0,
        "lastPracticedAt": 0,
    }


def create_default_state(now_ms: int = 0) -> dict[str, Any]:
    return {
        "version": 1,
        "createdAt": now_ms,
        "updatedAt": now_ms,
        "settings": {
            "viewMode": DEFAULT_VIEW_MODE,
            "currentChunkId": DEFAULT_CURRENT_CHUNK_ID,
        },
        "history": [],
        "byChunk": {chunk_id: create_chunk_stats() for chunk_id in CHUNK_IDS},
    }


def copy_chunk_stats(target: dict[str, Any], source: Any) -> None:
    if not isinstance(source, dict):
        return

    target["attempts"] = max(0, int(number_or(source.get("attempts"), target["attempts"])))
    target["ratingTotal"] = max(
        0,
        int(number_or(source.get("ratingTotal"), target["ratingTotal"])),
    )
    target["lastRating"] = int(clamp(number_or(source.get("lastRating"), target["lastRating"]), 0, 5))
    target["lastPracticedAt"] = max(
        0,
        int(number_or(source.get("lastPracticedAt"), target["lastPracticedAt"])),
    )


def validate_chunk_id(value: Any) -> str | None:
    if isinstance(value, str) and value in CHUNK_ID_SET:
        return value
    return None


def sanitize_history(items: Any, now_ms: int) -> list[dict[str, Any]]:
    if not isinstance(items, list):
        return []

    sanitized: list[dict[str, Any]] = []
    for item in items:
        if not isinstance(item, dict):
            continue
        chunk_id = validate_chunk_id(item.get("chunkId"))
        if chunk_id is None:
            raise ValidationError("History contains an unknown chunkId.")
        rating = int(clamp(number_or(item.get("rating"), 0), 1, 5))
        sanitized.append(
            {
                "chunkId": chunk_id,
                "rating": rating,
                "at": max(0, int(number_or(item.get("at"), now_ms))),
            }
        )

    return sanitized[-HISTORY_LIMIT:]


def sanitize_state(parsed: Any, now_ms: int | None = None) -> dict[str, Any]:
    fallback_now = current_time_ms() if now_ms is None else now_ms
    base = create_default_state(fallback_now)
    if not isinstance(parsed, dict):
        return base

    base["createdAt"] = max(0, int(number_or(parsed.get("createdAt"), base["createdAt"])))
    base["updatedAt"] = max(0, int(number_or(parsed.get("updatedAt"), base["updatedAt"])))

    settings = parsed.get("settings")
    if isinstance(settings, dict):
        view_mode = settings.get("viewMode")
        if view_mode in VIEW_MODE_SET:
            base["settings"]["viewMode"] = view_mode
        elif view_mode is not None:
            raise ValidationError("Unknown viewMode.")

        current_chunk_id = settings.get("currentChunkId")
        if current_chunk_id is not None:
            if current_chunk_id not in CHUNK_ID_SET:
                raise ValidationError("Unknown currentChunkId.")
            base["settings"]["currentChunkId"] = current_chunk_id

    by_chunk = parsed.get("byChunk")
    if isinstance(by_chunk, dict):
        unknown_keys = [key for key in by_chunk if key not in CHUNK_ID_SET]
        if unknown_keys:
            raise ValidationError("byChunk contains an unknown chunkId.")
        for chunk_id in CHUNK_IDS:
            copy_chunk_stats(base["byChunk"][chunk_id], by_chunk.get(chunk_id))

    base["history"] = sanitize_history(parsed.get("history"), fallback_now)
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
                import os

                os.fsync(handle.fileno())
            except OSError:
                LOG.warning("fsync failed for temporary file %s", handle_name)

        Path(handle_name).replace(self.progress_path)

    def _backup_current_file(self) -> None:
        timestamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S.%fZ")
        shutil.copy2(self.progress_path, self.backups_dir / f"progress-{timestamp}.json")


class ProgressRequestHandler(BaseHTTPRequestHandler):
    """HTTP API for pronunciation progress sync."""

    server_version = "PronunciationCoachSync/1.0"

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
            LOG.exception("Failed to persist pronunciation progress.")
            self._write_error(HTTPStatus.INTERNAL_SERVER_ERROR, f"Failed to persist progress: {exc}")
            return

        self._write_json(HTTPStatus.OK, progress)

    def log_message(self, format_string: str, *args: Any) -> None:
        LOG.info("%s - %s", self.address_string(), format_string % args)

    def _handle_get_progress(self) -> None:
        try:
            progress = self.server.store.load()
        except OSError as exc:
            LOG.exception("Failed to load pronunciation progress.")
            self._write_error(HTTPStatus.INTERNAL_SERVER_ERROR, f"Failed to load progress: {exc}")
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
    parser = argparse.ArgumentParser(description="Russian Pronunciation Coach progress sync service.")
    subparsers = parser.add_subparsers(dest="command", required=True)

    serve_parser = subparsers.add_parser("serve", help="Run the HTTP sync service.")
    serve_parser.add_argument(
        "--host",
        default="127.0.0.1",
        help="Host interface to bind. Default: 127.0.0.1",
    )
    serve_parser.add_argument(
        "--port",
        type=int,
        default=8791,
        help="TCP port to bind. Default: 8791",
    )
    serve_parser.add_argument(
        "--data-dir",
        default="/var/lib/russian-pronunciation-coach",
        help="Directory for progress.json and timestamped backups.",
    )
    return parser


def serve(args: argparse.Namespace) -> int:
    store = ProgressStore(args.data_dir)
    server = ProgressHTTPServer((args.host, args.port), store)
    LOG.info(
        "Serving Russian Pronunciation Coach sync on http://%s:%s using %s",
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
