import unittest

from projectos_backup.ui import progress_copy, progress_percent, progress_ratio, should_emit_progress


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

    def test_progress_copy_for_indeterminate_phase(self):
        title, counter, _, ratio = progress_copy({"phase": "drive_prepare"})
        self.assertEqual(title, "Connexion à Google Drive")
        self.assertEqual(counter, "Préparation en cours")
        self.assertEqual(ratio, 0.0)

    def test_throttle_keeps_phase_percent_and_completion(self):
        previous = {"phase": "upload", "percent": 10, "time": 10.0}
        self.assertFalse(should_emit_progress(previous, {"phase": "upload", "completed": 10, "total": 100}, 10.05))
        self.assertTrue(should_emit_progress(previous, {"phase": "upload", "completed": 11, "total": 100}, 10.05))
        self.assertTrue(should_emit_progress(previous, {"phase": "delete", "completed": 0, "total": 5}, 10.05))
        self.assertTrue(should_emit_progress(previous, {"phase": "upload", "completed": 100, "total": 100}, 10.05))
        self.assertTrue(should_emit_progress(previous, {"phase": "upload", "completed": 10, "total": 100}, 10.13))


if __name__ == "__main__":
    unittest.main()
