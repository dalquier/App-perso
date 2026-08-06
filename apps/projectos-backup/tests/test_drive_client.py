import hashlib
import json
from pathlib import Path
import tempfile
import unittest

from projectos_backup.drive_client import DriveSyncError, manifest_files, sync_current

def manifest(records):
    return {"status": "complete", "sources": [{"folder": "Pyto", "files": records}]}

class FakeClient:
    def __init__(self, remote=None, fail_upload=False): self.remote, self.calls, self.fail_upload = remote, [], fail_upload
    def call(self, action, **payload):
        self.calls.append((action, payload))
        if action == "manifest": return {"manifest": self.remote}
        if action == "upload" and self.fail_upload: raise DriveSyncError("échec")
        return {}

class DriveClientTests(unittest.TestCase):
    def test_manifest_files_prefixes_source_folder(self):
        self.assertEqual(list(manifest_files(manifest([{"path": "a.py"}]))), ["Pyto/a.py"])

    def test_upload_then_delete_then_finalize(self):
        with tempfile.TemporaryDirectory() as raw:
            current = Path(raw); (current / "Pyto").mkdir(); data = b"new"
            (current / "Pyto/a.py").write_bytes(data)
            local = manifest([{"path": "a.py", "sha256": hashlib.sha256(data).hexdigest()}])
            (current / "MANIFEST.json").write_text(json.dumps(local))
            remote = manifest([{"path": "old.py", "sha256": "old"}])
            client = FakeClient(remote)
            result = sync_current(current, client)
            self.assertEqual([action for action, _ in client.calls], ["manifest", "upload", "delete", "finalize"])
            self.assertEqual(result["uploaded_files"], 1); self.assertEqual(result["deleted_files"], 1)

    def test_failed_upload_never_deletes_or_finalizes(self):
        with tempfile.TemporaryDirectory() as raw:
            current = Path(raw); (current / "Pyto").mkdir(); (current / "Pyto/a").write_bytes(b"x")
            local = manifest([{"path": "a", "sha256": hashlib.sha256(b"x").hexdigest()}])
            (current / "MANIFEST.json").write_text(json.dumps(local))
            client = FakeClient(manifest([{"path": "old", "sha256": "z"}]), True)
            with self.assertRaises(DriveSyncError): sync_current(current, client)
            self.assertEqual([action for action, _ in client.calls], ["manifest", "upload"])

if __name__ == "__main__": unittest.main()
