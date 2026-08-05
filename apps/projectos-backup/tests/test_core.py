import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
import zipfile

from helpers import ROOT  # noqa: F401
from projectos_backup import core
from projectos_backup.core import BackupError, Source, SourceAccessError, UnsafeLayoutError, run_backup, sanitize_name, sha256_file, verify_source_archive


class BackupCoreTests(unittest.TestCase):
    def test_sanitize_name(self):
        self.assertEqual(sanitize_name("Équilibre / projet"), "Equilibre-projet")
        self.assertEqual(sanitize_name("..."), "source")

    def test_complete_snapshot_is_verified_and_replaces_previous(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            source = root / "source"
            destination = root / "backup"
            source.mkdir()
            (source / "main.py").write_text("print('v1')\n", encoding="utf-8")
            first = run_backup([Source("one", "Mon projet", str(source))], destination)
            self.assertEqual(first.status, "complete")
            current = destination / "Current"
            archive = current / "Mon-projet.zip"
            self.assertTrue(archive.is_file())
            with zipfile.ZipFile(archive) as zipped:
                self.assertIsNone(zipped.testzip())
                self.assertIn("files/main.py", zipped.namelist())
            manifest = json.loads((current / "MANIFEST.json").read_text(encoding="utf-8"))
            self.assertEqual(manifest["fileCount"], 1)
            self.assertEqual(manifest["bundle"]["name"], "ProjectOS-Backup-Current.zip")
            self.assertEqual(len(first.bundle_sha256), 64)

            (source / "main.py").write_text("print('v2')\n", encoding="utf-8")
            second = run_backup([Source("one", "Mon projet", str(source))], destination)
            self.assertNotEqual(first.run_id, second.run_id)
            self.assertFalse(any(destination.glob(".previous-*")))
            self.assertTrue((destination / "ProjectOS-Backup-Current.zip").is_file())
            self.assertEqual(second.bundle_sha256, sha256_file(destination / "ProjectOS-Backup-Current.zip"))
            self.assertEqual(list((destination / "Staging").iterdir()), [])

    def test_failure_does_not_replace_current(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            source = root / "source"
            destination = root / "backup"
            source.mkdir()
            (source / "file.txt").write_text("safe", encoding="utf-8")
            run_backup([Source("one", "Source", str(source))], destination)
            before = sha256_file(destination / "ProjectOS-Backup-Current.zip")
            with self.assertRaises(BackupError):
                run_backup([Source("missing", "Missing", str(root / "absent"))], destination)
            self.assertEqual(before, sha256_file(destination / "ProjectOS-Backup-Current.zip"))

    def test_destination_inside_source_is_rejected(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            source = root / "source"
            source.mkdir()
            with self.assertRaises(UnsafeLayoutError):
                run_backup([Source("one", "Source", str(source))], source / "backup")
            self.assertFalse((source / "backup").exists())

    def test_manifest_hashes_match_archived_bytes(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            source = root / "source"
            source.mkdir()
            (source / "data.bin").write_bytes(b"abc" * 1000)
            result = run_backup([Source("one", "Source", str(source))], root / "backup")
            verify_source_archive(Path(result.current_path) / "Source.zip")

    def test_publish_rolls_back_if_bundle_install_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            destination = root / "backup"
            current = destination / "Current"
            candidate = destination / "Staging" / "run" / "Current"
            bundle = destination / "Staging" / "run" / "ProjectOS-Backup-Current.zip"
            current.mkdir(parents=True)
            candidate.mkdir(parents=True)
            (current / "old").write_text("old", encoding="utf-8")
            (candidate / "new").write_text("new", encoding="utf-8")
            (destination / "ProjectOS-Backup-Current.zip").write_text("old bundle", encoding="utf-8")
            bundle.write_text("new bundle", encoding="utf-8")
            original_replace = core.os.replace

            def fail_on_bundle(source, target):
                if Path(source) == bundle and Path(target) == destination / "ProjectOS-Backup-Current.zip":
                    raise OSError("simulated")
                return original_replace(source, target)

            with patch.object(core.os, "replace", side_effect=fail_on_bundle):
                with self.assertRaises(BackupError):
                    core._publish_candidate(destination, candidate, bundle, "run")
            self.assertEqual((current / "old").read_text(encoding="utf-8"), "old")
            self.assertEqual(
                (destination / "ProjectOS-Backup-Current.zip").read_text(encoding="utf-8"),
                "old bundle",
            )

    def test_walk_error_is_not_silently_ignored(self):
        root = Path("/virtual")

        def broken_walk(*args, **kwargs):
            kwargs["onerror"](OSError(5, "unavailable", str(root)))
            return iter(())

        with patch.object(core.os, "walk", side_effect=broken_walk):
            with self.assertRaises(SourceAccessError):
                list(core.iter_source_files(root))


if __name__ == "__main__":
    unittest.main()
