"""JSONL storage for local Pyto/iCloud Agent Usage data."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Callable, TypeVar

from config import default_data_dir
from errors import StorageError
from models import TaskRecord, UsageInterval, UsageSnapshot
from validation import validate_interval, validate_snapshot, validate_task

T = TypeVar("T")


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

    def append(self, collection: str, record: dict) -> None:
        self.ensure()
        path = self._path(collection)
        with path.open("a", encoding="utf-8") as handle:
            handle.write(json.dumps(record, ensure_ascii=False, sort_keys=True) + "\n")

    def read_all(self, collection: str) -> list[dict]:
        path = self._path(collection)
        if not path.exists():
            return []
        records: list[dict] = []
        with path.open("r", encoding="utf-8") as handle:
            for line_no, line in enumerate(handle, start=1):
                if line.strip():
                    try:
                        records.append(json.loads(line))
                    except json.JSONDecodeError as exc:
                        raise StorageError(f"invalid JSONL in {path} line {line_no}") from exc
        return records

    def add_task(self, record: TaskRecord) -> None:
        self.append("tasks", validate_task(record).to_dict())

    def add_snapshot(self, record: UsageSnapshot) -> None:
        self.append("snapshots", validate_snapshot(record).to_dict())

    def add_interval(self, record: UsageInterval) -> None:
        self.append("intervals", validate_interval(record).to_dict())

    def tasks(self) -> list[TaskRecord]:
        return [TaskRecord(**item) for item in self.read_all("tasks")]

    def snapshots(self) -> list[UsageSnapshot]:
        return [UsageSnapshot(**item) for item in self.read_all("snapshots")]

    def intervals(self) -> list[UsageInterval]:
        return [UsageInterval(**item) for item in self.read_all("intervals")]
