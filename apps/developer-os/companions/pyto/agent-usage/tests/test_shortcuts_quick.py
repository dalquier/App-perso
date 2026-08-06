from __future__ import annotations

import shortcuts_quick as quick


class FakeStaging:
    def __init__(self, candidate):
        self.candidate = candidate

    def load(self, import_id):
        return {"candidate": self.candidate}


def candidate(**overrides):
    value = {
        "remaining_percent": 63,
        "reset_at": "2026-08-11T17:49:00+02:00",
        "measurement_scope": "chatgpt_agentic_shared",
        "quota_scope": "chatgpt_agentic_shared",
        "purchased_credits_remaining": None,
        "purchased_credits_status": "not_displayed",
        "field_confidence": {
            "remaining_percent": "certain",
            "reset_at": "certain",
            "measurement_scope": "certain",
        },
        "warnings": [],
    }
    value.update(overrides)
    return value


def test_quick_analyze_builds_strict_request_without_raw_text_in_response(monkeypatch):
    captured = {}

    def fake_analyze(request):
        captured.update(request)
        return {
            "schemaVersion": 1,
            "status": "needs_confirmation",
            "import_id": request["import_id"],
            "candidate": candidate(),
        }

    monkeypatch.setattr(quick, "analyze", fake_analyze)
    result = quick.analyze_text(
        "63 % restant\nReset 11 août 2026 17:49",
        "image_ocr",
        captured_at="2026-08-05T13:45:00+02:00",
        import_id="IMP-TEST",
    )

    assert captured["transient"]["raw_text"].startswith("63 %")
    assert result["import_id"] == "IMP-TEST"
    assert result["shortcut_can_commit"] is True
    assert result["shortcut_needs_confirmation"] is False
    assert "63 % restant" not in str(result)
    assert "Quota restant : 63 %" in result["shortcut_summary"]


def test_manual_compact_input_is_normalized(monkeypatch):
    captured = {}

    def fake_analyze(request):
        captured.update(request)
        return {"candidate": candidate(), "import_id": request["import_id"]}

    monkeypatch.setattr(quick, "analyze", fake_analyze)
    quick.analyze_text(
        "63\n11 août 2026 17:49",
        "manual_text",
        captured_at="2026-08-05T13:45:00+02:00",
        import_id="IMP-MANUAL",
    )
    assert captured["transient"]["raw_text"].startswith("63 % restant")


def test_quick_commit_confirms_nonblocking_warning(monkeypatch):
    captured = {}

    def fake_commit(request):
        captured.update(request)
        return {"status": "committed", "snapshot_id": "SNP-20260805-001"}

    monkeypatch.setattr(quick, "commit_import", fake_commit)
    staged = candidate(
        warnings=[
            {
                "code": "RESET_PUNCTUATION_NORMALIZED",
                "field": "reset_at",
                "requires_confirmation": True,
            }
        ]
    )
    result = quick.commit_staged(
        "IMP-TEST",
        validated_at="2026-08-05T13:46:00+02:00",
        staging=FakeStaging(staged),
    )

    assert result["status"] == "committed"
    assert captured["validated_by_user"] is True
    assert captured["confirmed_warning_codes"] == [
        "RESET_PUNCTUATION_NORMALIZED"
    ]


def test_quick_commit_accepts_ambiguous_populated_candidate_after_save(monkeypatch):
    captured = {}

    def fake_commit(request):
        captured.update(request)
        return {"status": "committed", "snapshot_id": "SNP-20260805-001"}

    monkeypatch.setattr(quick, "commit_import", fake_commit)
    staged = candidate(
        field_confidence={
            "remaining_percent": "ambiguous",
            "reset_at": "ambiguous",
            "measurement_scope": "certain",
        }
    )
    result = quick.commit_staged("IMP-TEST", staging=FakeStaging(staged))

    assert result["status"] == "committed"
    assert captured["validated_by_user"] is True
    assert result["confirmed_ambiguous_fields"] == [
        "remaining_percent",
        "reset_at",
    ]


def test_quick_analyze_marks_ambiguous_values_as_confirmation_not_correction(monkeypatch):
    def fake_analyze(request):
        return {
            "candidate": candidate(
                field_confidence={
                    "remaining_percent": "ambiguous",
                    "reset_at": "ambiguous",
                    "measurement_scope": "certain",
                }
            ),
            "import_id": request["import_id"],
        }

    monkeypatch.setattr(quick, "analyze", fake_analyze)
    result = quick.analyze_text(
        "0 % restant\nReset 11 août 2026 17:49",
        captured_at="2026-08-05T13:45:00+02:00",
        import_id="IMP-AMBIGUOUS",
    )

    assert result["shortcut_can_commit"] is True
    assert result["shortcut_needs_confirmation"] is True
    assert result["shortcut_confirmation_fields"] == [
        "remaining_percent",
        "reset_at",
    ]
    assert "Confirmation requise" in result["shortcut_summary"]
    assert "Correction requise" not in result["shortcut_summary"]


def test_quick_commit_still_blocks_missing_value(monkeypatch):
    called = False

    def fake_commit(request):
        nonlocal called
        called = True
        return {}

    monkeypatch.setattr(quick, "commit_import", fake_commit)
    staged = candidate(
        remaining_percent=None,
        field_confidence={
            "remaining_percent": "absent",
            "reset_at": "certain",
            "measurement_scope": "certain",
        },
    )
    result = quick.commit_staged("IMP-TEST", staging=FakeStaging(staged))

    assert result["status"] == "needs_edit"
    assert "remaining_percent" in result["blockers"]
    assert called is False


def test_quick_commit_blocks_past_reset_warning(monkeypatch):
    staged = candidate(
        warnings=[
            {
                "code": "RESET_IN_PAST",
                "field": "reset_at",
                "requires_confirmation": False,
            }
        ]
    )
    result = quick.commit_staged("IMP-TEST", staging=FakeStaging(staged))
    assert result["status"] == "needs_edit"
    assert "RESET_IN_PAST" in result["blockers"]


def test_cancel_uses_strict_cancel_envelope(monkeypatch):
    captured = {}

    def fake_cancel(request):
        captured.update(request)
        return {"status": "cancelled"}

    monkeypatch.setattr(quick, "cancel_import", fake_cancel)
    result = quick.cancel_staged("IMP-TEST")

    assert result["status"] == "cancelled"
    assert captured["import_type"] == "usage_snapshot_cancel_request"
    assert captured["action"] == "cancel"
