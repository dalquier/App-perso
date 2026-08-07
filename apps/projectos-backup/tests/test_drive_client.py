import hashlib
import json
from pathlib import Path
import tempfile
import unittest

from projectos_backup.drive_client import (
    DriveSyncError, MAX_BATCH_FILES, MAX_BATCH_RAW_BYTES, STATE_DIRECTORY, STATE_FILE,
    drive_state_path, has_pending_drive_sync, manifest_files, normalize_apps_script_url, sync_current,
)


def manifest(records, run_id="run-new"):
    return {
        "status": "complete", "runId": run_id, "fileCount": len(records),
        "sources": [{"folder": "Pyto", "files": records}],
    }


class FakeClient:
    def __init__(self, remote=None, lose_upload_response=False, fail_action=None):
        self.remote = remote or manifest([], "run-old")
        self.verified = None
        self.calls = []
        self.received_uploads = {}
        self.received_deletes = set()
        self.lose_upload_response = lose_upload_response
        self.lost_once = False
        self.fail_action = fail_action

    def call(self, action, **payload):
        self.calls.append((action, payload))
        if action == self.fail_action:
            raise DriveSyncError("échec")
        if action == "manifest":
            return {"manifest": self.verified if self.verified is not None else self.remote}
        if action == "beginSync":
            return {
                "receivedUploads": len(self.received_uploads),
                "receivedDeletes": len(self.received_deletes),
            }
        if action == "syncStatus":
            return {
                "receivedUploads": [
                    item["path"] for item in payload.get("uploads", [])
                    if self.received_uploads.get(item["path"]) == item["sha256"]
                ],
                "receivedDeletes": [path for path in payload.get("deletes", []) if path in self.received_deletes],
            }
        if action == "uploadBatch":
            for item in payload["files"]:
                self.received_uploads[item["path"]] = item["sha256"]
            if self.lose_upload_response and not self.lost_once:
                self.lost_once = True
                raise DriveSyncError("Google Drive — uploadBatch : timed out")
            return {"resumed": 0}
        if action == "deleteBatch":
            self.received_deletes.update(payload["paths"])
            return {"resumed": 0}
        if action == "finalizeSync":
            self.verified = payload["manifest"]
            return {"status": "complete"}
        return {}


def prepare(current, files, remote=None):
    records = []
    (current / "Pyto").mkdir()
    for name, data in files:
        (current / "Pyto" / name).write_bytes(data)
        records.append({"path": name, "sha256": hashlib.sha256(data).hexdigest()})
    local = manifest(records)
    (current / "MANIFEST.json").write_text(json.dumps(local), encoding="utf-8")
    return local, FakeClient(remote)


class DriveClientTests(unittest.TestCase):
    def test_normalizes_google_copy_artifacts(self):
        raw = "  “https://script.google.com/macros/s/AKfy-test_123/exec/?authuser=0”  "
        self.assertEqual(normalize_apps_script_url(raw), "https://script.google.com/macros/s/AKfy-test_123/exec")

    def test_rejects_wrong_relay_host(self):
        with self.assertRaises(ValueError):
            normalize_apps_script_url("https://example.com/macros/s/id/exec")

    def test_manifest_files_prefixes_source_folder(self):
        self.assertEqual(list(manifest_files(manifest([{"path": "a.py"}]))), ["Pyto/a.py"])

    def test_small_batches_finalize_and_verify(self):
        with tempfile.TemporaryDirectory() as raw:
            current = Path(raw) / "Current"
            current.mkdir()
            files = [(f"f{i}.txt", str(i).encode()) for i in range(MAX_BATCH_FILES + 1)]
            _, client = prepare(current, files)
            result = sync_current(current, client)
            upload_calls = [payload for action, payload in client.calls if action == "uploadBatch"]
            self.assertEqual([len(call["files"]) for call in upload_calls], [MAX_BATCH_FILES, 1])
            self.assertEqual(result["verified_files"], len(files))
            self.assertIn("finalizeSync", [action for action, _ in client.calls])

    def test_partitions_on_raw_byte_limit(self):
        with tempfile.TemporaryDirectory() as raw:
            current = Path(raw) / "Current"
            current.mkdir()
            block = b"x" * (MAX_BATCH_RAW_BYTES // 2 + 1)
            _, client = prepare(current, [("a.bin", block), ("b.bin", block)])
            sync_current(current, client)
            uploads = [payload for action, payload in client.calls if action == "uploadBatch"]
            self.assertEqual([len(item["files"]) for item in uploads], [1, 1])

    def test_lost_response_is_confirmed_without_second_upload(self):
        with tempfile.TemporaryDirectory() as raw:
            current = Path(raw) / "Current"
            current.mkdir()
            _, client = prepare(current, [("a", b"x"), ("b", b"y")])
            client.lose_upload_response = True
            result = sync_current(current, client)
            self.assertEqual(len([1 for action, _ in client.calls if action == "uploadBatch"]), 1)
            self.assertEqual(result["resumed_files"], 2)
            self.assertEqual(result["status"], "complete")

    def test_existing_server_receipts_are_resumed(self):
        with tempfile.TemporaryDirectory() as raw:
            current = Path(raw) / "Current"
            current.mkdir()
            local, client = prepare(current, [("a", b"x")])
            sha = local["sources"][0]["files"][0]["sha256"]
            client.received_uploads["Pyto/a"] = sha
            result = sync_current(current, client)
            self.assertFalse(any(action == "uploadBatch" for action, _ in client.calls))
            self.assertEqual(result["resumed_files"], 1)

    def test_deletes_follow_uploads(self):
        with tempfile.TemporaryDirectory() as raw:
            current = Path(raw) / "Current"
            current.mkdir()
            old = manifest([{"path": "old", "sha256": "z"}], "old")
            _, client = prepare(current, [("new", b"x")], old)
            sync_current(current, client)
            actions = [action for action, _ in client.calls]
            self.assertLess(actions.index("uploadBatch"), actions.index("deleteBatch"))
            self.assertLess(actions.index("deleteBatch"), actions.index("finalizeSync"))

    def test_failed_upload_never_deletes_or_finalizes_and_persists_state(self):
        with tempfile.TemporaryDirectory() as raw:
            current = Path(raw) / "Current"
            current.mkdir()
            _, client = prepare(current, [("a", b"x")], manifest([{"path": "old", "sha256": "z"}], "old"))
            client.fail_action = "uploadBatch"
            with self.assertRaises(DriveSyncError):
                sync_current(current, client)
            actions = [action for action, _ in client.calls]
            self.assertNotIn("deleteBatch", actions)
            self.assertNotIn("finalizeSync", actions)
            state = json.loads((current.parent / STATE_DIRECTORY / STATE_FILE).read_text(encoding="utf-8"))
            self.assertEqual(state["status"], "interrupted")
            self.assertEqual(drive_state_path(current), current.parent / STATE_DIRECTORY / STATE_FILE)
            self.assertTrue(has_pending_drive_sync(current))

    def test_manifest_mismatch_fails_after_finalize(self):
        class MismatchClient(FakeClient):
            def call(self, action, **payload):
                result = super().call(action, **payload)
                if action == "finalizeSync":
                    self.verified = json.loads(json.dumps(payload["manifest"]))
                    self.verified["sources"][0]["files"][0]["sha256"] = "incorrect"
                return result

        with tempfile.TemporaryDirectory() as raw:
            current = Path(raw) / "Current"
            current.mkdir()
            local, _ = prepare(current, [("a", b"x")])
            client = MismatchClient()
            with self.assertRaisesRegex(DriveSyncError, "ne correspond pas"):
                sync_current(current, client)
            self.assertEqual(client.verified["runId"], local["runId"])


if __name__ == "__main__":
    unittest.main()
