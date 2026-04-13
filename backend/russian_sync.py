#!/usr/bin/env python3
"""Generic sync service for all Russian trainers.

Provides GET/POST endpoints for each trainer's state, stored as validated
JSON blobs in per-trainer directories. Sits alongside the existing
pronunciation_sync.py and sentence_coach_sync.py services.

Endpoints:
  GET  /api/russian/{trainer}/progress  - Returns current state
  POST /api/russian/{trainer}/progress  - Replaces state (returns saved)
  POST /api/russian/{trainer}/reset     - Resets to empty state
  GET  /api/russian/health              - Health check

Supported trainers: tenses, possessives, colours, plurals
"""

from __future__ import annotations

import argparse
import json
import logging
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
LOG = logging.getLogger("russian_sync")

TRAINER_IDS = ("tenses", "possessives", "colours", "plurals")
TRAINER_ID_SET = frozenset(TRAINER_IDS)

# Keys that every trainer state must have (basic validation)
REQUIRED_KEYS = {"totalAnswered", "totalCorrect"}


def current_time_ms() -> int:
    return int(time.time() * 1000)


def create_default_state() -> dict[str, Any]:
    return {
        "version": 1,
        "createdAt": current_time_ms(),
        "updatedAt": current_time_ms(),
        "totalAnswered": 0,
        "totalCorrect": 0,
    }


def sanitize_state(raw: Any) -> dict[str, Any]:
    """Accept any valid JSON object that has the required keys."""
    if not isinstance(raw, dict):
        raise ValueError("State must be a JSON object.")

    total_answered = raw.get("totalAnswered", 0)
    if not isinstance(total_answered, (int, float)):
        total_answered = 0

    raw["totalAnswered"] = max(0, int(total_answered))
    raw["totalCorrect"] = max(0, int(raw.get("totalCorrect", 0)))
    raw["updatedAt"] = current_time_ms()

    if "createdAt" not in raw or not isinstance(raw.get("createdAt"), (int, float)):
        raw["createdAt"] = raw["updatedAt"]

    return raw


class TrainerStore:
    """Atomic JSON store per trainer with backups."""

    def __init__(self, data_dir: Path, trainer_id: str):
        self.dir = data_dir / trainer_id
        self.dir.mkdir(parents=True, exist_ok=True)
        self.path = self.dir / "progress.json"
        self.backups = self.dir / "backups"
        self.backups.mkdir(parents=True, exist_ok=True)
        self._lock = threading.Lock()

    def load(self) -> dict[str, Any]:
        with self._lock:
            if not self.path.exists():
                return create_default_state()
            try:
                return json.loads(self.path.read_text(encoding="utf-8"))
            except (json.JSONDecodeError, OSError):
                return create_default_state()

    def replace(self, candidate: Any) -> dict[str, Any]:
        state = sanitize_state(candidate)
        with self._lock:
            if self.path.exists():
                self._backup()
            self._write(state)
        return state

    def reset(self) -> dict[str, Any]:
        state = create_default_state()
        with self._lock:
            if self.path.exists():
                self._backup()
            self._write(state)
        return state

    def _backup(self) -> None:
        stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
        dest = self.backups / f"progress-{stamp}.json"
        try:
            import shutil
            shutil.copy2(self.path, dest)
            # Keep only last 20 backups
            backups = sorted(self.backups.glob("progress-*.json"))
            for old in backups[:-20]:
                old.unlink(missing_ok=True)
        except OSError:
            pass

    def _write(self, state: dict[str, Any]) -> None:
        payload = json.dumps(state, ensure_ascii=True, indent=2, sort_keys=True) + "\n"
        with NamedTemporaryFile("w", encoding="utf-8", dir=self.dir, prefix="progress.", suffix=".tmp", delete=False) as f:
            f.write(payload)
            f.flush()
            tmp_name = f.name
        Path(tmp_name).replace(self.path)


class SyncHandler(BaseHTTPRequestHandler):
    stores: dict[str, TrainerStore]

    def log_message(self, fmt: str, *args: Any) -> None:
        LOG.info(fmt, *args)

    def _cors_headers(self) -> None:
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def _json_response(self, status: int, body: Any) -> None:
        payload = json.dumps(body, ensure_ascii=True).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self._cors_headers()
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def _read_body(self) -> Any:
        length = int(self.headers.get("Content-Length", "0"))
        if length > MAX_REQUEST_BYTES:
            raise ValueError("Request too large")
        raw = self.rfile.read(length)
        return json.loads(raw)

    def do_OPTIONS(self) -> None:
        self.send_response(HTTPStatus.NO_CONTENT)
        self._cors_headers()
        self.end_headers()

    def do_GET(self) -> None:
        path = urlsplit(self.path).path.rstrip("/")

        if path == "/api/russian/health":
            self._json_response(200, {
                "status": "ok",
                "trainers": list(TRAINER_IDS),
                "timestamp": current_time_ms(),
            })
            return

        # /api/russian/{trainer}/progress
        parts = path.split("/")
        if len(parts) == 5 and parts[1] == "api" and parts[2] == "russian" and parts[4] == "progress":
            trainer_id = parts[3]
            if trainer_id not in TRAINER_ID_SET:
                self._json_response(404, {"error": f"Unknown trainer: {trainer_id}"})
                return
            self._json_response(200, self.stores[trainer_id].load())
            return

        self._json_response(404, {"error": "Not found"})

    def do_POST(self) -> None:
        path = urlsplit(self.path).path.rstrip("/")
        parts = path.split("/")

        if len(parts) < 5 or parts[1] != "api" or parts[2] != "russian":
            self._json_response(404, {"error": "Not found"})
            return

        trainer_id = parts[3]
        if trainer_id not in TRAINER_ID_SET:
            self._json_response(404, {"error": f"Unknown trainer: {trainer_id}"})
            return

        action = parts[4]
        store = self.stores[trainer_id]

        if action == "progress":
            try:
                body = self._read_body()
                saved = store.replace(body)
                self._json_response(200, saved)
            except (ValueError, json.JSONDecodeError) as exc:
                self._json_response(400, {"error": str(exc)})
            return

        if action == "reset":
            saved = store.reset()
            self._json_response(200, saved)
            return

        self._json_response(404, {"error": f"Unknown action: {action}"})


def main() -> None:
    parser = argparse.ArgumentParser(description="Russian trainer sync service")
    parser.add_argument("--port", type=int, default=7204)
    parser.add_argument("--data-dir", type=str, default="/var/lib/russian-trainer-sync")
    args = parser.parse_args()

    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")

    data_dir = Path(args.data_dir)
    data_dir.mkdir(parents=True, exist_ok=True)

    stores = {tid: TrainerStore(data_dir, tid) for tid in TRAINER_IDS}

    class Handler(SyncHandler):
        pass

    Handler.stores = stores

    server = ThreadingHTTPServer(("127.0.0.1", args.port), Handler)
    LOG.info("Russian trainer sync listening on http://127.0.0.1:%d", args.port)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        LOG.info("Shutting down.")
        server.shutdown()


if __name__ == "__main__":
    main()
