from __future__ import annotations

import unittest
from datetime import datetime, timezone

import incident_aggregator as aggregator
import incident_analyzer as analyzer


def occurrence(
    incident_id: str,
    severity: str,
    status: str,
    occurred_at: str,
    *,
    signature: str = "ENVIRONMENT.TEST",
    project: str = "transverse",
    coverage: str = "PARTIAL",
) -> dict[str, str]:
    return {
        "incident_id": incident_id,
        "signature": signature,
        "severity": severity,
        "status": status,
        "project": project,
        "tool": "Codex",
        "stage": "test",
        "occurred_at": occurred_at,
        "projectos_coverage": coverage,
        "root_cause": "fixture",
        "workaround": "fallback",
        "candidate_projectos_change": "NONE",
        "source": "fixture",
    }


class IncidentAggregatorTests(unittest.TestCase):
    def test_parse_occurrence_ignores_non_incident_and_parses_colons(self) -> None:
        self.assertIsNone(aggregator.parse_occurrence("hello"))
        body = "\n".join(
            [
                "INCIDENT OCCURRENCE",
                "incident_id: INC-X",
                "signature: AUTH_ACCESS.TEST",
                "severity: S3",
                "status: MITIGATED",
                "project: transverse",
                "tool: Codex",
                "stage: publish",
                "occurred_at: 2026-08-07T10:00:00Z",
                "symptom: HTTP: 403",
            ]
        )
        parsed = aggregator.parse_occurrence(body)
        self.assertIsNotNone(parsed)
        self.assertEqual(parsed["symptom"], "HTTP: 403")

    def test_aggregate_deduplicates_and_keeps_current_and_worst_severity(self) -> None:
        rows = [
            occurrence("INC-X", "S2", "OPEN", "2026-08-06T10:00:00Z"),
            occurrence("INC-X", "S3", "MITIGATED", "2026-08-07T10:00:00Z"),
            occurrence("INC-Y", "S4", "RESOLVED", "2026-08-07T11:00:00Z", signature="TOOL_CAPABILITY.TEST"),
        ]
        summary = aggregator.aggregate(rows, now=datetime(2026, 8, 7, 12, tzinfo=timezone.utc))
        self.assertEqual(summary["totals"]["unique_incidents"], 2)
        self.assertEqual(summary["totals"]["occurrences"], 3)
        self.assertEqual(summary["totals"]["recurrent_incidents"], 1)
        incident = next(row for row in summary["incidents"] if row["incident_id"] == "INC-X")
        self.assertEqual(incident["current_severity"], "S3")
        self.assertEqual(incident["worst_severity"], "S2")
        self.assertEqual(incident["status"], "MITIGATED")
        self.assertEqual(incident["occurrence_count"], 2)


class IncidentAnalyzerTests(unittest.TestCase):
    def test_filter_occurrences_by_date_project_and_severity(self) -> None:
        now = datetime(2026, 8, 7, 12, tzinfo=timezone.utc)
        rows = [
            occurrence("INC-A", "S2", "OPEN", "2026-08-07T10:00:00Z", project="developeros"),
            occurrence("INC-B", "S3", "OPEN", "2026-07-01T10:00:00Z", project="developeros"),
            occurrence("INC-C", "S2", "OPEN", "2026-08-07T10:00:00Z", project="equilibre"),
        ]
        filtered = analyzer.filter_occurrences(
            rows,
            last_days=30,
            project="developeros",
            severities={"S2"},
            now=now,
        )
        self.assertEqual([row["incident_id"] for row in filtered], ["INC-A"])

    def test_generated_prompt_is_analytical_and_contains_evidence(self) -> None:
        rows = [occurrence("INC-A", "S2", "OPEN", "2026-08-07T10:00:00Z", coverage="NONE")]
        summary = aggregator.aggregate(rows, now=datetime(2026, 8, 7, 12, tzinfo=timezone.utc))
        prompt = analyzer.build_analysis_prompt(summary, "30 derniers jours", "chatgpt")
        self.assertIn("Ne modifie aucun fichier", prompt)
        self.assertIn("P0", prompt)
        self.assertIn("INC-A", prompt)
        self.assertIn("NO_ACTION", prompt)


if __name__ == "__main__":
    unittest.main()
