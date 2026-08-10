"""Local import event ledger for BUILD-02 metadata and idempotence."""
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
import hashlib
import json
import os
import shutil
import tempfile
from pathlib import Path

from config import SCHEMA_VERSION, default_data_dir
from errors import StorageError

FORBIDDEN_KEYS = {
    "raw_text",
    "transient",
    "secret",
    "secret_local",
    "capture_path",
    "screenshot",
    "conversation",
}


@dataclass(frozen=True)
class ImportLedger:
    root: Path | None = None

    def __post_init__(self) -> None:
        object.__setattr__(self, "root", self.root or default_data_dir())

    @property
    def path(self) -> Path:
        return self.root / "import_events.jsonl"

    def read_all(self) -> list[dict]:
        if not self.path.exists():
            return []
        out: list[dict] = []
        for line_no, line in enumerate(self.path.read_text(encoding="utf-8").splitlines(), start=1):
            if not line.strip():
                continue
            try:
                item = json.loads(line)
            except json.JSONDecodeError as exc:
                digest = hashlib.sha256(line.encode("utf-8")).hexdigest()
                raise StorageError(f"corrupt import ledger line {line_no}; sha256={digest}") from exc
            if not isinstance(item, dict):
                raise StorageError(f"invalid import ledger record at line {line_no}")
            out.append(item)
        return out

    def snapshot_for_import(self, import_id: str) -> str | None:
        for event in reversed(self.read_all()):
            if event.get("import_id") == import_id and event.get("snapshot_id") and event.get("event_type") == "committed":
                return event["snapshot_id"]
        return None

    def raw_hash_seen(self, raw_text_hash: str | None) -> str | None:
        if not raw_text_hash:
            return None
        for event in reversed(self.read_all()):
            if event.get("raw_text_hash") == raw_text_hash and event.get("snapshot_id"):
                return event["snapshot_id"]
        return None

    def append(self, event: dict) -> None:
        if not isinstance(event, dict):
            raise StorageError("import event must be an object")
        forbidden = FORBIDDEN_KEYS.intersection(event)
        if forbidden:
            raise StorageError(f"import event contains forbidden field: {sorted(forbidden)[0]}")
        encoded = json.dumps(event, ensure_ascii=False, sort_keys=True)
        lowered = encoded.lower()
        if any(f'"{key}"' in lowered for key in FORBIDDEN_KEYS):
            raise StorageError("import event contains forbidden sensitive field")

        self.root.mkdir(parents=True, exist_ok=True)
        records = self.read_all()
        records.append({
            "schemaVersion": SCHEMA_VERSION,
            "event_at": datetime.now(timezone.utc).isoformat(),
            **event,
        })

        backup = self.path.with_suffix(".jsonl.bak")
        if self.path.exists():
            shutil.copy2(self.path, backup)
            with backup.open("rb") as handle:
                os.fsync(handle.fileno())

        fd, tmp_name = tempfile.mkstemp(prefix=self.path.name + ".", suffix=".tmp", dir=str(self.root))
        tmp = Path(tmp_name)
        try:
            with os.fdopen(fd, "w", encoding="utf-8") as handle:
                for record in records:
                    handle.write(json.dumps(record, ensure_ascii=False, sort_keys=True) + "\n")
                handle.flush()
                os.fsync(handle.fileno())
            os.replace(tmp, self.path)
        except Exception:
            tmp.unlink(missing_ok=True)
            raise
