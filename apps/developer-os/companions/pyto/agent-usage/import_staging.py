"""Sensitive-text-free staging for Shortcuts imports."""
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
import json
import os
import re
import tempfile
from pathlib import Path

from config import default_data_dir
from errors import StorageError

TTL_MINUTES = 30
_IMPORT_ID_RE = re.compile(r"^IMP-[A-Za-z0-9-]{1,80}$")


def validate_import_id(import_id: str) -> str:
    if not isinstance(import_id, str) or not _IMPORT_ID_RE.fullmatch(import_id):
        raise StorageError("invalid import_id")
    return import_id


@dataclass(frozen=True)
class StagingStore:
    root: Path | None = None

    def __post_init__(self) -> None:
        object.__setattr__(self, "root", self.root or default_data_dir() / "staging")

    def _path(self, import_id: str) -> Path:
        return self.root / f"{validate_import_id(import_id)}.json"

    def save(self, import_id: str, payload: dict) -> str:
        self.root.mkdir(parents=True, exist_ok=True)
        expires = datetime.now(timezone.utc) + timedelta(minutes=TTL_MINUTES)
        data = {**payload, "candidate_expires_at": expires.isoformat()}
        path = self._path(import_id)
        fd, tmp_name = tempfile.mkstemp(prefix=path.name + ".", suffix=".tmp", dir=str(self.root))
        tmp = Path(tmp_name)
        try:
            with os.fdopen(fd, "w", encoding="utf-8") as handle:
                json.dump(data, handle, ensure_ascii=False, sort_keys=True)
                handle.write("\n")
                handle.flush()
                os.fsync(handle.fileno())
            os.replace(tmp, path)
        except Exception:
            tmp.unlink(missing_ok=True)
            raise
        return expires.isoformat()

    def load(self, import_id: str) -> dict:
        path = self._path(import_id)
        if not path.exists():
            raise FileNotFoundError("staging_absent")
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as exc:
            raise StorageError("staging_corrupted") from exc
        expires = datetime.fromisoformat(data["candidate_expires_at"].replace("Z", "+00:00"))
        if expires <= datetime.now(timezone.utc):
            self.delete(import_id)
            raise TimeoutError("staging_expired")
        return data

    def delete(self, import_id: str) -> bool:
        path = self._path(import_id)
        existed = path.exists()
        path.unlink(missing_ok=True)
        return existed

    def cleanup_expired(self) -> int:
        count = 0
        if not self.root.exists():
            return 0
        for path in self.root.glob("IMP-*.json"):
            try:
                data = json.loads(path.read_text(encoding="utf-8"))
                expires = datetime.fromisoformat(data["candidate_expires_at"].replace("Z", "+00:00"))
                if expires <= datetime.now(timezone.utc):
                    path.unlink()
                    count += 1
            except Exception:
                path.unlink(missing_ok=True)
                count += 1
        return count
