import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace

from projectos_backup.ui import (
    backup_summary,
    error_copy,
    load_result,
    progress_copy,
    progress_percent,
    progress_ratio,
    progress_stages,
    save_result,
    should_emit_progress,
    summary_copy,
)


class ProgressTests(unittest.TestCase):
    def test_ratio_is_clamped(self):
        self.assertEqual(progress_ratio(-1, 10), 0.0)
        self.assertEqual(progress_ratio(5, 10), 0.5)
        self.assertEqual(progress_ratio(11, 10), 1.0)
        self.assertEqual(progress_ratio(1, 0), 0.0)

    def test_percent(self):
        self.assertEqual(progress_percent(5, 8), 62)

    def test_progress_copy_for_determinate_phase(self):
        title, counter, filename, ratio = progress_copy(
            {"phase": "upload", "completed": 2, "total": 4, "path": "/tmp/example.py"}
        )
        self.assertEqual(title, "Envoi vers Google Drive")
        self.assertEqual(counter, "50 %   ·   2 / 4")
        self.assertEqual(filename, "example.py")
        self.assertEqual(ratio, 0.5)

    def test_upload_preparation_has_real_progress(self):
        title, counter, filename, ratio = progress_copy({
            "phase": "upload_prepare", "completed": 3, "total": 10, "path": "Pyto/example.py",
        })
        self.assertEqual(title, "Préparation des envois")
        self.assertEqual(counter, "30 %   ·   3 / 10")
        self.assertEqual(filename, "example.py")
        self.assertEqual(ratio, 0.3)

    def test_progress_copy_for_indeterminate_phase(self):
        title, counter, _, ratio = progress_copy({"phase": "drive_prepare"})
        self.assertEqual(title, "Connexion à Google Drive")
        self.assertEqual(counter, "Préparation en cours")
        self.assertEqual(ratio, 0.0)

    def test_preflight_progress_is_graphical_and_shows_attempt(self):
        title, counter, filename, ratio = progress_copy({
            "phase": "drive_retry", "attempt": 2, "maxAttempts": 3,
            "message": "Le service se réveille",
        })
        self.assertEqual(title, "Nouvelle tentative de connexion")
        self.assertEqual(counter, "Tentative 2 / 3")
        self.assertEqual(filename, "Le service se réveille")
        self.assertEqual(ratio, 0.0)

    def test_throttle_keeps_phase_percent_and_completion(self):
        previous = {"phase": "upload", "percent": 10, "time": 10.0}
        self.assertFalse(should_emit_progress(previous, {"phase": "upload", "completed": 10, "total": 100}, 10.05))
        self.assertTrue(should_emit_progress(previous, {"phase": "upload", "completed": 11, "total": 100}, 10.05))
        self.assertTrue(should_emit_progress(previous, {"phase": "delete", "completed": 0, "total": 5}, 10.05))
        self.assertTrue(should_emit_progress(previous, {"phase": "upload", "completed": 100, "total": 100}, 10.05))
        self.assertTrue(should_emit_progress(previous, {"phase": "upload", "completed": 10, "total": 100}, 10.13))

    def test_progress_stages_distinguish_local_and_drive(self):
        self.assertEqual(progress_stages({"phase": "mirror"}), ("En cours", "En attente"))
        self.assertEqual(progress_stages({"phase": "upload"}), ("Terminé", "En cours"))
        self.assertEqual(progress_stages({"phase": "drive_wake"}), ("En attente", "Connexion"))
        self.assertEqual(progress_stages({"phase": "drive_wake", "localComplete": True}), ("Terminé", "Connexion"))

    def test_summary_is_serialisable_and_readable(self):
        local = SimpleNamespace(copied_files=3, resumed_files=2, deleted_files=1)
        local.unchanged_files = 5
        result = backup_summary(
            local,
            {"uploaded_files": 4, "deleted_files": 1, "verified_files": 9, "resumed_files": 2, "unchanged_files": 5},
            local_seconds=1.25,
            drive_seconds=2.75,
        )
        local_line, drive_line = summary_copy(result)
        self.assertEqual(result["status"], "complete")
        self.assertEqual(result["drive"]["resumed"], 2)
        self.assertEqual(result["local"]["unchanged"], 5)
        self.assertEqual(result["drive"]["durationSeconds"], 2.8)
        self.assertIn("3 copiés", local_line)
        self.assertIn("9 vérifiés", drive_line)

    def test_result_round_trip_and_invalid_file(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "last.json"
            save_result(path, {"status": "complete", "local": {"copied": 1}})
            self.assertEqual(load_result(path)["status"], "complete")
            path.write_text("not-json", encoding="utf-8")
            self.assertIsNone(load_result(path))

    def test_error_copy_does_not_truncate_detail(self):
        try:
            raise RuntimeError("Google Drive a dépassé le délai de réponse")
        except RuntimeError as exc:
            headline, detail = error_copy(exc)
        self.assertEqual(headline, "Google Drive a dépassé le délai de réponse")
        self.assertIn("RuntimeError", detail)
        self.assertIn("dépassé le délai", detail)


if __name__ == "__main__":
    unittest.main()
