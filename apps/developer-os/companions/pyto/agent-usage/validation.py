"""Validation rules for Agent Usage records."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from config import SCHEMA_VERSION
from errors import ValidationError
from identifiers import validate_identifier
from models import ATTRIBUTION_MODES, CONFIDENCES, SOURCES, TASK_STATUSES, TOOLS, TaskRecord, UsageInterval, UsageSnapshot, parse_datetime


def _percent(value: Any, name: str, required: bool = False) -> None:
    if value is None and not required:
        return
    if not isinstance(value, (int, float)) or value < 0 or value > 100:
        raise ValidationError(f"{name} must be between 0 and 100")


def _dt_order(start: str, end: str | None) -> None:
    started = parse_datetime(start, "started_at")
    if end is not None and parse_datetime(end, "ended_at") < started:
        raise ValidationError("ended_at must be after started_at")


def validate_task(record: TaskRecord) -> TaskRecord:
    if record.schemaVersion != SCHEMA_VERSION:
        raise ValidationError("unsupported schemaVersion")
    if not validate_identifier(record.task_id, "task"):
        raise ValidationError("invalid task_id")
    if record.tool not in TOOLS or record.status not in TASK_STATUSES or record.source not in SOURCES or record.confidence not in CONFIDENCES:
        raise ValidationError("invalid controlled value")
    if not record.project_id or not record.title:
        raise ValidationError("project_id and title are required")
    _dt_order(record.started_at, record.ended_at)
    for name in ("quota_before_percent", "quota_after_percent", "observed_delta_percent"):
        _percent(getattr(record, name), name)
    if record.observed_delta_percent is not None and (record.usage_interval_id is None or record.confidence != "attributed"):
        raise ValidationError("observed task deltas require an attributed interval")
    if record.usage_interval_id and not validate_identifier(record.usage_interval_id, "interval"):
        raise ValidationError("invalid usage_interval_id")
    if record.credits_estimated is not None and not record.estimation_method:
        raise ValidationError("estimated credits require estimation_method")
    return record


def validate_snapshot(record: UsageSnapshot, now: datetime | None = None) -> UsageSnapshot:
    if record.schemaVersion != SCHEMA_VERSION or not validate_identifier(record.snapshot_id, "snapshot"):
        raise ValidationError("invalid snapshot schema or id")
    _percent(record.remaining_percent, "remaining_percent", required=True)
    if not record.measurement_scope or record.source not in SOURCES or record.confidence not in CONFIDENCES:
        raise ValidationError("invalid snapshot controlled value")
    captured = parse_datetime(record.captured_at, "captured_at")
    reset = parse_datetime(record.reset_at, "reset_at")
    validated = parse_datetime(record.validated_at, "validated_at")
    if reset <= captured:
        raise ValidationError("reset_at must be after captured_at before recording")
    if validated < captured:
        raise ValidationError("validated_at must be at or after captured_at")
    if record.purchased_credits_remaining is not None and record.purchased_credits_remaining < 0:
        raise ValidationError("purchased credits cannot be negative")
    return record


def validate_interval(record: UsageInterval) -> UsageInterval:
    if record.schemaVersion != SCHEMA_VERSION or not validate_identifier(record.interval_id, "interval"):
        raise ValidationError("invalid interval schema or id")
    if not validate_identifier(record.from_snapshot_id, "snapshot") or not validate_identifier(record.to_snapshot_id, "snapshot"):
        raise ValidationError("invalid interval snapshot id")
    _percent(record.delta_percent, "delta_percent")
    if record.attribution_mode not in ATTRIBUTION_MODES or record.confidence not in CONFIDENCES:
        raise ValidationError("invalid interval controlled value")
    if record.attribution_mode in {"reset_or_correction", "not_comparable"} and not record.invalid_reason:
        raise ValidationError("invalid intervals require invalid_reason")
    return record
