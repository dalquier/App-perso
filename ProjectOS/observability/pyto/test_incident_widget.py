from __future__ import annotations

import unittest

import incident_widget


SUMMARY = {
    "generated_at": "2026-08-07T12:00:00Z",
    "totals": {
        "unique_incidents": 7,
        "occurrences": 10,
        "active_incidents": 3,
        "recurrent_incidents": 2,
        "occurrences_last_7d": 4,
    },
    "by_severity": {"S1": 0, "S2": 1, "S3": 2, "S4": 4},
    "by_type": {"ENVIRONMENT": 3, "AUTH_ACCESS": 2},
    "by_projectos_coverage": {"NONE": 1, "PARTIAL": 2, "FULL": 4},
}


class IncidentWidgetTests(unittest.TestCase):
    def test_medium_rows_are_compact_and_structured(self) -> None:
        rows = incident_widget.build_rows(SUMMARY, "medium")
        self.assertEqual(rows[0], "3 actifs · 7 incidents")
        self.assertIn("S2 1", rows[1])
        self.assertIn("+4 sur 7 j", rows[2])
        self.assertIn("ENVIRONMENT", rows[3])

    def test_severity_state_prefers_highest_active_level(self) -> None:
        self.assertEqual(incident_widget.state_for(SUMMARY), "major")
        critical = {**SUMMARY, "by_severity": {"S1": 1, "S2": 0, "S3": 0, "S4": 0}}
        self.assertEqual(incident_widget.state_for(critical), "critical")

    def test_invalid_size_is_rejected(self) -> None:
        with self.assertRaises(ValueError):
            incident_widget.build_rows(SUMMARY, "huge")


if __name__ == "__main__":
    unittest.main()
