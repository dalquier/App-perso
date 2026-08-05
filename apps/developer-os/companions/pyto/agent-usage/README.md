# DeveloperOS Agent Usage — Core Pyto local

BUILD-01 fournit le cœur Python local du suivi d’usage agentique DeveloperOS. Il cible Pyto/iPhone, reste sans dépendance externe et écrit les données réelles dans un dossier local configurable, jamais dans GitHub.

## Périmètre inclus

- modèles `TaskRecord`, `UsageSnapshot` et `UsageInterval` ;
- validation des identifiants, dates, pourcentages et valeurs contrôlées ;
- stockage JSONL local ;
- journal de tâches Codex et Work ;
- calcul des intervalles d’usage ;
- statistiques et prévision simple d’épuisement ;
- exemples fictifs et tests automatisés.

## Hors périmètre

Le widget iOS final, le Raccourci iOS, l’OCR, une interface graphique complète, l’intégration PWA DeveloperOS et toute connexion automatique au compte ChatGPT restent hors BUILD-01.

## Stockage local

Par défaut, les journaux sont recherchés sous `~/Documents/DeveloperOS/agent-usage`. Pour Pyto/iCloud, définir :

```bash
export DEVELOPEROS_AGENT_USAGE_DIR="/path/to/local/icloud/agent-usage"
```

Fichiers JSONL locaux :

- `tasks.jsonl` ;
- `usage_snapshots.jsonl` ;
- `usage_intervals.jsonl`.

Ne pas committer ces fichiers lorsqu’ils contiennent des données réelles.

## Exécution

```bash
python apps/developer-os/companions/pyto/agent-usage/main.py
```

## Tests

```bash
python -m unittest discover apps/developer-os/companions/pyto/agent-usage/tests
```

## BUILD-01 blocking-review completion notes

### Architecture and serialization

The companion remains a local-only Pyto/Python module made of:

- `models.py` for the JSONL contract (`TaskRecord`, `UsageSnapshot`, `UsageInterval`, `UsageForecast`, `WeeklyUsageSummary`).
- `validation.py` for schema, controlled values, timezone-aware datetime, cycle, import and attribution validation.
- `storage.py` for UTF-8 JSONL persistence with tolerant reads, structured skipped-line reports, integrity checks, backups and valid-data export.
- `task_logger.py` for task lifecycle transitions and filters.
- `analytics.py` for interval attribution, current-cycle forecasting and weekly summaries.
- `main.py` for local CLI commands.

Records are serialized as one sorted-key JSON object per line. ISO datetimes must include a timezone offset; naïve ISO dates are rejected. Pyto operators should use `Europe/Paris` wall time, provided through the Python standard-library `zoneinfo` module without an external dependency. `null` is intentionally distinct from `0` for optional credit fields.

### Recovery, backups, and integrity

JSONL rewrites use a temporary file in the target directory, file `fsync`, atomic `os.replace`, and directory `fsync`. Before replacement, the previous file is copied to `<name>.jsonl.bak`. Reads tolerate corrupt lines by returning valid records plus a structured skipped-line report; if the primary file is missing, the matching backup is used. `integrity-check` reports skipped lines and duplicate identifiers. `export` writes only parsed valid records and does not include environment variables or secrets.

### Commands

```bash
python apps/developer-os/companions/pyto/agent-usage/main.py init
python apps/developer-os/companions/pyto/agent-usage/main.py doctor
python apps/developer-os/companions/pyto/agent-usage/main.py create-task --tool codex --project developeros --title "Implement BUILD-01"
python apps/developer-os/companions/pyto/agent-usage/main.py start-task --task-id TSK-20260805-001
python apps/developer-os/companions/pyto/agent-usage/main.py close-task TSK-20260805-001 --status completed
python apps/developer-os/companions/pyto/agent-usage/main.py add-snapshot --remaining-percent 80 --captured-at 2026-08-05T12:55:00+02:00 --reset-at 2026-08-12T12:55:00+02:00 --scope chatgpt-agent-weekly-quota --cycle-id agent-weekly-2026-W32 --validated-at 2026-08-05T12:56:00+02:00 --human-validated
python apps/developer-os/companions/pyto/agent-usage/main.py weekly-summary --week-start 2026-08-03T00:00:00+02:00 --tool codex --project developeros
python apps/developer-os/companions/pyto/agent-usage/main.py integrity-check
python apps/developer-os/companions/pyto/agent-usage/main.py export /tmp/agent-usage-export.json
```

All CLI responses are structured JSON. Success exits with `0`; validation, storage and integrity failures exit non-zero.

### Known limits and Pyto recipe still required

This build is the offline core. Remaining Pyto integration work is to wire iOS Shortcut capture/import UI, choose the user iCloud data directory, and add a human validation screen before imported snapshots are accepted. Forecasting is intentionally unavailable when there are fewer than two compatible current-cycle intervals or when a reset/correction/recharge is unresolved.
