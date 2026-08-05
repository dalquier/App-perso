"""Commit/cancel orchestration for Shortcuts UsageSnapshot imports."""
from __future__ import annotations

from datetime import datetime
from time import perf_counter
from typing import Any

from errors import ValidationError
from identifiers import next_identifier
from import_ledger import ImportLedger
from import_parser import PURCHASED_CREDIT_STATUSES, quota_cycle_id
from import_staging import StagingStore, validate_import_id
from models import UsageSnapshot, parse_datetime
from storage import JsonlStore
from validation import validate_snapshot

ALLOWED_OVERRIDE_KEYS = {
    "remaining_percent",
    "reset_at",
    "measurement_scope",
    "quota_scope",
    "purchased_credits_remaining",
    "purchased_credits_status",
    "correction_of_snapshot_id",
    "cycle_correction_reason",
}


def _strict_int_percent(value: Any) -> int:
    if isinstance(value, bool) or not isinstance(value, int) or not 0 <= value <= 100:
        raise ValidationError("remaining_percent must be an integer from 0 to 100")
    return value


def _credits_value(status: str, value: Any) -> int | float | None:
    if status not in PURCHASED_CREDIT_STATUSES:
        raise ValidationError("invalid purchased_credits_status")
    if status in {"not_displayed", "unreadable", "not_purchased", "not_applicable"}:
        if value is not None:
            raise ValidationError(f"{status} requires purchased_credits_remaining=null")
        return None
    if status == "explicit_zero":
        if value not in (0, 0.0, None):
            raise ValidationError("explicit_zero cannot carry a positive value")
        return 0
    if isinstance(value, bool) or not isinstance(value, (int, float)) or value <= 0:
        raise ValidationError("explicit_value requires a positive credit value")
    return value


def _duplicates(store: JsonlStore, candidate: dict, raw_hash_duplicate: str | None) -> dict:
    exact = None
    for snapshot in store.read_all("snapshots"):
        if all(snapshot.get(key) == candidate.get(key) for key in (
            "captured_at",
            "remaining_percent",
            "reset_at",
            "measurement_scope",
            "quota_scope",
            "purchased_credits_remaining",
        )):
            exact = snapshot.get("snapshot_id")
            break
    return {
        "raw_hash_duplicate_snapshot_id": raw_hash_duplicate,
        "exact_duplicate_snapshot_id": exact,
        "policy": "skip_exact_by_default" if exact or raw_hash_duplicate else "new_snapshot",
    }


def _require_resolved_candidate(candidate: dict, overrides: dict, confirmed_codes: set[str]) -> None:
    confidence = candidate.get("field_confidence") or {}
    for field in ("remaining_percent", "reset_at", "measurement_scope"):
        if candidate.get(field) is None:
            raise ValidationError(f"{field} is required")
        if confidence.get(field) in {"ambiguous", "absent"} and field not in overrides:
            raise ValidationError(f"{field} requires an explicit user override")
    for warning in candidate.get("warnings") or []:
        code = warning.get("code")
        field = warning.get("field")
        if code in {"RESET_IN_PAST", "RESET_TOO_FAR", "DST_NONEXISTENT_TIME", "DST_AMBIGUOUS_TIME", "SCOPE_MISMATCH"}:
            if field not in overrides:
                raise ValidationError(f"{code} requires correction")
        elif warning.get("requires_confirmation") and code not in confirmed_codes and field not in overrides:
            raise ValidationError(f"warning {code} requires confirmation")


def _ledger_event(staged: dict, candidate: dict, request: dict, duplicate_status: dict | None, duration: float, **extra: Any) -> dict:
    return {
        "input_mode": staged.get("input_mode"),
        "purchased_credits_status": candidate.get("purchased_credits_status"),
        "field_confidence": candidate.get("field_confidence"),
        "field_provenance": candidate.get("field_provenance"),
        "warnings": candidate.get("warnings", []),
        "confirmed_warning_codes": request.get("confirmed_warning_codes", []),
        "comment": request.get("comment"),
        "duplicate_status": duplicate_status,
        "raw_text_hash": candidate.get("raw_text_hash"),
        "analysis_duration_ms": staged.get("analysis_duration_ms"),
        "commit_duration_ms": duration,
        **extra,
    }


def commit_import(
    request: dict,
    store: JsonlStore | None = None,
    staging: StagingStore | None = None,
    ledger: ImportLedger | None = None,
) -> dict:
    start = perf_counter()
    store = store or JsonlStore()
    staging = staging or StagingStore()
    ledger = ledger or ImportLedger()
    if request.get("schemaVersion") != 1 or request.get("import_type") != "usage_snapshot_commit_request" or request.get("action") != "commit":
        raise ValidationError("invalid commit request envelope")
    import_id = validate_import_id(request.get("import_id"))
    existing = ledger.snapshot_for_import(import_id)
    if existing:
        return {
            "schemaVersion": 1,
            "import_type": "usage_snapshot_commit_result",
            "status": "idempotent",
            "import_id": import_id,
            "snapshot_id": existing,
            "duplicate_status": "same_import_id",
        }
    if request.get("validated_by_user") is not True:
        raise ValidationError("validated_by_user must be true")

    staged = staging.load(import_id)
    candidate = dict(staged["candidate"])
    overrides = request.get("overrides") or {}
    if not isinstance(overrides, dict):
        raise ValidationError("overrides must be an object")
    unknown = set(overrides) - ALLOWED_OVERRIDE_KEYS
    if unknown:
        raise ValidationError(f"unknown override field: {sorted(unknown)[0]}")
    candidate.update({key: value for key, value in overrides.items() if key in candidate})

    if candidate.get("source") != "shortcut" or request.get("source", "shortcut") != "shortcut":
        raise ValidationError("shortcut imports must persist source=shortcut")
    if candidate.get("measurement_scope") != candidate.get("quota_scope"):
        raise ValidationError("measurement_scope and quota_scope must match")

    confirmed_codes = set(request.get("confirmed_warning_codes") or [])
    _require_resolved_candidate(candidate, overrides, confirmed_codes)

    remaining = _strict_int_percent(candidate.get("remaining_percent"))
    reset_at = candidate.get("reset_at")
    captured_at = candidate.get("captured_at")
    validated_at = request.get("validated_at")
    if not isinstance(reset_at, str) or not isinstance(captured_at, str) or not isinstance(validated_at, str):
        raise ValidationError("captured_at, reset_at and validated_at are required")
    if parse_datetime(reset_at, "reset_at") <= parse_datetime(captured_at, "captured_at"):
        raise ValidationError("past resets are out of scope for BUILD-02")

    cycle = quota_cycle_id(candidate["measurement_scope"], reset_at)
    purchased = _credits_value(
        candidate.get("purchased_credits_status", "not_displayed"),
        candidate.get("purchased_credits_remaining"),
    )
    duplicate = _duplicates(
        store,
        {
            **candidate,
            "remaining_percent": remaining,
            "reset_at": reset_at,
            "quota_cycle_id": cycle,
            "purchased_credits_remaining": purchased,
        },
        ledger.raw_hash_seen(candidate.get("raw_text_hash")),
    )
    if duplicate["exact_duplicate_snapshot_id"] or duplicate["raw_hash_duplicate_snapshot_id"]:
        snapshot_id = duplicate["exact_duplicate_snapshot_id"] or duplicate["raw_hash_duplicate_snapshot_id"]
        duration = round((perf_counter() - start) * 1000, 3)
        ledger.append(_ledger_event(
            staged,
            candidate,
            request,
            duplicate,
            duration,
            event_type="duplicate_skipped",
            import_id=import_id,
            snapshot_id=snapshot_id,
        ))
        staging.delete(import_id)
        return {
            "schemaVersion": 1,
            "import_type": "usage_snapshot_commit_result",
            "status": "duplicate_skipped",
            "import_id": import_id,
            "snapshot_id": snapshot_id,
            "duplicate_status": duplicate,
        }

    snapshot_id = next_identifier(
        "snapshot",
        [item.get("snapshot_id", "") for item in store.read_all("snapshots")],
        datetime.fromisoformat(captured_at.replace("Z", "+00:00")),
    )
    snapshot = UsageSnapshot.create(
        snapshot_id=snapshot_id,
        captured_at=captured_at,
        remaining_percent=remaining,
        reset_at=reset_at,
        measurement_scope=candidate["measurement_scope"],
        quota_scope=candidate["quota_scope"],
        quota_cycle_id=cycle,
        purchased_credits_remaining=purchased,
        source="shortcut",
        confidence="observed",
        validated_at=validated_at,
        human_validated=True,
        quota_event="unknown",
        raw_text_hash=candidate.get("raw_text_hash"),
    )
    validate_snapshot(snapshot)
    store.add_snapshot(snapshot)

    duration = round((perf_counter() - start) * 1000, 3)
    ledger.append(_ledger_event(
        staged,
        candidate,
        request,
        duplicate,
        duration,
        event_type="committed",
        import_id=import_id,
        snapshot_id=snapshot_id,
        correction_of_snapshot_id=overrides.get("correction_of_snapshot_id"),
        cycle_id_origin="derived_from_scope_and_reset_utc",
        cycle_correction_reason=overrides.get("cycle_correction_reason"),
    ))
    staging.delete(import_id)
    return {
        "schemaVersion": 1,
        "import_type": "usage_snapshot_commit_result",
        "status": "committed",
        "import_id": import_id,
        "snapshot_id": snapshot_id,
        "duplicate_status": duplicate,
        "commit_duration_ms": duration,
    }


def cancel_import(
    request: dict,
    staging: StagingStore | None = None,
    ledger: ImportLedger | None = None,
) -> dict:
    staging = staging or StagingStore()
    ledger = ledger or ImportLedger()
    import_id = validate_import_id(request.get("import_id"))
    deleted = staging.delete(import_id)
    ledger.append({
        "event_type": "cancelled",
        "import_id": import_id,
        "snapshot_id": None,
        "input_mode": None,
        "purchased_credits_status": None,
        "field_confidence": {},
        "field_provenance": {},
        "warnings": [],
        "confirmed_warning_codes": [],
        "comment": request.get("comment"),
        "duplicate_status": None,
        "analysis_duration_ms": None,
        "commit_duration_ms": 0,
    })
    return {
        "schemaVersion": 1,
        "import_type": "usage_snapshot_cancel_result",
        "status": "cancelled",
        "import_id": import_id,
        "staging_deleted": deleted,
    }
