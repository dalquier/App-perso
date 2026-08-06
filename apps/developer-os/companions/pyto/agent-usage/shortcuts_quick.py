"""Simplified iOS Shortcuts adapter for Agent Usage BUILD-02.

This wrapper keeps the strict JSON bridge intact while reducing the iOS
Shortcut to three operations:

- ``analyze``: raw OCR/text on stdin -> structured candidate + human summary;
- ``commit``: ``import_id`` on stdin -> validated commit of the staged candidate;
- ``cancel``: ``import_id`` on stdin -> delete staging without writing a snapshot.

Raw OCR text is passed only to the existing transient analyzer and is never
included in the wrapper response.
"""
from __future__ import annotations

from datetime import datetime
import json
import re
import sys
import uuid
from typing import Any

from errors import ValidationError
from import_snapshot import cancel_import, commit_import
from import_staging import StagingStore, validate_import_id
from shortcuts_bridge import _public_error, analyze

DEFAULT_SCOPE = "chatgpt_agentic_shared"
DEFAULT_TIMEZONE = "Europe/Paris"
INPUT_KINDS = {"image_ocr", "clipboard_text", "manual_text"}
BLOCKING_WARNING_CODES = {
    "NO_PERCENT_CANDIDATE",
    "NO_RESET",
    "RESET_IN_PAST",
    "RESET_TOO_FAR",
    "DST_NONEXISTENT_TIME",
    "DST_AMBIGUOUS_TIME",
    "SCOPE_MISMATCH",
}

_CREDIT_LABELS = {
    "explicit_value": "valeur détectée",
    "explicit_zero": "0 explicitement affiché",
    "not_displayed": "non affichés",
    "unreadable": "illisibles",
    "not_purchased": "non achetés",
    "not_applicable": "non applicable",
}


def _now_iso() -> str:
    return datetime.now().astimezone().isoformat(timespec="seconds")


def _new_import_id() -> str:
    return "IMP-" + str(uuid.uuid4()).upper()


def _normalize_manual_text(raw_text: str) -> str:
    """Allow the compact manual form ``63\n11 août 2026 17:49``."""
    lines = raw_text.splitlines()
    for index, line in enumerate(lines):
        stripped = line.strip()
        if not stripped:
            continue
        if re.fullmatch(r"\d{1,3}", stripped) and 0 <= int(stripped) <= 100:
            lines[index] = f"{int(stripped)} % restant"
        break
    return "\n".join(lines)


def _format_reset(value: Any) -> str:
    if not isinstance(value, str) or not value:
        return "à corriger"
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return "à corriger"
    return parsed.strftime("%d/%m/%Y à %H:%M")


def _warning_codes(candidate: dict) -> list[str]:
    result: list[str] = []
    for warning in candidate.get("warnings") or []:
        code = warning.get("code")
        if isinstance(code, str) and code:
            result.append(code)
    return result


def _confirmation_fields(candidate: dict) -> list[str]:
    """Return populated fields that need explicit human confirmation.

    Selecting ``Enregistrer`` in the Shortcut is that explicit confirmation.
    These fields are therefore not hard blockers when a usable value exists.
    """
    confidence = candidate.get("field_confidence") or {}
    return [
        field
        for field in ("remaining_percent", "reset_at", "measurement_scope")
        if candidate.get(field) is not None and confidence.get(field) == "ambiguous"
    ]


def _hard_commit_blockers(candidate: dict) -> list[str]:
    """Return defects that cannot be resolved by pressing Save alone."""
    confidence = candidate.get("field_confidence") or {}
    blockers: list[str] = []
    for field in ("remaining_percent", "reset_at", "measurement_scope"):
        if candidate.get(field) is None or confidence.get(field) == "absent":
            blockers.append(field)
    blockers.extend(
        code for code in _warning_codes(candidate) if code in BLOCKING_WARNING_CODES
    )
    return list(dict.fromkeys(blockers))


def _summary(candidate: dict) -> str:
    percent = candidate.get("remaining_percent")
    percent_text = f"{percent} %" if isinstance(percent, int) else "à corriger"
    credits_status = candidate.get("purchased_credits_status", "not_displayed")
    credits_value = candidate.get("purchased_credits_remaining")
    if credits_status == "explicit_value" and isinstance(credits_value, (int, float)):
        credits_text = str(credits_value)
    else:
        credits_text = _CREDIT_LABELS.get(credits_status, "inconnus")

    warnings = _warning_codes(candidate)
    blockers = _hard_commit_blockers(candidate)
    confirmation_fields = _confirmation_fields(candidate)
    lines = [
        "Vérifier le relevé",
        "",
        f"Quota restant : {percent_text}",
        f"Réinitialisation : {_format_reset(candidate.get('reset_at'))}",
        f"Crédits supplémentaires : {credits_text}",
    ]
    if warnings:
        lines.extend(("", "Avertissements : " + ", ".join(warnings)))
    if blockers:
        lines.extend(("", "Correction requise : " + ", ".join(blockers)))
    elif confirmation_fields:
        lines.extend(
            (
                "",
                "Confirmation requise : " + ", ".join(confirmation_fields),
                "Choisissez Enregistrer pour confirmer ces valeurs.",
            )
        )
    else:
        lines.extend(("", "Prêt à enregistrer."))
    return "\n".join(lines)


def analyze_text(
    raw_text: str,
    input_kind: str = "image_ocr",
    *,
    captured_at: str | None = None,
    import_id: str | None = None,
    scope: str = DEFAULT_SCOPE,
    timezone: str = DEFAULT_TIMEZONE,
) -> dict:
    """Analyze transient text and return a Shortcuts-friendly response."""
    if input_kind not in INPUT_KINDS:
        raise ValidationError("unsupported input kind")
    if not isinstance(raw_text, str) or not raw_text.strip():
        raise ValidationError("input text is required")
    if input_kind == "manual_text":
        raw_text = _normalize_manual_text(raw_text)
    request = {
        "schemaVersion": 1,
        "import_type": "usage_snapshot_analyze_request",
        "import_id": validate_import_id(import_id or _new_import_id()),
        "captured_at": captured_at or _now_iso(),
        "source": "shortcut",
        "measurement_scope": scope,
        "quota_scope": scope,
        "timezone": timezone,
        "transient": {
            "input_kind": input_kind,
            "raw_text": raw_text,
        },
    }
    response = analyze(request)
    candidate = response.get("candidate") or {}
    blockers = _hard_commit_blockers(candidate)
    confirmation_fields = _confirmation_fields(candidate)
    return {
        **response,
        "shortcut_summary": _summary(candidate),
        "shortcut_can_commit": not blockers,
        "shortcut_needs_confirmation": bool(confirmation_fields),
        "shortcut_confirmation_fields": confirmation_fields,
        "shortcut_blockers": blockers,
    }


def commit_staged(
    import_id: str,
    *,
    validated_at: str | None = None,
    staging: StagingStore | None = None,
) -> dict:
    """Commit a staged candidate after the user selected Save in Shortcuts.

    Selecting Save explicitly confirms populated fields classified as ambiguous.
    Missing values and hard date/scope warnings remain blocking.
    """
    clean_import_id = validate_import_id(import_id.strip())
    staging_store = staging or StagingStore()
    staged = staging_store.load(clean_import_id)
    candidate = staged.get("candidate") or {}
    blockers = _hard_commit_blockers(candidate)
    confirmation_fields = _confirmation_fields(candidate)
    if blockers:
        return {
            "schemaVersion": 1,
            "import_type": "usage_snapshot_quick_commit_result",
            "status": "needs_edit",
            "import_id": clean_import_id,
            "stored": False,
            "blockers": blockers,
            "message": "Le relevé doit être corrigé avant enregistrement.",
        }

    confirmed_codes = [
        warning["code"]
        for warning in candidate.get("warnings") or []
        if warning.get("requires_confirmation") and warning.get("code")
    ]
    response = commit_import(
        {
            "schemaVersion": 1,
            "import_type": "usage_snapshot_commit_request",
            "import_id": clean_import_id,
            "action": "commit",
            "validated_by_user": True,
            "validated_at": validated_at or _now_iso(),
            "overrides": {},
            "confirmed_warning_codes": confirmed_codes,
            "comment": None,
        }
    )
    return {
        **response,
        "confirmed_ambiguous_fields": confirmation_fields,
        "shortcut_summary": (
            "Relevé enregistré."
            if response.get("status") == "committed"
            else "Relevé déjà enregistré."
        ),
    }


def cancel_staged(import_id: str) -> dict:
    clean_import_id = validate_import_id(import_id.strip())
    return cancel_import(
        {
            "schemaVersion": 1,
            "import_type": "usage_snapshot_cancel_request",
            "import_id": clean_import_id,
            "action": "cancel",
        }
    )


def dispatch_cli(argv: list[str], stdin_text: str) -> dict:
    if not argv or argv[0] not in {"analyze", "commit", "cancel"}:
        raise ValidationError("operation must be analyze, commit, or cancel")
    operation = argv[0]
    input_kind = argv[1] if len(argv) > 1 else "image_ocr"
    if len(argv) > 2:
        raise ValidationError("too many arguments")
    if operation == "analyze":
        return analyze_text(stdin_text, input_kind)
    if operation == "commit":
        return commit_staged(stdin_text)
    return cancel_staged(stdin_text)


def main(argv: list[str] | None = None) -> int:
    try:
        response = dispatch_cli(list(sys.argv[1:] if argv is None else argv), sys.stdin.read())
    except Exception as exc:
        response = _public_error(exc)
    print(json.dumps(response, ensure_ascii=False, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
