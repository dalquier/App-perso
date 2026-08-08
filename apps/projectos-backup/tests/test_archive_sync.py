import tempfile
import unittest
from pathlib import Path

from projectos_backup.archive_sync import sync_archive
from projectos_backup.conversation_buffer import capture_package, load_buffer_manifest
from projectos_backup.drive_client import DriveSyncError


class ArchiveClient:
    def __init__(self, lose_upload=False, protocol=3):
        self.calls = []
        self.receipts = {}
        self.finalized = None
        self.lose_upload = lose_upload
        self.lost = False
        self.protocol = protocol

    def public_read(self, timeout=None):
        return {"ok": True, "service": "ProjectOS Backup", "protocol": self.protocol}

    def read(self, action, **payload):
        if action == "health":
            return {"ok": True, "protocol": self.protocol, "rootReady": True}
        if action == "manifest":
            return {"ok": True, "manifest": None}
        if action == "archiveStatus":
            uploads = payload.get("uploads", [])
            return {
                "ok": True,
                "status": "finalized" if self.finalized else ("active" if self.receipts else "absent"),
                "finalized": bool(self.finalized),
                "manifestSha256": self.finalized,
                "receivedUploads": [item["path"] for item in uploads if self.receipts.get(item["path"]) == item["sha256"]],
            }
        raise AssertionError(action)

    def call(self, action, **payload):
        self.calls.append((action, payload))
        if action == "archiveBegin":
            return {"receivedUploads": len(self.receipts)}
        if action == "archiveUploadBatch":
            for item in payload["files"]:
                self.receipts[item["path"]] = item["sha256"]
            if self.lose_upload and not self.lost:
                self.lost = True
                raise DriveSyncError("timeout", code="network", retryable=True)
            return {"resumed": 0}
        if action == "archiveUpload":
            self.receipts[payload["path"]] = payload["sha256"]
            return {"resumed": 0}
        if action == "archiveFinalize":
            self.finalized = payload["manifestSha256"]
            return {"status": "complete", "finalized": True}
        raise AssertionError(action)


def package(raw):
    source = Path(raw) / "source"
    source.mkdir()
    (source / "conversation.jsonl").write_text('{"role":"user","text":"bonjour"}\n', encoding="utf-8")
    attachments = source / "attachments"
    attachments.mkdir()
    (attachments / "capture.png").write_bytes(b"image")
    root = Path(raw) / "buffer"
    capture_package(source, root, archive_id="codex-20260807-test")
    return root, root / "Pending" / "codex-20260807-test"


class ArchiveSyncTests(unittest.TestCase):
    def test_uploads_finalizes_and_marks_verified(self):
        with tempfile.TemporaryDirectory() as raw:
            root, folder = package(raw)
            client = ArchiveClient()
            result = sync_archive(folder, root, client)
            self.assertEqual(result["uploaded"], 2)
            verified = root / "Verified" / "codex-20260807-test"
            self.assertTrue(verified.is_dir())
            self.assertTrue(load_buffer_manifest(verified)["remoteVerified"])
            self.assertEqual([name for name, _ in client.calls], ["archiveBegin", "archiveUploadBatch", "archiveFinalize"])

    def test_lost_response_is_recovered_without_duplicate_upload(self):
        with tempfile.TemporaryDirectory() as raw:
            root, folder = package(raw)
            client = ArchiveClient(lose_upload=True)
            result = sync_archive(folder, root, client)
            self.assertEqual(result["uploaded"], 0)
            self.assertEqual(result["resumed"], 2)
            self.assertEqual([name for name, _ in client.calls].count("archiveUploadBatch"), 1)

    def test_existing_verified_remote_is_not_uploaded_twice(self):
        with tempfile.TemporaryDirectory() as raw:
            root, folder = package(raw)
            manifest = load_buffer_manifest(folder)
            client = ArchiveClient()
            client.finalized = manifest["manifestSha256"]
            result = sync_archive(folder, root, client)
            self.assertEqual(result["uploaded"], 0)
            self.assertEqual(client.calls, [])

    def test_old_apps_script_fails_before_mutation_and_keeps_uploading(self):
        with tempfile.TemporaryDirectory() as raw:
            root, folder = package(raw)
            client = ArchiveClient(protocol=2)
            with self.assertRaisesRegex(DriveSyncError, "redéployé"):
                sync_archive(folder, root, client)
            self.assertTrue((root / "Uploading" / "codex-20260807-test").is_dir())
            self.assertEqual(client.calls, [])

    def test_large_attachment_uses_single_file_action(self):
        with tempfile.TemporaryDirectory() as raw:
            root = Path(raw) / "buffer"
            source = Path(raw) / "large-source"
            source.mkdir()
            (source / "conversation.md").write_text("# test", encoding="utf-8")
            (source / "large.bin").write_bytes(b"x" * (1024 * 1024 + 1))
            capture_package(source, root, archive_id="codex-large")
            client = ArchiveClient()
            sync_archive(root / "Pending" / "codex-large", root, client)
            self.assertIn("archiveUpload", [name for name, _ in client.calls])


if __name__ == "__main__":
    unittest.main()
