import tempfile, unittest
from pathlib import Path
from helpers import ROOT  # noqa: F401
from models import UsageSnapshot
from storage import JsonlStore

class StorageTests(unittest.TestCase):
    def test_append_and_read_snapshot(self):
        with tempfile.TemporaryDirectory() as tmp:
            store = JsonlStore(Path(tmp))
            snap = UsageSnapshot.create(snapshot_id="SNP-20260805-001", captured_at="2026-08-05T10:00:00+00:00", remaining_percent=50, reset_at="2026-08-12T10:00:00+00:00", measurement_scope="weekly", source="manual", validated_at="2026-08-05T10:01:00+00:00")
            store.add_snapshot(snap)
            self.assertEqual(store.snapshots()[0].snapshot_id, snap.snapshot_id)
if __name__ == "__main__": unittest.main()
