"""Data models for DeveloperOS Agent Usage.

Serialization convention (BUILD-00): records are JSON objects stored as UTF-8
JSONL with sorted keys; datetimes are timezone-aware ISO 8601 strings.
Optional numeric fields keep ``null`` distinct from numeric zero.
"""

from __future__ import annotations

from dataclasses import asdict, dataclass
from datetime import datetime
from typing import Any, Optional

from config import SCHEMA_VERSION

TOOLS = {"codex", "work"}
TASK_STATUSES = {"planned", "running", "completed", "failed", "cancelled"}
TERMINAL_STATUSES = {"completed", "failed", "cancelled"}
SOURCES = {"manual", "projectos", "shortcut", "import"}
CONFIDENCES = {"observed", "attributed", "interval_only", "estimated", "unknown"}
ATTRIBUTION_MODES = {"single_task", "multi_task", "no_task", "reset_or_correction", "not_comparable"}
QUOTA_EVENTS = {"reset", "correction", "recharge", "unknown"}


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
    quota_scope: str
    quota_cycle_id: str
    purchased_credits_remaining: Optional[float]
    source: str
    confidence: str
    validated_at: str
    human_validated: bool
    quota_event: str = "unknown"
    raw_text_hash: Optional[str] = None

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)

    @classmethod
    def create(cls, **kwargs: Any) -> "UsageSnapshot":
        kwargs.setdefault("schemaVersion", SCHEMA_VERSION)
        kwargs.setdefault("quota_scope", kwargs.get("measurement_scope", "default"))
        kwargs.setdefault("quota_cycle_id", kwargs.get("reset_at", "unknown"))
        kwargs.setdefault("purchased_credits_remaining", None)
        kwargs.setdefault("confidence", "observed")
        kwargs.setdefault("human_validated", False)
        kwargs.setdefault("quota_event", "unknown")
        kwargs.setdefault("raw_text_hash", None)
        return cls(**kwargs)


@dataclass(frozen=True)
class UsageInterval:
    schemaVersion: int
    interval_id: str
    from_snapshot_id: str
    to_snapshot_id: str
    started_at: str
    ended_at: str
    quota_scope: str
    quota_cycle_id: str
    delta_percent: Optional[float]
    task_ids: list[str]
    attribution_mode: str
    confidence: str
    is_same_quota_cycle: bool
    invalid_reason: Optional[str]
    calculation_evidence: Optional[str]

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass(frozen=True)
class UsageForecast:
    method: str
    interval_count: int
    confidence: str
    exhausts_at: Optional[str]
    daily_burn_percent: Optional[float]
    unavailable_reason: Optional[str]

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)

    def __getitem__(self, key: str) -> Any:
        return self.to_dict()[key]


@dataclass(frozen=True)
class WeeklyUsageSummary:
    week_start: str
    week_end: str
    tool: Optional[str]
    project_id: Optional[str]
    task_count: int
    completed_task_count: int
    attributable_interval_count: int
    total_delta_percent: float
    average_delta_percent_per_task: Optional[float]
    forecast: UsageForecast

    def to_dict(self) -> dict[str, Any]:
        data = asdict(self)
        data["forecast"] = self.forecast.to_dict()
        return data


def parse_datetime(value: str, field_name: str) -> datetime:
    if not isinstance(value, str):
        raise ValueError(f"{field_name} must be an ISO 8601 string")
    parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if parsed.tzinfo is None or parsed.utcoffset() is None:
        raise ValueError(f"{field_name} must include a timezone offset")
    return parsed
