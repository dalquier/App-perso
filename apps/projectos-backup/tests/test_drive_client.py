import hashlib
import json
from pathlib import Path
import tempfile
import unittest

from projectos_backup.drive_client import (
    DriveSyncError, MAX_BATCH_FILES, manifest_files, normalize_apps_script_url, sync_current,
)


def manifest(records, run_id="run-new"):
    return {
        "status": "complete", "runId": run_id, "fileCount": len(records),
        "sources": [{"folder": "Pyto", "files": records}],
    }


class FakeClient:
    def __init__(self, remote=None, fail_action=None, legacy=False, verified=None):
        self.remote, self.calls = remote, []
        self.fail_action, self.legacy, self.verified = fail_action, legacy, verified
        self.manifest_calls = 0

    def call(self, action, **payload):
        self.calls.append((action, payload))
        if action == "manifest":
            self.manifest_calls += 1
            return {"manifest": self.remote if self.manifest_calls == 1 else self.verified}
        if self.legacy and action in {"uploadBatch", "deleteBatch"}:
            raise DriveSyncError("Action inconnue")
        if action == self.fail_action:
            raise DriveSyncError("échec")
        return {}


def prepare(current, files, remote=None):
    records = []
    (current / "Pyto").mkdir()
    for name, data in files:
        (current / "Pyto" / name).write_bytes(data)
        records.append({"path": name, "sha256": hashlib.sha256(data).hexdigest()})
    local = manifest(records)
    (current / "MANIFEST.json").write_text(json.dumps(local), encoding="utf-8")
    return local, FakeClient(remote or manifest([], "run-old"), verified=local)


class DriveClientTests(unittest.TestCase):
    def test_normalizes_google_copy_artifacts(self):
        raw = "  “https://script.google.com/macros/s/AKfy-test_123/exec/?authuser=0”  "
        self.assertEqual(normalize_apps_script_url(raw), "https://script.google.com/macros/s/AKfy-test_123/exec")

    def test_rejects_wrong_relay_host(self):
        with self.assertRaises(ValueError):
            normalize_apps_script_url("https://example.com/macros/s/id/exec")

    def test_manifest_files_prefixes_source_folder(self):
        self.assertEqual(list(manifest_files(manifest([{"path": "a.py"}]))), ["Pyto/a.py"])

    def test_batches_uploads_and_finalizes_then_verifies(self):
        with tempfile.TemporaryDirectory() as raw:
            current = Path(raw)
            files = [(f"f{i}.txt", str(i).encode()) for i in range(MAX_BATCH_FILES + 1)]
            local, client = prepare(current, files)
            result = sync_current(current, client)
            actions = [action for action, _ in client.calls]
            self.assertEqual(actions, ["manifest", "uploadBatch", "uploadBatch", "finalize", "manifest"])
            self.assertEqual(result["uploaded_files"], len(files))
            self.assertEqual(client.calls[-2][1]["manifest"], local)

    def test_batches_deletes(self):
        with tempfile.TemporaryDirectory() as raw:
            current = Path(raw)
            old = [{"path": f"old{i}", "sha256": "z"} for i in range(MAX_BATCH_FILES + 1)]
            local, client = prepare(current, [], manifest(old, "run-old"))
            client.verified = local
            sync_current(current, client)
            self.assertEqual([a for a, _ in client.calls], ["manifest", "deleteBatch", "deleteBatch", "finalize", "manifest"])

    def test_legacy_relay_falls_back_to_individual_actions(self):
        with tempfile.TemporaryDirectory() as raw:
            current = Path(raw)
            local, client = prepare(current, [("a", b"x")], manifest([{"path": "old", "sha256": "z"}], "old"))
            client.legacy, client.verified = True, local
            sync_current(current, client)
            self.assertEqual(
                [a for a, _ in client.calls],
                ["manifest", "uploadBatch", "upload", "deleteBatch", "delete", "finalize", "manifest"],
            )

    def test_failed_upload_batch_never_deletes_or_finalizes(self):
        with tempfile.TemporaryDirectory() as raw:
            current = Path(raw)
            _, client = prepare(current, [("a", b"x")], manifest([{"path": "old", "sha256": "z"}], "old"))
            client.fail_action = "uploadBatch"
            with self.assertRaises(DriveSyncError):
                sync_current(current, client)
            self.assertEqual([a for a, _ in client.calls], ["manifest", "uploadBatch"])

    def test_manifest_mismatch_fails_after_finalize(self):
        with tempfile.TemporaryDirectory() as raw:
            current = Path(raw)
            local, client = prepare(current, [("a", b"x")])
            client.verified = json.loads(json.dumps(local))
            client.verified["sources"][0]["files"][0]["sha256"] = "incorrect"
            self.assertEqual(client.verified["runId"], local["runId"])
            self.assertEqual(client.verified["fileCount"], local["fileCount"])
            with self.assertRaisesRegex(DriveSyncError, "ne correspond pas"):
                sync_current(current, client)
            self.assertEqual([a for a, _ in client.calls][-2:], ["finalize", "manifest"])


if __name__ == "__main__":
    unittest.main()
