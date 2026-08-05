import unittest
from datetime import datetime
from helpers import ROOT  # noqa: F401
from identifiers import next_identifier, validate_identifier

class IdentifierTests(unittest.TestCase):
    def test_next_identifier_increments_by_day(self):
        self.assertEqual(next_identifier("task", ["TSK-20260805-001"], datetime(2026, 8, 5)), "TSK-20260805-002")
    def test_validate_kind(self):
        self.assertTrue(validate_identifier("SNP-20260805-001", "snapshot"))
        self.assertFalse(validate_identifier("SNP-20260805-001", "task"))
if __name__ == "__main__": unittest.main()
