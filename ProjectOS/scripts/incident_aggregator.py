#!/usr/bin/env python3
"""ProjectOS Incident Ledger aggregator.

Reads structured INCIDENT OCCURRENCE comments from GitHub issue #87 and emits
one deterministic JSON summary. The module uses only the Python standard
library so it can run in GitHub Actions, Replit, desktop Python and Pyto.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable

DEFAULT_REPOSITORY = "dalquier/App-perso"
DEFAULT_ISSUE = 87
SEVERITY_ORDER = {"S1": 1, "S2": 2, "S3": 3, "S4": 4}
OPEN_STATUSES = {"OPEN", "MITIGATED"}
KNOWN_STATUSES = {"OPEN", "MITIGATED", "RESOLVED", "ACCEPTED_LIMITATION"}
KNOWN_COVERAGE = {"NONE", "PARTIAL", "FULL"}


def _parse_iso(value: str) -> datetime:
    value = value.strip()
    if value.endswith("Z"):
        value = value[:-1] + "+00:00"
    try:
        parsed = datetime.fromisoformat(value)
    except ValueError:
        return datetime.min.replace(tzinfo=timezone.utc)
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def parse_occurrence(body: str) -> dict[str, str] | None:
    """Parse one canonical Ledger comment.

    Unknown keys are preserved. Malformed/non-incident comments are ignored.
    """
    if not body or not body.lstrip().startswith("INCIDENT OCCURRENCE"):
        return None

    record: dict[str, str] = {}
    for raw_line in body.splitlines()[1:]:
        line = raw_line.strip()
        if not line or ":" not in line:
            continue
        key, value = line.split(":", 1)
        key = key.strip().lower()
        value = value.strip()
        if key:
            record[key] = value

    required = {
        "incident_id",
        "signature",
        "severity",
        "status",
        "project",
        "tool",
        "stage",
        "occurred_at",
    }
    if not required.issubset(record):
        return None
    if record["severity"] not in SEVERITY_ORDER:
        return None
    if record["status"] not in KNOWN_STATUSES:
        return None
    coverage = record.get("projectos_coverage", "NONE")
    if coverage not in KNOWN_COVERAGE:
        record["projectos_coverage"] = "NONE"
    return record


def parse_comment_objects(comments: Iterable[dict[str, Any]]) -> list[dict[str, str]]:
    occurrences: list[dict[str, str]] = []
    for comment in comments:
        parsed = parse_occurrence(str(comment.get("body") or ""))
        if parsed is not None:
            occurrences.append(parsed)
    return occurrences


def fetch_issue_comments(
    repository: str = DEFAULT_REPOSITORY,
    issue: int = DEFAULT_ISSUE,
    token: str | None = None,
) -> list[dict[str, Any]]:
    """Fetch all issue comments through GitHub REST pagination."""
    owner, repo = repository.split("/", 1)
    comments: list[dict[str, Any]] = []
    page = 1
    while True:
        query = urllib.parse.urlencode({"per_page": 100, "page": page})
        url = f"https://api.github.com/repos/{owner}/{repo}/issues/{issue}/comments?{query}"
        request = urllib.request.Request(
            url,
            headers={
                "Accept": "application/vnd.github+json",
                "User-Agent": "ProjectOS-Incident-Aggregator/1.0",
                "X-GitHub-Api-Version": "2022-11-28",
            },
        )
        if token:
            request.add_header("Authorization", f"Bearer {token}")
        try:
            with urllib.request.urlopen(request, timeout=20) as response:
                batch = json.load(response)
        except urllib.error.HTTPError as exc:
            raise RuntimeError(f"GitHub HTTP {exc.code} while reading Incident Ledger") from exc
        except urllib.error.URLError as exc:
            raise RuntimeError(f"GitHub Incident Ledger unreachable: {exc.reason}") from exc
        if not isinstance(batch, list):
            raise RuntimeError("Unexpected GitHub response while reading Incident Ledger")
        comments.extend(batch)
        if len(batch) < 100:
            break
        page += 1
    return comments


def _latest(records: list[dict[str, str]]) -> dict[str, str]:
    return max(records, key=lambda item: _parse_iso(item.get("occurred_at", "")))


def aggregate(occurrences: Iterable[dict[str, str]], now: datetime | None = None) -> dict[str, Any]:
    """Aggregate occurrences into incident-centric counters."""
    occurrence_list = list(occurrences)
    groups: dict[str, list[dict[str, str]]] = defaultdict(list)
    for occurrence in occurrence_list:
        key = occurrence.get("incident_id") or occurrence.get("signature") or "UNKNOWN"
        groups[key].append(occurrence)

    incident_rows: list[dict[str, Any]] = []
    for incident_id, records in groups.items():
        ordered = sorted(records, key=lambda item: _parse_iso(item.get("occurred_at", "")))
        current = ordered[-1]
        worst = min(records, key=lambda item: SEVERITY_ORDER.get(item.get("severity", "S4"), 4))
        incident_rows.append(
            {
                "incident_id": incident_id,
                "signature": current.get("signature", "UNKNOWN.UNKNOWN"),
                "type": current.get("signature", "UNKNOWN.UNKNOWN").split(".", 1)[0],
                "current_severity": current.get("severity", "S4"),
                "worst_severity": worst.get("severity", "S4"),
                "status": current.get("status", "OPEN"),
                "project": current.get("project", "unknown"),
                "tool": current.get("tool", "unknown"),
                "stage": current.get("stage", "unknown"),
                "projectos_coverage": current.get("projectos_coverage", "NONE"),
                "occurrence_count": len(records),
                "first_occurrence": ordered[0].get("occurred_at"),
                "last_occurrence": current.get("occurred_at"),
                "candidate_projectos_change": current.get("candidate_projectos_change", "NONE"),
                "root_cause": current.get("root_cause", "UNKNOWN"),
                "workaround": current.get("workaround", "NONE"),
                "source": current.get("source", ""),
            }
        )

    incident_rows.sort(
        key=lambda item: (
            SEVERITY_ORDER.get(item["current_severity"], 9),
            -_parse_iso(item.get("last_occurrence") or "").timestamp()
            if _parse_iso(item.get("last_occurrence") or "") != datetime.min.replace(tzinfo=timezone.utc)
            else 0,
            item["incident_id"],
        )
    )

    current_severity = Counter(row["current_severity"] for row in incident_rows)
    status = Counter(row["status"] for row in incident_rows)
    type_counts = Counter(row["type"] for row in incident_rows)
    project = Counter(row["project"] for row in incident_rows)
    tool = Counter(row["tool"] for row in incident_rows)
    coverage = Counter(row["projectos_coverage"] for row in incident_rows)

    recurrent = [row for row in incident_rows if row["occurrence_count"] > 1]
    recurrent.sort(key=lambda row: (-row["occurrence_count"], row["incident_id"]))

    now = (now or datetime.now(timezone.utc)).astimezone(timezone.utc)
    recent_7d = 0
    recent_30d = 0
    for occurrence in occurrence_list:
        occurred = _parse_iso(occurrence.get("occurred_at", ""))
        if occurred == datetime.min.replace(tzinfo=timezone.utc):
            continue
        age_days = (now - occurred).total_seconds() / 86400
        if 0 <= age_days <= 7:
            recent_7d += 1
        if 0 <= age_days <= 30:
            recent_30d += 1

    return {
        "schema_version": "1.0",
        "generated_at": now.isoformat().replace("+00:00", "Z"),
        "ledger": {
            "repository": DEFAULT_REPOSITORY,
            "issue": DEFAULT_ISSUE,
        },
        "totals": {
            "unique_incidents": len(incident_rows),
            "occurrences": len(occurrence_list),
            "active_incidents": sum(1 for row in incident_rows if row["status"] in OPEN_STATUSES),
            "recurrent_incidents": len(recurrent),
            "occurrences_last_7d": recent_7d,
            "occurrences_last_30d": recent_30d,
        },
        "by_severity": {severity: current_severity.get(severity, 0) for severity in SEVERITY_ORDER},
        "by_status": {name: status.get(name, 0) for name in sorted(KNOWN_STATUSES)},
        "by_type": dict(type_counts.most_common()),
        "by_project": dict(project.most_common()),
        "by_tool": dict(tool.most_common()),
        "by_projectos_coverage": {name: coverage.get(name, 0) for name in ("NONE", "PARTIAL", "FULL")},
        "recurrent": recurrent,
        "incidents": incident_rows,
    }


def load_comments_file(path: Path) -> list[dict[str, Any]]:
    payload = json.loads(path.read_text(encoding="utf-8"))
    if isinstance(payload, dict) and isinstance(payload.get("comments"), list):
        return payload["comments"]
    if isinstance(payload, list):
        return payload
    raise ValueError("Input JSON must be a list of comments or an object with a comments array")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Aggregate ProjectOS Incident Ledger #87")
    parser.add_argument("--repository", default=DEFAULT_REPOSITORY)
    parser.add_argument("--issue", type=int, default=DEFAULT_ISSUE)
    parser.add_argument("--input", type=Path, help="Offline GitHub comments JSON fixture")
    parser.add_argument("--output", type=Path, help="Write summary JSON to this file")
    parser.add_argument("--compact", action="store_true", help="Disable pretty JSON output")
    args = parser.parse_args(argv)

    try:
        if args.input:
            comments = load_comments_file(args.input)
        else:
            comments = fetch_issue_comments(
                repository=args.repository,
                issue=args.issue,
                token=os.getenv("GITHUB_TOKEN"),
            )
        occurrences = parse_comment_objects(comments)
        summary = aggregate(occurrences)
    except (OSError, ValueError, RuntimeError) as exc:
        print(f"incident_aggregator: {exc}", file=sys.stderr)
        return 2

    text = json.dumps(summary, ensure_ascii=False, indent=None if args.compact else 2, sort_keys=False) + "\n"
    if args.output:
        args.output.write_text(text, encoding="utf-8")
    else:
        sys.stdout.write(text)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
