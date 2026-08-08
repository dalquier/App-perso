#!/usr/bin/env python3
"""Generate a factual ProjectOS incident review and an analysis prompt."""
from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Iterable

import incident_aggregator as aggregator


def _parse_csv(value: str | None) -> set[str] | None:
    if not value:
        return None
    values = {item.strip() for item in value.split(",") if item.strip()}
    return values or None


def _date(value: str) -> datetime:
    parsed = aggregator._parse_iso(value)  # canonical parser shared with Phase 3
    return parsed


def filter_occurrences(
    occurrences: Iterable[dict[str, str]],
    *,
    last_days: int | None = None,
    project: str | None = None,
    severities: set[str] | None = None,
    statuses: set[str] | None = None,
    now: datetime | None = None,
) -> list[dict[str, str]]:
    now = (now or datetime.now(timezone.utc)).astimezone(timezone.utc)
    cutoff = now - timedelta(days=last_days) if last_days is not None else None
    result: list[dict[str, str]] = []
    for occurrence in occurrences:
        occurred = _date(occurrence.get("occurred_at", ""))
        if cutoff is not None and occurred < cutoff:
            continue
        if project and occurrence.get("project") != project:
            continue
        if severities and occurrence.get("severity") not in severities:
            continue
        if statuses and occurrence.get("status") not in statuses:
            continue
        result.append(occurrence)
    return result


def _rank_candidates(summary: dict) -> list[dict]:
    rows = []
    for incident in summary.get("incidents", []):
        candidate = str(incident.get("candidate_projectos_change", "NONE"))
        coverage = incident.get("projectos_coverage", "NONE")
        recurring = int(incident.get("occurrence_count", 0)) > 1
        if candidate != "NONE" or coverage in {"NONE", "PARTIAL"} or recurring:
            rows.append(incident)
    severity_rank = aggregator.SEVERITY_ORDER
    rows.sort(
        key=lambda row: (
            severity_rank.get(row.get("current_severity", "S4"), 9),
            0 if row.get("projectos_coverage") == "NONE" else 1 if row.get("projectos_coverage") == "PARTIAL" else 2,
            -int(row.get("occurrence_count", 0)),
            row.get("incident_id", ""),
        )
    )
    return rows


def build_synthesis(summary: dict, scope_text: str) -> str:
    totals = summary.get("totals", {})
    severity = summary.get("by_severity", {})
    coverage = summary.get("by_projectos_coverage", {})
    top_types = list(summary.get("by_type", {}).items())[:5]
    lines = [
        "PROJECTOS — SYNTHÈSE D’INCIDENTS",
        f"Périmètre : {scope_text}",
        f"Incidents uniques : {totals.get('unique_incidents', 0)}",
        f"Occurrences : {totals.get('occurrences', 0)}",
        f"Incidents actifs : {totals.get('active_incidents', 0)}",
        f"Incidents récurrents : {totals.get('recurrent_incidents', 0)}",
        f"Gravité : S1={severity.get('S1', 0)} · S2={severity.get('S2', 0)} · S3={severity.get('S3', 0)} · S4={severity.get('S4', 0)}",
        f"Couverture ProjectOS : NONE={coverage.get('NONE', 0)} · PARTIAL={coverage.get('PARTIAL', 0)} · FULL={coverage.get('FULL', 0)}",
    ]
    if top_types:
        lines.append("Types principaux : " + ", ".join(f"{name}={count}" for name, count in top_types))
    candidates = _rank_candidates(summary)
    if candidates:
        lines.append("Candidats à examiner :")
        for row in candidates[:12]:
            lines.append(
                f"- {row['incident_id']} | {row['current_severity']} | {row['status']} | "
                f"{row['signature']} | occurrences={row['occurrence_count']} | "
                f"coverage={row['projectos_coverage']} | candidate={row['candidate_projectos_change']}"
            )
    return "\n".join(lines)


def _incident_evidence(summary: dict) -> str:
    chunks: list[str] = []
    for row in summary.get("incidents", []):
        chunks.append(
            "\n".join(
                [
                    f"INCIDENT {row['incident_id']}",
                    f"signature: {row['signature']}",
                    f"severity: {row['current_severity']} (worst: {row['worst_severity']})",
                    f"status: {row['status']}",
                    f"project: {row['project']}",
                    f"tool/stage: {row['tool']} / {row['stage']}",
                    f"occurrences: {row['occurrence_count']}",
                    f"coverage: {row['projectos_coverage']}",
                    f"root_cause: {row['root_cause']}",
                    f"workaround: {row['workaround']}",
                    f"candidate_projectos_change: {row['candidate_projectos_change']}",
                    f"source: {row['source']}",
                ]
            )
        )
    return "\n\n".join(chunks)


def build_analysis_prompt(summary: dict, scope_text: str, target: str) -> str:
    synthesis = build_synthesis(summary, scope_text)
    evidence = _incident_evidence(summary)
    target_hint = {
        "chatgpt": "Tu es le reviewer/architecte ProjectOS. Reste exclusivement analytique.",
        "codex": "Tu es Codex en mission d’audit ProjectOS. N’effectue aucune modification dans cette mission.",
        "both": "Tu réalises une revue analytique ProjectOS indépendante de l’outil d’exécution.",
    }[target]
    return f"""RPOS = Recharge ProjectOS depuis `dalquier/App-perso`, branche `main`.

MEMORY = OFF — Ne mémorise ni n’archive cette conversation. Ne pose pas la question « Enregistrer la conversation ? ». Après l’amorçage ProjectOS, commence directement la mission demandée.

Charge `ProjectOS/BOOTSTRAP.md` et toutes ses références obligatoires, notamment `standards/INCIDENT_LEARNING.md`, `standards/CODEX_GITHUB_RELIABILITY.md` et `observability/AGGREGATOR_CONTRACT.md`.

{target_hint}

MISSION
Analyser les incidents ProjectOS ci-dessous afin de proposer des actions correctives proportionnées et, uniquement si les preuves le justifient, des évolutions de ProjectOS.

RÈGLES
- Ne modifie aucun fichier, aucune branche et aucune PR.
- Distingue limitation externe, défaut d’environnement, défaut d’outil, défaut de processus ProjectOS et défaut applicatif.
- Ne propose pas de règle supplémentaire pour une limitation déjà couverte efficacement (`FULL`) sauf preuve de récidive coûteuse ou de couverture insuffisante.
- Regroupe les symptômes partageant une cause racine ; ne compte pas les conséquences comme incidents distincts.
- Privilégie les mesures simples, automatiques et vérifiables aux instructions textuelles supplémentaires.
- Évalue le risque de sur-ingénierie de chaque proposition.
- Toute proposition de modification ProjectOS doit citer les fichiers/standards probablement concernés et définir un critère d’acceptation observable.

TRAVAIL DEMANDÉ
1. Vérifier la qualité de la classification (type, gravité, statut, couverture).
2. Identifier les causes racines récurrentes et les tendances.
3. Distinguer ce qui est déjà correctement couvert de ce qui reste partiellement ou non couvert.
4. Identifier les pertes de temps évitables, risques de mauvaise livraison ou de mauvaise fusion.
5. Proposer les actions correctives, classées `P0`, `P1`, `P2` ou `NO_ACTION`.
6. Pour chaque action : problème ciblé, bénéfice attendu, coût/complexité, risque, fichiers ProjectOS concernés, test ou preuve d’acceptation.
7. Signaler explicitement les règles ProjectOS qui devraient être simplifiées ou supprimées si elles ajoutent du bruit sans réduire les incidents.
8. Terminer par un plan minimal recommandé et les changements à NE PAS faire.

SYNTHÈSE FACTUELLE
{synthesis}

INCIDENTS DÉDUPLIQUÉS
{evidence or 'Aucun incident dans ce périmètre.'}

VERDICT ATTENDU
Produis une synthèse décisionnelle concise, puis un tableau priorisé des recommandations et un plan de mise en œuvre. Ne développe rien dans cette mission.
"""


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Synthesize ProjectOS incidents and generate an analysis prompt")
    parser.add_argument("--last-days", type=int, default=30)
    parser.add_argument("--project")
    parser.add_argument("--severity", help="Comma-separated S1,S2,S3,S4")
    parser.add_argument("--status", help="Comma-separated incident statuses")
    parser.add_argument("--target", choices=("chatgpt", "codex", "both"), default="chatgpt")
    parser.add_argument("--input", type=Path, help="Offline GitHub comments JSON fixture")
    parser.add_argument("--summary-json", type=Path)
    parser.add_argument("--prompt-output", type=Path)
    args = parser.parse_args(argv)

    if args.last_days < 1:
        parser.error("--last-days must be >= 1")
    severities = _parse_csv(args.severity)
    statuses = _parse_csv(args.status)
    if severities and not severities.issubset(aggregator.SEVERITY_ORDER):
        parser.error("--severity accepts only S1,S2,S3,S4")
    if statuses and not statuses.issubset(aggregator.KNOWN_STATUSES):
        parser.error("--status contains an unknown status")

    try:
        comments = aggregator.load_comments_file(args.input) if args.input else aggregator.fetch_issue_comments(token=None)
        occurrences = aggregator.parse_comment_objects(comments)
        filtered = filter_occurrences(
            occurrences,
            last_days=args.last_days,
            project=args.project,
            severities=severities,
            statuses=statuses,
        )
        summary = aggregator.aggregate(filtered)
    except (OSError, ValueError, RuntimeError) as exc:
        print(f"incident_analyzer: {exc}", file=sys.stderr)
        return 2

    scope = f"{args.last_days} derniers jours"
    if args.project:
        scope += f" · projet={args.project}"
    if severities:
        scope += " · gravité=" + ",".join(sorted(severities))
    if statuses:
        scope += " · statut=" + ",".join(sorted(statuses))

    prompt = build_analysis_prompt(summary, scope, args.target)
    synthesis = build_synthesis(summary, scope)
    if args.summary_json:
        args.summary_json.write_text(json.dumps(summary, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    if args.prompt_output:
        args.prompt_output.write_text(prompt, encoding="utf-8")
    else:
        print(synthesis)
        print("\n--- PROMPT ---\n")
        print(prompt)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
