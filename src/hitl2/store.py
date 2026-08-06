from __future__ import annotations

import copy
import json
import os
import sqlite3
import stat
import threading
from collections.abc import Callable
from pathlib import Path
from typing import Any, TypeVar

from .errors import HitlError

T = TypeVar("T")


def _empty_state() -> dict[str, Any]:
    return {"schema_version": 2, "identity": None}


def _validate_state(state: Any) -> dict[str, Any]:
    if not isinstance(state, dict) or state.get("schema_version") != 2:
        raise HitlError(
            "STATE_VERSION_UNSUPPORTED",
            "The persisted Ghost Lap state uses an unsupported schema.",
            status_code=500,
        )
    identity = state.get("identity")
    if identity is not None and not isinstance(identity, dict):
        raise HitlError(
            "STATE_UNREADABLE",
            "The persisted Ghost Lap identity is malformed.",
            status_code=500,
        )
    return {"schema_version": 2, "identity": copy.deepcopy(identity)}


class SQLiteStore:
    """Cross-process serializable state transactions backed by SQLite."""

    def __init__(self, path: Path) -> None:
        self.path = path
        self._lock = threading.RLock()
        self._prepare_directory()
        self._initialize()

    def _prepare_directory(self) -> None:
        directory_existed = self.path.parent.exists()
        if self.path.parent.is_symlink() or self.path.is_symlink():
            raise HitlError(
                "UNSAFE_STATE_PATH",
                "Ghost Lap refuses a symlinked state database or data directory.",
                status_code=500,
            )
        self.path.parent.mkdir(mode=0o700, parents=True, exist_ok=True)
        if not directory_existed:
            try:
                os.chmod(self.path.parent, 0o700)
            except OSError:
                pass
        if os.name == "posix":
            owner = os.getuid()
            parent_status = self.path.parent.stat()
            if parent_status.st_uid != owner or stat.S_IMODE(parent_status.st_mode) & 0o022:
                raise HitlError(
                    "UNSAFE_STATE_PATH",
                    "The Ghost Lap data directory must be owned by this user and not writable by group or others.",
                    status_code=500,
                )
            if self.path.exists():
                file_status = self.path.stat()
                if file_status.st_uid != owner or stat.S_IMODE(file_status.st_mode) & 0o022:
                    raise HitlError(
                        "UNSAFE_STATE_PATH",
                        "The Ghost Lap state database must be owned by this user and not writable by group or others.",
                        status_code=500,
                    )

    def _connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(self.path, timeout=10, isolation_level=None)
        connection.execute("PRAGMA busy_timeout=10000")
        connection.execute("PRAGMA synchronous=FULL")
        connection.row_factory = sqlite3.Row
        return connection

    @staticmethod
    def _serialize(state: dict[str, Any]) -> str:
        return json.dumps(state, sort_keys=True, separators=(",", ":"))

    @staticmethod
    def _deserialize(payload: str) -> dict[str, Any]:
        try:
            return _validate_state(json.loads(payload))
        except (TypeError, ValueError, json.JSONDecodeError) as exc:
            raise HitlError(
                "STATE_UNREADABLE",
                "Persisted Ghost Lap state is malformed.",
                status_code=500,
            ) from exc

    def _initialize(self) -> None:
        try:
            connection = self._connect()
            try:
                connection.execute("BEGIN IMMEDIATE")
                connection.execute(
                    """
                    CREATE TABLE IF NOT EXISTS hitl2_state (
                        singleton INTEGER PRIMARY KEY CHECK (singleton = 1),
                        schema_version INTEGER NOT NULL,
                        payload TEXT NOT NULL
                    )
                    """
                )
                existing = connection.execute(
                    "SELECT payload FROM hitl2_state WHERE singleton = 1"
                ).fetchone()
                if existing is None:
                    connection.execute(
                        "INSERT INTO hitl2_state(singleton, schema_version, payload) VALUES (1, 2, ?)",
                        (self._serialize(_empty_state()),),
                    )
                else:
                    self._deserialize(existing["payload"])
                connection.commit()
            except Exception:
                connection.rollback()
                raise
            finally:
                connection.close()
            os.chmod(self.path, 0o600)
        except HitlError:
            raise
        except (OSError, sqlite3.Error) as exc:
            raise HitlError(
                "STATE_UNREADABLE",
                f"Cannot initialize Ghost Lap state at {self.path}.",
                status_code=500,
            ) from exc

    def _read(self, connection: sqlite3.Connection) -> dict[str, Any]:
        row = connection.execute(
            "SELECT schema_version, payload FROM hitl2_state WHERE singleton = 1"
        ).fetchone()
        if row is None or row["schema_version"] != 2:
            raise HitlError(
                "STATE_VERSION_UNSUPPORTED",
                "The persisted Ghost Lap state uses an unsupported schema.",
                status_code=500,
            )
        return self._deserialize(row["payload"])

    def snapshot(self) -> dict[str, Any]:
        with self._lock:
            try:
                connection = self._connect()
                try:
                    connection.execute("BEGIN")
                    state = self._read(connection)
                    connection.commit()
                    return copy.deepcopy(state)
                finally:
                    connection.close()
            except HitlError:
                raise
            except sqlite3.Error as exc:
                raise HitlError(
                    "STATE_BUSY",
                    "The Ghost Lap state store is temporarily unavailable.",
                    status_code=503,
                ) from exc

    def update(self, mutator: Callable[[dict[str, Any]], T]) -> T:
        with self._lock:
            connection: sqlite3.Connection | None = None
            try:
                connection = self._connect()
                connection.execute("BEGIN IMMEDIATE")
                candidate = self._read(connection)
                result = mutator(candidate)
                connection.execute(
                    "UPDATE hitl2_state SET schema_version = 2, payload = ? WHERE singleton = 1",
                    (self._serialize(candidate),),
                )
                connection.commit()
                return copy.deepcopy(result)
            except HitlError:
                if connection is not None:
                    connection.rollback()
                raise
            except sqlite3.Error as exc:
                if connection is not None:
                    connection.rollback()
                raise HitlError(
                    "STATE_BUSY",
                    "The Ghost Lap state transaction could not be committed.",
                    status_code=503,
                    hint="Retry once; SQLite serializes enrollment updates.",
                ) from exc
            except Exception:
                if connection is not None:
                    connection.rollback()
                raise
            finally:
                if connection is not None:
                    connection.close()
