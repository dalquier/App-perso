import unittest
from helpers import ROOT  # noqa: F401
from analytics import calculate_interval, forecast_exhaustion, freshness
from models import TaskRecord, UsageSnapshot

class AnalyticsTests(unittest.TestCase):
    def snapshot(self, sid, captured, remaining):
        return UsageSnapshot.create(snapshot_id=sid, captured_at=captured, remaining_percent=remaining, reset_at="2026-08-12T10:00:00+00:00", measurement_scope="weekly", source="manual", validated_at=captured)
    def test_single_task_attribution(self):
        before = self.snapshot("SNP-20260805-001", "2026-08-05T10:00:00+00:00", 80)
        after = self.snapshot("SNP-20260805-002", "2026-08-05T11:00:00+00:00", 75)
        task = TaskRecord.create(task_id="TSK-20260805-001", tool="codex", project_id="developeros", title="Build", started_at="2026-08-05T10:30:00+00:00", status="completed", source="manual")
        interval = calculate_interval(before, after, [task])
        self.assertEqual(interval.delta_percent, 5)
        self.assertEqual(interval.attribution_mode, "single_task")
    def test_reset_or_correction(self):
        interval = calculate_interval(self.snapshot("SNP-20260805-001", "2026-08-05T10:00:00+00:00", 70), self.snapshot("SNP-20260805-002", "2026-08-05T11:00:00+00:00", 90), [])
        self.assertEqual(interval.attribution_mode, "reset_or_correction")
        self.assertIsNone(interval.delta_percent)
    def test_forecast_requires_two_valid_deltas(self):
        self.assertEqual(forecast_exhaustion([], [])["confidence"], "unknown")
    def test_freshness(self):
        self.assertEqual(freshness("2026-08-05T10:00:00+00:00", now=__import__('datetime').datetime(2026,8,5,12,tzinfo=__import__('datetime').timezone.utc)), "fresh")
if __name__ == "__main__": unittest.main()
