import json
from pathlib import Path
import tempfile
import unittest
import zipfile

from helpers import ROOT  # noqa: F401
from projectos_backup.core import BackupError, Source, UnsafeLayoutError, run_backup, sanitize_name, sha256_file


class BackupCoreTests(unittest.TestCase):
    def test_sanitize_name(self):
        self.assertEqual(sanitize_name("Équilibre / projet"), "quilibre-projet")
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


if __name__ == "__main__":
    unittest.main()
