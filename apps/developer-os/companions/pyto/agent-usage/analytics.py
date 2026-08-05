"""Interval calculations, statistics, and forecasts."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta

from config import DEFAULT_STALE_AFTER_HOURS, SCHEMA_VERSION
from identifiers import next_identifier
from models import TaskRecord, UsageInterval, UsageSnapshot, parse_datetime
from validation import validate_interval


def is_same_quota_cycle(before: UsageSnapshot, after: UsageSnapshot) -> bool:
    return before.measurement_scope == after.measurement_scope and before.reset_at == after.reset_at


def tasks_between(tasks: list[TaskRecord], before: UsageSnapshot, after: UsageSnapshot) -> list[TaskRecord]:
    start = parse_datetime(before.captured_at, "captured_at")
    end = parse_datetime(after.captured_at, "captured_at")
    return [task for task in tasks if start <= parse_datetime(task.started_at, "started_at") <= end and task.tool in {"codex", "work"}]


def calculate_interval(before: UsageSnapshot, after: UsageSnapshot, tasks: list[TaskRecord], existing_ids: list[str] | None = None) -> UsageInterval:
    related = tasks_between(tasks, before, after)
    same_cycle = is_same_quota_cycle(before, after)
    invalid_reason = None
    delta = None
    mode = "no_task"
    confidence = "unknown"
    if not same_cycle:
        mode, invalid_reason = "not_comparable", "different_scope_or_quota_cycle"
    elif after.remaining_percent > before.remaining_percent:
        mode, invalid_reason = "reset_or_correction", "remaining_percent_increased"
    else:
        delta = before.remaining_percent - after.remaining_percent
        if len(related) == 1:
            mode, confidence = "single_task", "attributed"
        elif len(related) > 1:
            mode, confidence = "multi_task", "interval_only"
        else:
            mode, confidence = "no_task", "observed"
    interval = UsageInterval(
        schemaVersion=SCHEMA_VERSION,
        interval_id=next_identifier("interval", existing_ids or [], parse_datetime(after.captured_at, "captured_at")),
        from_snapshot_id=before.snapshot_id,
        to_snapshot_id=after.snapshot_id,
        delta_percent=delta,
        task_ids=[task.task_id for task in related],
        attribution_mode=mode,
        confidence=confidence,
        is_same_quota_cycle=same_cycle,
        invalid_reason=invalid_reason,
    )
    return validate_interval(interval)


def usage_statistics(intervals: list[UsageInterval]) -> dict[str, float | int | None]:
    valid = [item.delta_percent for item in intervals if item.delta_percent is not None and item.delta_percent >= 0]
    return {"valid_interval_count": len(valid), "total_delta_percent": sum(valid), "average_delta_percent": (sum(valid) / len(valid)) if valid else None}


def forecast_exhaustion(snapshots: list[UsageSnapshot], intervals: list[UsageInterval]) -> dict[str, str | float | None]:
    valid = [item.delta_percent for item in intervals if item.delta_percent is not None and item.delta_percent > 0]
    if len(valid) < 2 or not snapshots:
        return {"exhausts_at": None, "confidence": "unknown", "daily_burn_percent": None}
    ordered = sorted(snapshots, key=lambda s: s.captured_at)
    first, last = ordered[0], ordered[-1]
    elapsed_days = max((parse_datetime(last.captured_at, "captured_at") - parse_datetime(first.captured_at, "captured_at")).total_seconds() / 86400, 1)
    daily = sum(valid) / elapsed_days
    if daily <= 0:
        return {"exhausts_at": None, "confidence": "unknown", "daily_burn_percent": None}
    exhausts = parse_datetime(last.captured_at, "captured_at") + timedelta(days=last.remaining_percent / daily)
    return {"exhausts_at": exhausts.isoformat(), "confidence": "estimated", "daily_burn_percent": daily}


def freshness(captured_at: str, now: datetime | None = None, stale_after_hours: int = DEFAULT_STALE_AFTER_HOURS) -> str:
    now = now or datetime.now(parse_datetime(captured_at, "captured_at").tzinfo)
    age = now - parse_datetime(captured_at, "captured_at")
    return "stale" if age > timedelta(hours=stale_after_hours) else "fresh"
