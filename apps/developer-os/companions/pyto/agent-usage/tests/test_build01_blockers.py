import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from helpers import ROOT
from analytics import calculate_interval, forecast_exhaustion, weekly_summary
from errors import StorageError, ValidationError
from identifiers import next_identifier
from models import TaskRecord, UsageInterval, UsageSnapshot, parse_datetime
from storage import JsonlStore
from task_logger import TaskLogger
from validation import validate_interval


def snap(i, pct, cycle="c1", event="unknown", credits=None):
    return UsageSnapshot.create(
        snapshot_id=f"SNP-20260805-{i:03d}",
        captured_at=f"2026-08-05T1{i}:00:00+02:00",
        remaining_percent=pct,
        reset_at="2026-08-12T10:00:00+02:00",
        measurement_scope="agent",
        quota_scope="agent",
        quota_cycle_id=cycle,
        purchased_credits_remaining=credits,
        source="manual",
        validated_at=f"2026-08-05T1{i}:01:00+02:00",
        human_validated=True,
        quota_event=event,
    )


class Build01BlockerTests(unittest.TestCase):
    def test_corrupt_jsonl_partial_recovery_and_export(self):
        with tempfile.TemporaryDirectory() as tmp:
            store = JsonlStore(Path(tmp))
            store.ensure()
            (Path(tmp) / "tasks.jsonl").write_text('{"task_id":"ok"}\n{bad\n', encoding="utf-8")
            report = store.read_report("tasks")
            self.assertEqual(len(report.records), 1)
            self.assertEqual(len(report.skipped), 1)
            self.assertEqual(len(report.skipped[0].content_hash), 64)
            self.assertFalse(hasattr(report.skipped[0], "raw"))
            out = Path(tmp) / "export.json"
            store.export_valid(out)
            exported = json.loads(out.read_text(encoding="utf-8"))
            self.assertEqual(exported["tasks"], [{"task_id": "ok"}])
            with self.assertRaises(StorageError):
                store.append("tasks", {"task_id": "new"})

    def test_atomic_write_leaves_backup_after_rewrite_and_can_read_backup(self):
        with tempfile.TemporaryDirectory() as tmp:
            store = JsonlStore(Path(tmp))
            store._atomic_write_records("tasks", [{"task_id": "old"}])
            with patch("os.replace", side_effect=RuntimeError("interrupted")):
                with self.assertRaises(RuntimeError):
                    store._atomic_write_records("tasks", [{"task_id": "new"}])
            self.assertEqual(store.read_all("tasks"), [{"task_id": "old"}])
            (Path(tmp) / "tasks.jsonl").unlink()
            self.assertEqual(store.read_all("tasks"), [{"task_id": "old"}])

    def test_cycles_incompatible_and_forecast_blocked_after_reset(self):
        a, b = snap(1, 80, "c1"), snap(2, 70, "c2")
        self.assertFalse(calculate_interval(a, b, []).is_same_quota_cycle)
        c, d = snap(3, 60), snap(4, 90, event="reset")
        interval = calculate_interval(c, d, [])
        forecast = forecast_exhaustion([c, d], [interval])
        self.assertEqual(forecast["unavailable_reason"], "unresolved_reset_or_correction")

    def test_identifier_over_nine_null_zero_and_naive_datetime(self):
        ids = [f"SNP-20260805-{n:03d}" for n in range(1, 10)]
        self.assertEqual(
            next_identifier("snapshot", ids, parse_datetime("2026-08-05T10:00:00+02:00", "captured_at")),
            "SNP-20260805-010",
        )
        self.assertIsNone(snap(1, 80, credits=None).purchased_credits_remaining)
        self.assertEqual(snap(1, 80, credits=0).purchased_credits_remaining, 0)
        with self.assertRaises(ValueError):
            parse_datetime("2026-08-05T10:00:00", "captured_at")

    def test_closed_task_is_not_active_and_weekly_summary_deduplicates_events(self):
        with tempfile.TemporaryDirectory() as tmp:
            store = JsonlStore(Path(tmp))
            logger = TaskLogger(store)
            task = logger.start_task(
                "codex",
                "developeros",
                "Build",
                started_at="2026-08-05T10:00:00+02:00",
            )
            logger.close_task(task.task_id, ended_at="2026-08-05T10:30:00+02:00")
            self.assertIsNone(logger.active_task())
            filtered = logger.filter_tasks(week_start="2026-08-03T00:00:00+02:00")
            self.assertEqual(len(filtered), 1)
            self.assertEqual(filtered[0].status, "completed")
            summary = weekly_summary(
                store.tasks(),
                [],
                [],
                "2026-08-03T00:00:00+02:00",
                "codex",
                "developeros",
            )
            self.assertEqual(summary.task_count, 1)
            self.assertEqual(summary.completed_task_count, 1)

    def test_interval_order_and_duplicate_interval_validation(self):
        invalid = UsageInterval(
            schemaVersion=1,
            interval_id="INT-20260805-001",
            from_snapshot_id="SNP-20260805-001",
            to_snapshot_id="SNP-20260805-002",
            started_at="2026-08-05T11:00:00+02:00",
            ended_at="2026-08-05T10:00:00+02:00",
            quota_scope="agent",
            quota_cycle_id="c1",
            delta_percent=1,
            task_ids=[],
            attribution_mode="no_task",
            confidence="observed",
            is_same_quota_cycle=True,
            invalid_reason=None,
            calculation_evidence="test",
        )
        with self.assertRaises(ValidationError):
            validate_interval(invalid)

    def test_examples_json_are_valid(self):
        for path in (ROOT / "examples").glob("*.json"):
            json.loads(path.read_text(encoding="utf-8"))
