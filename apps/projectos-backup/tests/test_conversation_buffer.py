from datetime import datetime, timedelta, timezone
import json
from pathlib import Path
import tempfile
import unittest

from helpers import ROOT  # noqa: F401
from projectos_backup.conversation_buffer import (
    BUFFER_MANIFEST,
    ConversationBufferError,
    capture_package,
    claim_pending,
    cleanup_verified,
    import_inbox,
    initialize_buffer,
    load_buffer_manifest,
    mark_verified,
    queue_summary,
    verify_package,
)


class ConversationBufferTests(unittest.TestCase):
    def package(self, root: Path, name="COD-001") -> Path:
        package = root / name
        package.mkdir(parents=True)
        (package / "conversation.jsonl").write_text('{"role":"user","content":"Bonjour"}\n', encoding="utf-8")
        (package / "attachments").mkdir()
        (package / "attachments" / "note.txt").write_text("pièce jointe", encoding="utf-8")
        return package

    def test_capture_is_atomic_and_verifiable(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            source = self.package(root / "source")
            buffer = initialize_buffer(root / "buffer")
            manifest = capture_package(source, buffer)
            pending = buffer / "Pending" / "COD-001"
            self.assertTrue(pending.is_dir())
            self.assertFalse((buffer / "Pending" / ".COD-001.part").exists())
            self.assertEqual(manifest["fileCount"], 2)
            self.assertEqual(verify_package(pending)["archiveId"], "COD-001")

    def test_missing_transcript_is_quarantined_from_inbox(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = initialize_buffer(Path(tmp) / "buffer")
            package = root / "Inbox" / "COD-BROKEN"
            package.mkdir(); (package / "attachment.txt").write_text("x")
            self.assertEqual(import_inbox(root), [])
            quarantined = root / "Quarantine" / "COD-BROKEN"
            self.assertTrue((quarantined / "IMPORT_ERROR.json").is_file())

    def test_claim_and_mark_verified_preserve_proof(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp); source = self.package(root / "source")
            buffer = initialize_buffer(root / "buffer")
            capture_package(source, buffer)
            uploading = claim_pending(buffer, "COD-001")
            verified = mark_verified(uploading, buffer, {
                "folder": "ConversationArchives/COD-001", "manifestSha256": "a" * 64,
            })
            manifest = load_buffer_manifest(verified)
            self.assertTrue(manifest["remoteVerified"])
            self.assertEqual(queue_summary(buffer)["Verified"], 1)

    def test_tampering_is_detected_and_never_verified(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp); source = self.package(root / "source")
            buffer = initialize_buffer(root / "buffer")
            capture_package(source, buffer)
            pending = buffer / "Pending" / "COD-001"
            (pending / "conversation.jsonl").write_text("altéré")
            with self.assertRaises(ConversationBufferError):
                verify_package(pending)

    def test_manifest_tampering_is_detected(self):
        with tempfile.TemporaryDirectory() as raw:
            base = Path(raw)
            root = initialize_buffer(base / "buffer")
            source = self.package(base / "source", "codex-manifest")
            capture_package(source, root, archive_id="codex-manifest")
            pending = root / "Pending" / "codex-manifest"
            manifest_path = pending / BUFFER_MANIFEST
            manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
            manifest["totalBytes"] += 1
            manifest_path.write_text(json.dumps(manifest), encoding="utf-8")
            with self.assertRaisesRegex(ConversationBufferError, "manifeste"):
                verify_package(pending)

    def test_cleanup_only_removes_old_remotely_verified_archives(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp); source = self.package(root / "source")
            buffer = initialize_buffer(root / "buffer")
            capture_package(source, buffer)
            verified = mark_verified(claim_pending(buffer, "COD-001"), buffer, {"manifestSha256": "b" * 64})
            manifest = load_buffer_manifest(verified)
            now = datetime.now(timezone.utc)
            manifest["verifiedAt"] = (now - timedelta(days=31)).isoformat().replace("+00:00", "Z")
            (verified / BUFFER_MANIFEST).write_text(json.dumps(manifest), encoding="utf-8")
            self.assertEqual(cleanup_verified(buffer, now=now), ["COD-001"])

    def test_unverified_archive_is_never_aged_out(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp); source = self.package(root / "source")
            buffer = initialize_buffer(root / "buffer")
            capture_package(source, buffer)
            self.assertEqual(cleanup_verified(buffer, now=datetime.now(timezone.utc) + timedelta(days=365)), [])
            self.assertTrue((buffer / "Pending" / "COD-001").exists())


if __name__ == "__main__":
    unittest.main()
