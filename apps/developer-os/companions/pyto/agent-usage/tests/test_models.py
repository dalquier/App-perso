import unittest
from helpers import ROOT  # noqa: F401
from models import TaskRecord, UsageSnapshot

class ModelTests(unittest.TestCase):
    def test_task_defaults(self):
        task = TaskRecord.create(task_id="TSK-20260805-001", tool="codex", project_id="developeros", title="Build", started_at="2026-08-05T10:00:00+00:00", status="running", source="manual")
        self.assertIsNone(task.ended_at)
        self.assertEqual(task.schemaVersion, 1)
    def test_snapshot_to_dict(self):
        snap = UsageSnapshot.create(snapshot_id="SNP-20260805-001", captured_at="2026-08-05T10:00:00+00:00", remaining_percent=50, reset_at="2026-08-12T10:00:00+00:00", measurement_scope="weekly", source="manual", validated_at="2026-08-05T10:01:00+00:00")
        self.assertEqual(snap.to_dict()["remaining_percent"], 50)
if __name__ == "__main__": unittest.main()
