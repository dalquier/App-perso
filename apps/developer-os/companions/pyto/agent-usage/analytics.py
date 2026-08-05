"""Interval calculations, statistics, weekly summaries, and forecasts."""

from __future__ import annotations

from datetime import datetime, timedelta

from config import DEFAULT_STALE_AFTER_HOURS, SCHEMA_VERSION
from identifiers import next_identifier
from models import TaskRecord, UsageForecast, UsageInterval, UsageSnapshot, WeeklyUsageSummary, parse_datetime
from validation import validate_interval


def _latest_task_records(tasks: list[TaskRecord]) -> list[TaskRecord]:
    latest: dict[str, TaskRecord] = {}
    order: list[str] = []
    for task in tasks:
        if task.task_id not in latest:
            order.append(task.task_id)
        latest[task.task_id] = task
    return [latest[task_id] for task_id in order]


def is_same_quota_cycle(before: UsageSnapshot, after: UsageSnapshot) -> bool:
    return before.quota_scope == after.quota_scope and before.quota_cycle_id == after.quota_cycle_id


def tasks_between(tasks: list[TaskRecord], before: UsageSnapshot, after: UsageSnapshot) -> list[TaskRecord]:
    start = parse_datetime(before.captured_at, "captured_at")
    end = parse_datetime(after.captured_at, "captured_at")
    return [
        task
        for task in _latest_task_records(tasks)
        if start <= parse_datetime(task.started_at, "started_at") <= end and task.tool in {"codex", "work"}
    ]


def calculate_interval(before: UsageSnapshot, after: UsageSnapshot, tasks: list[TaskRecord], existing_ids: list[str] | None = None) -> UsageInterval:
    related = tasks_between(tasks, before, after)
    same_cycle = is_same_quota_cycle(before, after)
    invalid_reason = None
    delta = None
    mode = "no_task"
    confidence = "unknown"
    if not same_cycle:
        mode, invalid_reason = "not_comparable", "different_quota_scope_or_cycle"
    elif after.quota_event in {"reset", "correction", "recharge"} or after.remaining_percent > before.remaining_percent:
        mode, invalid_reason = "reset_or_correction", after.quota_event if after.quota_event != "unknown" else "remaining_percent_increased"
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
        started_at=before.captured_at,
        ended_at=after.captured_at,
        quota_scope=after.quota_scope,
        quota_cycle_id=after.quota_cycle_id,
        delta_percent=delta,
        task_ids=[task.task_id for task in related],
        attribution_mode=mode,
        confidence=confidence,
        is_same_quota_cycle=same_cycle,
        invalid_reason=invalid_reason,
        calculation_evidence=f"{before.snapshot_id}->{after.snapshot_id}; tasks={len(related)}",
    )
    return validate_interval(interval)


def usage_statistics(intervals: list[UsageInterval]) -> dict[str, float | int | None]:
    valid = [item.delta_percent for item in intervals if item.delta_percent is not None and item.delta_percent >= 0]
    return {
        "valid_interval_count": len(valid),
        "total_delta_percent": sum(valid),
        "average_delta_percent": (sum(valid) / len(valid)) if valid else None,
    }


def forecast_exhaustion(snapshots: list[UsageSnapshot], intervals: list[UsageInterval]) -> UsageForecast:
    if not snapshots:
        return UsageForecast("cycle_linear", 0, "unknown", None, None, "no_snapshots")
    ordered = sorted(snapshots, key=lambda snapshot: parse_datetime(snapshot.captured_at, "captured_at"))
    last = ordered[-1]
    compatible = [
        snapshot
        for snapshot in ordered
        if snapshot.quota_scope == last.quota_scope and snapshot.quota_cycle_id == last.quota_cycle_id
    ]
    valid = [
        interval
        for interval in intervals
        if interval.quota_scope == last.quota_scope
        and interval.quota_cycle_id == last.quota_cycle_id
        and interval.delta_percent is not None
        and interval.delta_percent > 0
    ]
    cycle_start = parse_datetime(compatible[0].captured_at, "captured_at")
    unresolved = [
        interval
        for interval in intervals
        if interval.quota_scope == last.quota_scope
        and interval.quota_cycle_id == last.quota_cycle_id
        and interval.attribution_mode == "reset_or_correction"
        and parse_datetime(interval.ended_at, "ended_at") >= cycle_start
    ]
    if unresolved:
        return UsageForecast("cycle_linear", len(valid), "unknown", None, None, "unresolved_reset_or_correction")
    if len(valid) < 2 or len(compatible) < 2:
        return UsageForecast("cycle_linear", len(valid), "unknown", None, None, "insufficient_intervals")
    first = compatible[0]
    elapsed_days = max(
        (parse_datetime(last.captured_at, "captured_at") - parse_datetime(first.captured_at, "captured_at")).total_seconds() / 86400,
        1,
    )
    daily = sum(interval.delta_percent or 0 for interval in valid) / elapsed_days
    if daily <= 0:
        return UsageForecast("cycle_linear", len(valid), "unknown", None, None, "zero_burn")
    exhausts = parse_datetime(last.captured_at, "captured_at") + timedelta(days=last.remaining_percent / daily)
    return UsageForecast("cycle_linear", len(valid), "estimated", exhausts.isoformat(), daily, None)


def weekly_summary(tasks: list[TaskRecord], intervals: list[UsageInterval], snapshots: list[UsageSnapshot], week_start: str, tool: str | None = None, project_id: str | None = None) -> WeeklyUsageSummary:
    start = parse_datetime(week_start, "week_start")
    end = start + timedelta(days=7)
    filtered_tasks = [
        task
        for task in _latest_task_records(tasks)
        if start <= parse_datetime(task.started_at, "started_at") < end
        and (tool is None or task.tool == tool)
        and (project_id is None or task.project_id == project_id)
    ]
    task_ids = {task.task_id for task in filtered_tasks}
    attributable = [
        interval
        for interval in intervals
        if interval.attribution_mode == "single_task"
        and len(interval.task_ids) == 1
        and interval.task_ids[0] in task_ids
        and interval.delta_percent is not None
    ]
    total = sum(interval.delta_percent or 0 for interval in attributable)
    return WeeklyUsageSummary(
        start.isoformat(),
        end.isoformat(),
        tool,
        project_id,
        len(filtered_tasks),
        len([task for task in filtered_tasks if task.status == "completed"]),
        len(attributable),
        total,
        (total / len(attributable)) if attributable else None,
        forecast_exhaustion(snapshots, intervals),
    )


def freshness(captured_at: str, now: datetime | None = None, stale_after_hours: int = DEFAULT_STALE_AFTER_HOURS) -> str:
    captured = parse_datetime(captured_at, "captured_at")
    now = now or datetime.now(captured.tzinfo)
    age = now - captured
    return "stale" if age > timedelta(hours=stale_after_hours) else "fresh"
