import unittest
from helpers import ROOT  # noqa: F401
from errors import ValidationError
from models import TaskRecord, UsageSnapshot
from validation import validate_snapshot, validate_task

class ValidationTests(unittest.TestCase):
    def test_percent_bounds(self):
        snap = UsageSnapshot.create(snapshot_id="SNP-20260805-001", captured_at="2026-08-05T10:00:00+00:00", remaining_percent=101, reset_at="2026-08-12T10:00:00+00:00", measurement_scope="weekly", source="manual", validated_at="2026-08-05T10:01:00+00:00")
        with self.assertRaises(ValidationError): validate_snapshot(snap)
    def test_observed_delta_requires_attribution(self):
        task = TaskRecord.create(task_id="TSK-20260805-001", tool="codex", project_id="developeros", title="Build", started_at="2026-08-05T10:00:00+00:00", status="completed", source="manual", observed_delta_percent=2)
        with self.assertRaises(ValidationError): validate_task(task)
if __name__ == "__main__": unittest.main()
