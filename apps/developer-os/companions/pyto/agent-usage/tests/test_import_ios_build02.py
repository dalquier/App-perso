from __future__ import annotations

import json
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from errors import StorageError, ValidationError
from import_ledger import ImportLedger
from import_parser import normalize_for_hash, parse_usage_candidate, quota_cycle_id
from import_snapshot import cancel_import, commit_import
from import_staging import StagingStore
from shortcuts_bridge import analyze
from storage import JsonlStore

CAPTURED = "2026-08-05T13:45:00+02:00"
VALIDATED = "2026-08-05T13:46:00+02:00"
SCOPE = "chatgpt_agentic_shared"


def req(import_id: str, text: str, kind: str = "image_ocr") -> dict:
    return {
        "schemaVersion": 1,
        "import_type": "usage_snapshot_analyze_request",
        "import_id": import_id,
        "captured_at": CAPTURED,
        "source": "shortcut",
        "measurement_scope": SCOPE,
        "quota_scope": SCOPE,
        "timezone": "Europe/Paris",
        "transient": {"input_kind": kind, "raw_text": text},
    }


def creq(import_id: str, overrides: dict | None = None, valid: bool = True, confirmed: list[str] | None = None) -> dict:
    return {
        "schemaVersion": 1,
        "import_type": "usage_snapshot_commit_request",
        "import_id": import_id,
        "action": "commit",
        "validated_by_user": valid,
        "validated_at": VALIDATED,
        "overrides": overrides or {},
        "confirmed_warning_codes": confirmed or [],
        "comment": None,
    }


@pytest.fixture()
def env(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> Path:
    monkeypatch.setenv("DEVELOPEROS_AGENT_USAGE_DIR", str(tmp_path))
    return tmp_path


def test_capture_french_complete_and_no_raw_text(env: Path) -> None:
    result = analyze(req("IMP-FR", "63 % restant\nSe réinitialise le 11 août 2026 à 17:49"))
    assert result["candidate"]["remaining_percent"] == 63
    assert result["candidate"]["reset_at"] == "2026-08-11T17:49:00+02:00"
    serialized = json.dumps(result, ensure_ascii=False)
    assert "63 % restant" not in serialized
    assert "Se réinitialise" not in serialized
    staging = (env / "staging" / "IMP-FR.json").read_text(encoding="utf-8")
    assert "63 % restant" not in staging


def test_capture_english_complete(env: Path) -> None:
    result = analyze(req("IMP-EN", "Quota remaining: 63%\nResets on Aug 11, 2026 at 5:49 PM", "clipboard_text"))
    assert result["candidate"]["remaining_percent"] == 63
    assert result["candidate"]["reset_at"] == "2026-08-11T17:49:00+02:00"
    assert result["candidate"]["source"] == "shortcut"


def test_quota_zero_hundred_and_fraction_rejected(env: Path) -> None:
    assert analyze(req("IMP-Z", "0% remaining\nReset August 11 2026 5:49 PM"))["candidate"]["remaining_percent"] == 0
    assert analyze(req("IMP-H", "100 % restants\nReset 11 août 2026 17h49"))["candidate"]["remaining_percent"] == 100
    assert analyze(req("IMP-FRAC", "63.5% remaining\nReset Aug 11 2026 5:49 PM"))["candidate"]["remaining_percent"] is None


def test_credits_none_zero_positive(env: Path) -> None:
    assert analyze(req("IMP-N", "63% remaining\nReset Aug 11 2026 5:49 PM"))["candidate"]["purchased_credits_remaining"] is None
    assert analyze(req("IMP-C0", "63% remaining\nPurchased credits: 0\nReset Aug 11 2026 5:49 PM"))["candidate"]["purchased_credits_status"] == "explicit_zero"
    assert analyze(req("IMP-C250", "63% remaining\n250 credits available\nReset Aug 11 2026 5:49 PM"))["candidate"]["purchased_credits_remaining"] == 250


def test_ocr_o_percent_requires_override(env: Path) -> None:
    result = analyze(req("IMP-O", "O % restant\nSe réinitialise le 11 août 2026 à 17:49"))
    assert result["candidate"]["remaining_percent"] == 0
    assert result["candidate"]["field_confidence"]["remaining_percent"] == "ambiguous"
    with pytest.raises(ValidationError):
        commit_import(creq("IMP-O"))
    committed = commit_import(creq("IMP-O", {"remaining_percent": 0}))
    assert committed["status"] == "committed"


def test_semicolon_requires_confirmation(env: Path) -> None:
    result = analyze(req("IMP-SEMI", "63 % restant\nSe réinitialise le 11 août 2026 à 17;49"))
    codes = {warning["code"] for warning in result["candidate"]["warnings"]}
    assert "RESET_PUNCTUATION_NORMALIZED" in codes
    with pytest.raises(ValidationError):
        commit_import(creq("IMP-SEMI"))
    assert commit_import(creq("IMP-SEMI", confirmed=["RESET_PUNCTUATION_NORMALIZED"]))["status"] == "committed"


def test_year_absent_requires_explicit_reset_override(env: Path) -> None:
    analyze(req("IMP-YEAR", "Quota 63 % left\nReset 11 août at 17:49"))
    with pytest.raises(ValidationError):
        commit_import(creq("IMP-YEAR"))
    assert commit_import(creq("IMP-YEAR", {"reset_at": "2026-08-11T17:49:00+02:00"}))["status"] == "committed"


def test_past_reset_is_rejected(env: Path) -> None:
    analyze(req("IMP-PAST", "63% remaining\nReset 4 août 2026 17:49"))
    with pytest.raises(ValidationError):
        commit_import(creq("IMP-PAST"))


def test_manual_commit_idempotence_and_hash_null(env: Path) -> None:
    result = analyze(req("IMP-COM", "63\n11 août 2026 17:49", "manual_text"))
    assert result["candidate"]["raw_text_hash"] is None
    out = commit_import(creq("IMP-COM", {"remaining_percent": 63}))
    again = commit_import(creq("IMP-COM"))
    assert out["status"] == "committed"
    assert again["snapshot_id"] == out["snapshot_id"]
    assert len(JsonlStore().read_all("snapshots")) == 1


def test_reset_override_recomputes_cycle(env: Path) -> None:
    analyze(req("IMP-RESET", "63% remaining\nReset Aug 11 2026 5:49 PM"))
    changed = "2026-08-12T17:49:00+02:00"
    commit_import(creq("IMP-RESET", {"reset_at": changed}))
    snapshot = JsonlStore().read_all("snapshots")[0]
    assert snapshot["quota_cycle_id"] == quota_cycle_id(SCOPE, changed)


def test_same_hash_duplicate_is_non_destructive(env: Path) -> None:
    text = "63% remaining\nReset Aug 11 2026 5:49 PM"
    analyze(req("IMP-D1", text))
    first = commit_import(creq("IMP-D1"))
    analyze(req("IMP-D2", text))
    second = commit_import(creq("IMP-D2"))
    assert second["status"] == "duplicate_skipped"
    assert second["snapshot_id"] == first["snapshot_id"]
    assert len(JsonlStore().read_all("snapshots")) == 1


def test_staging_absent_cancel_and_unknown_override(env: Path) -> None:
    with pytest.raises(FileNotFoundError):
        commit_import(creq("IMP-MISSING"))
    analyze(req("IMP-CANCEL", "63% remaining\nReset Aug 11 2026 5:49 PM"))
    assert cancel_import({"import_id": "IMP-CANCEL", "action": "cancel"})["status"] == "cancelled"
    analyze(req("IMP-OV", "63% remaining\nReset Aug 11 2026 5:49 PM"))
    with pytest.raises(ValidationError):
        commit_import(creq("IMP-OV", {"unknown": 1}))


def test_contract_rejections(env: Path) -> None:
    bad = req("IMP-SCOPE", "63% remaining\nReset Aug 11 2026 5:49 PM")
    bad["quota_scope"] = "other"
    analyze(bad)
    with pytest.raises(ValidationError):
        commit_import(creq("IMP-SCOPE", {"measurement_scope": SCOPE, "quota_scope": "other"}))
    analyze(req("IMP-VAL", "63% remaining\nReset Aug 11 2026 5:49 PM"))
    with pytest.raises(ValidationError):
        commit_import(creq("IMP-VAL", valid=False))
    analyze(req("IMP-SOURCE", "63% remaining\nReset Aug 11 2026 5:49 PM"))
    with pytest.raises(ValidationError):
        commit_import({**creq("IMP-SOURCE"), "source": "manual"})


def test_snapshot_metadata_not_persisted_and_ledger_sanitized(env: Path) -> None:
    analyze(req("IMP-META", "63% remaining\nPurchased credits: 0\nReset Aug 11 2026 5:49 PM"))
    commit_import(creq("IMP-META"))
    snapshot = JsonlStore().read_all("snapshots")[0]
    assert "field_confidence" not in snapshot
    assert "import_id" not in snapshot
    assert snapshot["confidence"] == "observed"
    assert snapshot["human_validated"] is True
    ledger = (env / "import_events.jsonl").read_text(encoding="utf-8")
    assert "63% remaining" not in ledger
    assert "Purchased credits" not in ledger


def test_invalid_import_id_cannot_escape_staging(env: Path) -> None:
    with pytest.raises(StorageError):
        analyze(req("../escape", "63% remaining\nReset Aug 11 2026 5:49 PM"))


def test_corrupt_ledger_refuses_rewrite(env: Path) -> None:
    path = env / "import_events.jsonl"
    path.write_text("{broken\n", encoding="utf-8")
    with pytest.raises(StorageError):
        ImportLedger().append({"event_type": "cancelled", "import_id": "IMP-X"})
    assert path.read_text(encoding="utf-8") == "{broken\n"


def test_null_never_zero_and_normalization(env: Path) -> None:
    assert analyze(req("IMP-NULL", "63% remaining\nReset Aug 11 2026 5:49 PM"))["candidate"]["purchased_credits_remaining"] is None
    assert normalize_for_hash("  63 % restant\r\n\n\nReset  ").count("\n\n") == 1
