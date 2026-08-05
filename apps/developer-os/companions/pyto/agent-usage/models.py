"""Data models for DeveloperOS Agent Usage."""

from __future__ import annotations

from dataclasses import asdict, dataclass
from datetime import datetime
from typing import Any, Optional

from config import SCHEMA_VERSION

TOOLS = {"codex", "work"}
TASK_STATUSES = {"planned", "running", "completed", "failed", "cancelled"}
SOURCES = {"manual", "projectos", "shortcut", "import"}
CONFIDENCES = {"observed", "attributed", "interval_only", "estimated", "unknown"}
ATTRIBUTION_MODES = {"single_task", "multi_task", "no_task", "reset_or_correction", "not_comparable"}


@dataclass(frozen=True)
class TaskRecord:
    schemaVersion: int
    task_id: str
    tool: str
    project_id: str
    title: str
    started_at: str
    ended_at: Optional[str]
    status: str
    source: str
    usage_interval_id: Optional[str]
    quota_before_percent: Optional[float]
    quota_after_percent: Optional[float]
    observed_delta_percent: Optional[float]
    credits_observed: Optional[float]
    credits_estimated: Optional[float]
    estimation_method: Optional[str]
    confidence: str
    evidence: Optional[str]
    notes: Optional[str] = None

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)

    @classmethod
    def create(cls, **kwargs: Any) -> "TaskRecord":
        kwargs.setdefault("schemaVersion", SCHEMA_VERSION)
        kwargs.setdefault("ended_at", None)
        kwargs.setdefault("usage_interval_id", None)
        kwargs.setdefault("quota_before_percent", None)
        kwargs.setdefault("quota_after_percent", None)
        kwargs.setdefault("observed_delta_percent", None)
        kwargs.setdefault("credits_observed", None)
        kwargs.setdefault("credits_estimated", None)
        kwargs.setdefault("estimation_method", None)
        kwargs.setdefault("confidence", "unknown")
        kwargs.setdefault("evidence", None)
        kwargs.setdefault("notes", None)
        return cls(**kwargs)


@dataclass(frozen=True)
class UsageSnapshot:
    schemaVersion: int
    snapshot_id: str
    captured_at: str
    remaining_percent: float
    reset_at: str
    measurement_scope: str
    purchased_credits_remaining: Optional[float]
    source: str
    confidence: str
    validated_at: str
    raw_text_hash: Optional[str] = None

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)

    @classmethod
    def create(cls, **kwargs: Any) -> "UsageSnapshot":
        kwargs.setdefault("schemaVersion", SCHEMA_VERSION)
        kwargs.setdefault("purchased_credits_remaining", None)
        kwargs.setdefault("confidence", "observed")
        kwargs.setdefault("raw_text_hash", None)
        return cls(**kwargs)


@dataclass(frozen=True)
class UsageInterval:
    schemaVersion: int
    interval_id: str
    from_snapshot_id: str
    to_snapshot_id: str
    delta_percent: Optional[float]
    task_ids: list[str]
    attribution_mode: str
    confidence: str
    is_same_quota_cycle: bool
    invalid_reason: Optional[str]

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


def parse_datetime(value: str, field_name: str) -> datetime:
    if not isinstance(value, str):
        raise ValueError(f"{field_name} must be an ISO 8601 string")
    return datetime.fromisoformat(value.replace("Z", "+00:00"))
