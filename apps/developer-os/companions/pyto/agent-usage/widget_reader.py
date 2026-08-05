"""Read-only data access for the Pyto Agent Usage widget."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Literal

from config import default_data_dir
from models import TaskRecord, UsageInterval, UsageSnapshot
from storage import JsonlStore, ReadReport
from validation import validate_interval, validate_snapshot, validate_task

COLLECTIONS = ("snapshots", "intervals", "tasks")
StorageState = Literal["empty", "primary", "backup", "corrupt", "inaccessible"]


@dataclass(frozen=True)
class WidgetReadResult:
    root: Path
    snapshots: list[UsageSnapshot]
    intervals: list[UsageInterval]
    tasks: list[TaskRecord]
    reports: dict[str, ReadReport]
    storage_state: StorageState
    public_message: str | None
    used_backup_collections: tuple[str, ...] = ()
    corrupt_collections: tuple[str, ...] = ()


def resolve_data_dir(root: str | Path | None = None) -> Path:
    return Path(root).expanduser() if root is not None else default_data_dir()


def _paths(store: JsonlStore, collection: str) -> tuple[Path, Path]:
    filename = store.FILES[collection]
    primary = store.root / filename
    return primary, primary.with_suffix(primary.suffix + ".bak")


def _validated_records(collection: str, records: list[dict]) -> tuple[list[object], bool]:
    validator = {
        "snapshots": lambda item: validate_snapshot(UsageSnapshot(**item)),
        "intervals": lambda item: validate_interval(UsageInterval(**item)),
        "tasks": lambda item: validate_task(TaskRecord(**item)),
    }[collection]
    valid: list[object] = []
    invalid = False
    for item in records:
        try:
            valid.append(validator(item))
        except Exception:
            invalid = True
    return valid, invalid


def _has_duplicate_ids(collection: str, records: list[object]) -> bool:
    key = {"snapshots": "snapshot_id", "intervals": "interval_id"}.get(collection)
    if key is None:
        return False
    values = [getattr(item, key, None) for item in records]
    return len(values) != len(set(values))


def read_widget_data(root: str | Path | None = None) -> WidgetReadResult:
    """Read BUILD-01 journals without creating, repairing, restoring, or rewriting them."""
    data_dir = resolve_data_dir(root)
    store = JsonlStore(data_dir)
    reports: dict[str, ReadReport] = {}
    typed: dict[str, list[object]] = {name: [] for name in COLLECTIONS}
    backups: list[str] = []
    corrupt: list[str] = []
    any_file = False

    try:
        for collection in COLLECTIONS:
            primary, backup = _paths(store, collection)
            primary_exists = primary.exists()
            backup_exists = backup.exists()
            if not primary_exists and not backup_exists:
                reports[collection] = ReadReport(collection, [], [])
                continue

            any_file = True
            if not primary_exists and backup_exists:
                backups.append(collection)

            report = store.read_report(collection)
            reports[collection] = report
            validated, validation_failed = _validated_records(collection, report.records)
            typed[collection] = validated
            if report.skipped or validation_failed or _has_duplicate_ids(collection, validated):
                corrupt.append(collection)

        if not any_file:
            return WidgetReadResult(data_dir, [], [], [], reports, "empty", "Aucun relevé")

        state: StorageState
        message: str | None
        if corrupt:
            state, message = "corrupt", "Stockage à vérifier"
        elif backups:
            state, message = "backup", "Sauvegarde utilisée"
        else:
            state, message = "primary", None

        return WidgetReadResult(
            root=data_dir,
            snapshots=list(typed["snapshots"]),  # type: ignore[arg-type]
            intervals=list(typed["intervals"]),  # type: ignore[arg-type]
            tasks=list(typed["tasks"]),  # type: ignore[arg-type]
            reports=reports,
            storage_state=state,
            public_message=message,
            used_backup_collections=tuple(backups),
            corrupt_collections=tuple(corrupt),
        )
    except OSError:
        return WidgetReadResult(data_dir, [], [], [], reports, "inaccessible", "Stockage inaccessible", tuple(backups), tuple(corrupt))
    except Exception:
        return WidgetReadResult(data_dir, [], [], [], reports, "inaccessible", "Ouvrir Pyto pour diagnostiquer", tuple(backups), tuple(corrupt))
