import unittest

from projectos_backup.ui import progress_bar


class ProgressBarTests(unittest.TestCase):
    def test_empty_and_complete(self):
        self.assertEqual(progress_bar(0, 10, 4), "░░░░")
        self.assertEqual(progress_bar(10, 10, 4), "████")

    def test_clamps_out_of_range_values(self):
        self.assertEqual(progress_bar(-1, 10, 4), "░░░░")
        self.assertEqual(progress_bar(11, 10, 4), "████")

    def test_zero_total_is_empty(self):
        self.assertEqual(progress_bar(1, 0, 4), "░░░░")


if __name__ == "__main__":
    unittest.main()
