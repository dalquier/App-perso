from __future__ import annotations

from datetime import datetime, timedelta, timezone
import json
from pathlib import Path
from types import SimpleNamespace

from helpers import ROOT  # noqa: F401

from widget import build_all, next_reload_after, safe_requested_link, show_pyto_widget
from widget_reader import read_widget_data
from widget_render_charts import history_chart, quota_gauge
from widget_render_native import render_widget
from widget_viewmodel import build_view_model


SCOPE = "chatgpt_agentic_shared"
RESET = "2026-08-12T18:00:00+02:00"


def write_jsonl(root: Path, name: str, rows: list[dict]) -> None:
    path = root / name
    path.write_text("".join(json.dumps(row, sort_keys=True) + "\n" for row in rows), encoding="utf-8")


def snapshot(
    index: int,
    percent: float,
    captured: datetime,
    *,
    cycle: str = "cycle-a",
    credits: float | None = None,
    event: str = "unknown",
    confidence: str = "observed",
    human_validated: bool = True,
    source: str = "shortcut",
    reset_at: str = RESET,
) -> dict:
    return {
        "schemaVersion": 1,
        "snapshot_id": f"SNP-20260805-{index:03d}",
        "captured_at": captured.isoformat(),
        "remaining_percent": percent,
        "reset_at": reset_at,
        "measurement_scope": SCOPE,
        "quota_scope": SCOPE,
        "quota_cycle_id": cycle,
        "purchased_credits_remaining": credits,
        "source": source,
        "confidence": confidence,
        "validated_at": captured.isoformat(),
        "human_validated": human_validated,
        "quota_event": event,
        "raw_text_hash": None,
    }


def interval(
    index: int,
    before: str,
    after: str,
    delta: float | None,
    *,
    mode: str = "single_task",
    cycle: str = "cycle-a",
    ended_at: str = "2026-08-05T10:00:00+00:00",
) -> dict:
    task_ids = ["TSK-20260805-001"] if mode == "single_task" else ["TSK-20260805-001", "TSK-20260805-002"] if mode == "multi_task" else []
    confidence = "attributed" if mode == "single_task" else "interval_only" if mode == "multi_task" else "unknown"
    invalid_reason = "reset" if mode == "reset_or_correction" else "different_quota_scope_or_cycle" if mode == "not_comparable" else None
    return {
        "schemaVersion": 1,
        "interval_id": f"INT-20260805-{index:03d}",
        "from_snapshot_id": before,
        "to_snapshot_id": after,
        "started_at": "2026-08-05T08:00:00+00:00",
        "ended_at": ended_at,
        "quota_scope": SCOPE,
        "quota_cycle_id": cycle,
        "delta_percent": delta,
        "task_ids": task_ids,
        "attribution_mode": mode,
        "confidence": confidence,
        "is_same_quota_cycle": mode != "not_comparable",
        "invalid_reason": invalid_reason,
        "calculation_evidence": "fixture",
    }


def task(
    status: str = "completed",
    ended_at: str | None = "2026-08-05T09:00:00+00:00",
    *,
    task_id: str = "TSK-20260805-001",
) -> dict:
    return {
        "schemaVersion": 1,
        "task_id": task_id,
        "tool": "codex",
        "project_id": "DeveloperOS",
        "title": "Fixture",
        "started_at": "2026-08-05T08:30:00+00:00",
        "ended_at": ended_at,
        "status": status,
        "source": "manual",
        "usage_interval_id": None,
        "quota_before_percent": None,
        "quota_after_percent": None,
        "observed_delta_percent": None,
        "credits_observed": None,
        "credits_estimated": None,
        "estimation_method": None,
        "confidence": "unknown",
        "evidence": None,
        "notes": None,
    }


def test_reader_empty_does_not_create_files(tmp_path):
    before = list(tmp_path.iterdir())
    result = read_widget_data(tmp_path)
    after = list(tmp_path.iterdir())
    assert result.storage_state == "empty"
    assert result.public_message == "Aucun relevé"
    assert before == after == []


def test_reader_backup_only_is_explicit(tmp_path):
    now = datetime(2026, 8, 5, 10, tzinfo=timezone.utc)
    write_jsonl(tmp_path, "usage_snapshots.jsonl.bak", [snapshot(1, 80, now)])
    result = read_widget_data(tmp_path)
    assert result.storage_state == "backup"
    assert result.public_message == "Sauvegarde utilisée"
    assert result.used_backup_collections == ("snapshots",)
    assert result.snapshots[0].remaining_percent == 80


def test_reader_corrupt_primary_keeps_valid_rows_without_backup_substitution(tmp_path):
    now = datetime(2026, 8, 5, 10, tzinfo=timezone.utc)
    primary = tmp_path / "usage_snapshots.jsonl"
    primary.write_text(json.dumps(snapshot(1, 70, now)) + "\n{bad}\n", encoding="utf-8")
    write_jsonl(tmp_path, "usage_snapshots.jsonl.bak", [snapshot(2, 99, now)])
    result = read_widget_data(tmp_path)
    assert result.storage_state == "corrupt"
    assert result.public_message == "Stockage à vérifier"
    assert [item.remaining_percent for item in result.snapshots] == [70]
    assert result.used_backup_collections == ()


def test_reader_duplicate_snapshot_ids_marks_corrupt(tmp_path):
    now = datetime(2026, 8, 5, 10, tzinfo=timezone.utc)
    row = snapshot(1, 70, now)
    write_jsonl(tmp_path, "usage_snapshots.jsonl", [row, row])
    assert read_widget_data(tmp_path).storage_state == "corrupt"


def test_viewmodel_thresholds_and_null_zero(tmp_path):
    now = datetime(2026, 8, 5, 10, tzinfo=timezone.utc)
    for percent, state in ((80, "comfortable"), (30, "warning"), (10, "critical"), (0, "exhausted")):
        write_jsonl(tmp_path, "usage_snapshots.jsonl", [snapshot(1, percent, now, credits=0)])
        vm = build_view_model(read_widget_data(tmp_path), now=now)
        assert vm.state == state
        assert vm.credits_text == "Crédits : 0"
    write_jsonl(tmp_path, "usage_snapshots.jsonl", [snapshot(1, 80, now, credits=None)])
    assert build_view_model(read_widget_data(tmp_path), now=now).credits_text is None


def test_unvalidated_or_non_observed_snapshot_is_not_displayed(tmp_path):
    now = datetime(2026, 8, 5, 10, tzinfo=timezone.utc)
    write_jsonl(
        tmp_path,
        "usage_snapshots.jsonl",
        [
            snapshot(1, 80, now, confidence="estimated", human_validated=True),
            snapshot(2, 70, now, confidence="observed", human_validated=False, source="manual"),
        ],
    )
    vm = build_view_model(read_widget_data(tmp_path), now=now)
    assert vm.percent_value is None
    assert vm.status_text == "Donnée indisponible"


def test_stale_data_hides_forecast(tmp_path):
    base = datetime(2026, 8, 1, 10, tzinfo=timezone.utc)
    snaps = [snapshot(1, 90, base), snapshot(2, 80, base + timedelta(days=1)), snapshot(3, 70, base + timedelta(days=2))]
    write_jsonl(tmp_path, "usage_snapshots.jsonl", snaps)
    write_jsonl(
        tmp_path,
        "usage_intervals.jsonl",
        [
            interval(1, snaps[0]["snapshot_id"], snaps[1]["snapshot_id"], 10),
            interval(2, snaps[1]["snapshot_id"], snaps[2]["snapshot_id"], 10),
        ],
    )
    vm = build_view_model(read_widget_data(tmp_path), now=datetime(2026, 8, 5, 10, tzinfo=timezone.utc))
    assert vm.state == "stale"
    assert vm.forecast_text == "Prévision indisponible"


def test_forecast_after_reset_is_hidden(tmp_path):
    base = datetime(2026, 8, 5, 10, tzinfo=timezone.utc)
    short_reset = "2026-08-05T15:00:00+00:00"
    snaps = [
        snapshot(1, 100, base, reset_at=short_reset),
        snapshot(2, 99, base + timedelta(hours=1), reset_at=short_reset),
        snapshot(3, 98, base + timedelta(hours=2), reset_at=short_reset),
    ]
    write_jsonl(tmp_path, "usage_snapshots.jsonl", snaps)
    write_jsonl(
        tmp_path,
        "usage_intervals.jsonl",
        [
            interval(1, snaps[0]["snapshot_id"], snaps[1]["snapshot_id"], 1, ended_at=snaps[1]["captured_at"]),
            interval(2, snaps[1]["snapshot_id"], snaps[2]["snapshot_id"], 1, ended_at=snaps[2]["captured_at"]),
        ],
    )
    assert build_view_model(read_widget_data(tmp_path), now=base + timedelta(hours=2)).forecast_text == "Prévision indisponible"


def test_history_same_cycle_and_breaks_on_increase(tmp_path):
    base = datetime(2026, 8, 5, 8, tzinfo=timezone.utc)
    rows = [
        snapshot(1, 90, base),
        snapshot(2, 80, base + timedelta(hours=1)),
        snapshot(3, 85, base + timedelta(hours=2)),
        snapshot(4, 75, base + timedelta(hours=3)),
        snapshot(5, 60, base + timedelta(hours=4), cycle="cycle-b"),
    ]
    write_jsonl(tmp_path, "usage_snapshots.jsonl", rows)
    vm = build_view_model(read_widget_data(tmp_path), now=base + timedelta(hours=4))
    assert vm.history_points == ()
    assert vm.history_summary == "Historique indisponible"


def test_tasks_are_deduplicated_and_multitask_not_attributed(tmp_path):
    now = datetime(2026, 8, 5, 10, tzinfo=timezone.utc)
    snap = snapshot(1, 80, now)
    write_jsonl(tmp_path, "usage_snapshots.jsonl", [snap])
    write_jsonl(tmp_path, "tasks.jsonl", [task("running", None), task("completed")])
    write_jsonl(
        tmp_path,
        "usage_intervals.jsonl",
        [interval(1, "SNP-20260805-010", snap["snapshot_id"], 10, mode="multi_task")],
    )
    vm = build_view_model(read_widget_data(tmp_path), now=now)
    assert vm.tasks_text == "1 tâche(s) logique(s)"
    assert vm.intervals_text == "0 intervalle(s) attribuable(s)"


def test_charts_are_in_memory_and_have_text_fallback(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    gauge = quota_gauge(63)
    history = history_chart((90, 80, 70))
    assert gauge.fallback_text.endswith("63 %")
    assert history.fallback_text.startswith("Historique")
    assert list(tmp_path.iterdir()) == []
    no_pillow = quota_gauge(63, allow_pillow=False)
    assert no_pillow.image is None
    assert "63 %" in no_pillow.fallback_text


def test_render_three_sizes_and_at_most_two_images(tmp_path):
    vm = build_view_model(read_widget_data(tmp_path))
    for size in ("small", "medium", "large"):
        rendered = render_widget(vm, size=size)
        assert rendered.size == size
        assert rendered.link == "open:diagnostic"
        assert len(rendered.charts) <= 2


def test_links_are_allowlisted():
    assert safe_requested_link("open:summary") == "open:summary"
    assert safe_requested_link("pyto://evil") is None
    assert safe_requested_link({"open": "summary"}) is None


class FakeColor:
    @staticmethod
    def rgb(*values):
        return ("rgb", values)

    @staticmethod
    def dynamic(*, light, dark):
        return ("dynamic", light, dark)


class FakeFont:
    @staticmethod
    def system_font_of_size(size):
        return ("font", size)

    @staticmethod
    def bold_system_font_of_size(size):
        return ("bold", size)


class FakeText:
    def __init__(self, text, **kwargs):
        self.text = text
        self.kwargs = kwargs


class FakeImage:
    def __init__(self, image):
        self.image = image


class FakeLayout:
    def __init__(self):
        self.rows = []
        self.link = None
        self.background = None

    def set_background_color(self, color):
        self.background = color

    def set_link(self, link):
        self.link = link

    def add_row(self, row):
        self.rows.append(row)

    def add_vertical_spacer(self):
        self.rows.append(("spacer",))


class FakeWidget:
    def __init__(self):
        self.small_layout = FakeLayout()
        self.medium_layout = FakeLayout()
        self.large_layout = FakeLayout()


def test_real_pyto_adapter_builds_three_layouts(tmp_path):
    now = datetime.now(timezone.utc)
    write_jsonl(tmp_path, "usage_snapshots.jsonl", [snapshot(1, 63, now)])
    shown = []
    scheduled = []
    fake = SimpleNamespace(
        Widget=FakeWidget,
        Color=FakeColor,
        Font=FakeFont,
        Text=FakeText,
        Image=FakeImage,
        show_widget=lambda widget: shown.append(widget),
        schedule_next_reload=lambda value: scheduled.append(value),
        link=None,
    )
    widget = show_pyto_widget(tmp_path, widgets_module=fake)
    assert shown == [widget]
    assert scheduled
    for layout in (widget.small_layout, widget.medium_layout, widget.large_layout):
        assert layout.background is not None
        assert layout.link in {"open:summary", "open:diagnostic"}
        assert layout.rows


def test_next_reload_is_45_minutes():
    now = datetime(2026, 8, 5, 10, tzinfo=timezone.utc)
    assert next_reload_after(now) == now + timedelta(minutes=45)


def test_build_all_has_all_families(tmp_path):
    rendered = build_all(tmp_path, allow_pillow=False)
    assert set(rendered) == {"small", "medium", "large"}
