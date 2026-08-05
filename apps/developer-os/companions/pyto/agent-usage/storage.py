"""JSONL storage for local Pyto/iCloud Agent Usage data."""

from __future__ import annotations

from dataclasses import dataclass
import hashlib
import json
import os
import shutil
import tempfile
from pathlib import Path

from config import default_data_dir
from errors import StorageError
from models import TaskRecord, UsageInterval, UsageSnapshot
from validation import validate_interval, validate_snapshot, validate_task


@dataclass(frozen=True)
class SkippedLine:
    collection: str
    line_no: int
    reason: str
    content_hash: str


@dataclass(frozen=True)
class ReadReport:
    collection: str
    records: list[dict]
    skipped: list[SkippedLine]


@dataclass(frozen=True)
class IntegrityReport:
    ok: bool
    collections: dict[str, ReadReport]
    duplicate_ids: dict[str, list[str]]


class JsonlStore:
    FILES = {"tasks": "tasks.jsonl", "snapshots": "usage_snapshots.jsonl", "intervals": "usage_intervals.jsonl"}

    def __init__(self, root: Path | None = None) -> None:
        self.root = root or default_data_dir()

    def ensure(self) -> None:
        self.root.mkdir(parents=True, exist_ok=True)

    def _path(self, collection: str) -> Path:
        if collection not in self.FILES:
            raise StorageError(f"unknown collection: {collection}")
        return self.root / self.FILES[collection]

    def _backup_path(self, path: Path) -> Path:
        return path.with_suffix(path.suffix + ".bak")

    def _sync_directory(self) -> None:
        directory_flag = getattr(os, "O_DIRECTORY", 0)
        try:
            dir_fd = os.open(str(self.root), os.O_RDONLY | directory_flag)
        except OSError:
            return
        try:
            os.fsync(dir_fd)
        finally:
            os.close(dir_fd)

    def _atomic_write_records(self, collection: str, records: list[dict]) -> None:
        self.ensure()
        path = self._path(collection)
        backup = self._backup_path(path)
        if path.exists():
            shutil.copy2(path, backup)
            with backup.open("rb") as handle:
                os.fsync(handle.fileno())
        fd, tmp_name = tempfile.mkstemp(prefix=path.name + ".", suffix=".tmp", dir=str(self.root))
        tmp = Path(tmp_name)
        try:
            with os.fdopen(fd, "w", encoding="utf-8") as handle:
                for record in records:
                    handle.write(json.dumps(record, ensure_ascii=False, sort_keys=True) + "\n")
                handle.flush()
                os.fsync(handle.fileno())
            os.replace(tmp, path)
            self._sync_directory()
        except Exception:
            tmp.unlink(missing_ok=True)
            raise

    def append(self, collection: str, record: dict) -> None:
        report = self.read_report(collection)
        self._atomic_write_records(collection, report.records + [record])

    def read_report(self, collection: str) -> ReadReport:
        path = self._path(collection)
        if not path.exists():
            backup = self._backup_path(path)
            path = backup if backup.exists() else path
        if not path.exists():
            return ReadReport(collection, [], [])
        records: list[dict] = []
        skipped: list[SkippedLine] = []
        with path.open("r", encoding="utf-8") as handle:
            for line_no, line in enumerate(handle, start=1):
                raw = line.rstrip("\n")
                if not raw.strip():
                    continue
                try:
                    parsed = json.loads(raw)
                    if not isinstance(parsed, dict):
                        raise ValueError("JSONL record must be an object")
                    records.append(parsed)
                except (json.JSONDecodeError, ValueError) as exc:
                    content_hash = hashlib.sha256(raw.encode("utf-8")).hexdigest()
                    skipped.append(SkippedLine(collection, line_no, str(exc), content_hash))
        return ReadReport(collection, records, skipped)

    def read_all(self, collection: str) -> list[dict]:
        return self.read_report(collection).records

    def add_task(self, record: TaskRecord) -> None:
        self.append("tasks", validate_task(record).to_dict())

    def add_snapshot(self, record: UsageSnapshot) -> None:
        existing = {item.get("snapshot_id") for item in self.read_all("snapshots")}
        if record.snapshot_id in existing:
            raise StorageError(f"duplicate snapshot_id: {record.snapshot_id}")
        self.append("snapshots", validate_snapshot(record).to_dict())

    def add_interval(self, record: UsageInterval) -> None:
        existing = {item.get("interval_id") for item in self.read_all("intervals")}
        if record.interval_id in existing:
            raise StorageError(f"duplicate interval_id: {record.interval_id}")
        self.append("intervals", validate_interval(record).to_dict())

    def tasks(self) -> list[TaskRecord]:
        return [TaskRecord(**item) for item in self.read_all("tasks")]

    def snapshots(self) -> list[UsageSnapshot]:
        return [UsageSnapshot(**item) for item in self.read_all("snapshots")]

    def intervals(self) -> list[UsageInterval]:
        return [UsageInterval(**item) for item in self.read_all("intervals")]

    def integrity_check(self) -> IntegrityReport:
        reports = {name: self.read_report(name) for name in self.FILES}
        duplicate_ids: dict[str, list[str]] = {}
        for collection, report in reports.items():
            if collection == "tasks":
                duplicate_ids[collection] = []
                continue
            key = {"snapshots": "snapshot_id", "intervals": "interval_id"}[collection]
            seen: set[str] = set()
            dupes: set[str] = set()
            for record in report.records:
                value = record.get(key)
                if not isinstance(value, str):
                    continue
                if value in seen:
                    dupes.add(value)
                seen.add(value)
            duplicate_ids[collection] = sorted(dupes)
        ok = not any(report.skipped for report in reports.values()) and not any(duplicate_ids.values())
        return IntegrityReport(ok, reports, duplicate_ids)

    def export_valid(self, destination: Path) -> None:
        payload = {name: self.read_report(name).records for name in self.FILES}
        destination.parent.mkdir(parents=True, exist_ok=True)
        with destination.open("w", encoding="utf-8") as handle:
            json.dump(payload, handle, ensure_ascii=False, sort_keys=True, indent=2)
            handle.write("\n")
