# DeveloperOS Agent Usage — Core Pyto local

BUILD-01 fournit le cœur Python local du suivi d’usage agentique DeveloperOS. Il cible Pyto/iPhone, reste sans dépendance externe et écrit les données réelles dans un dossier local configurable, jamais dans GitHub.

## Périmètre inclus

- modèles `TaskRecord`, `UsageSnapshot`, `UsageInterval`, `UsageForecast` et `WeeklyUsageSummary` ;
- validation des identifiants, dates, pourcentages, cycles et valeurs contrôlées ;
- stockage JSONL local avec sauvegarde, récupération et export ;
- journal de tâches Codex et Work ;
- calcul des intervalles d’usage ;
- statistiques et prévision prudente d’épuisement ;
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

## Architecture et sérialisation

- `models.py` : contrat JSONL et modèles typés ;
- `validation.py` : validation stricte, dates timezone-aware, cycles et attribution ;
- `storage.py` : persistance UTF-8 JSONL, lecture tolérante, sauvegardes, intégrité et export ;
- `task_logger.py` : transitions du cycle de vie et filtres ;
- `analytics.py` : attribution, prévision sur cycle courant et résumé hebdomadaire ;
- `main.py` : commandes CLI locales.

Les enregistrements utilisent un objet JSON par ligne avec clés triées. Les dates ISO doivent inclure un fuseau. Pyto doit utiliser `Europe/Paris` via `zoneinfo`, sans dépendance externe. `null` reste distinct de `0` pour les crédits optionnels.

## Récupération, sauvegardes et intégrité

Les réécritures JSONL utilisent un fichier temporaire, `fsync`, une sauvegarde `.bak` et `os.replace`. Les lectures tolèrent les lignes corrompues et retournent les données valides accompagnées d’un rapport structuré. Si le fichier principal manque, sa sauvegarde est utilisée. `integrity-check` détecte les lignes ignorées et les identifiants dupliqués. `export` n’écrit que les données valides et n’inclut aucun secret.

## Commandes

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

Toutes les réponses CLI sont en JSON structuré. Le succès retourne `0`; les erreurs de validation, de stockage ou d’intégrité retournent un code non nul.

## Tests

```bash
python -m unittest discover apps/developer-os/companions/pyto/agent-usage/tests
python -m compileall apps/developer-os/companions/pyto/agent-usage
```

## Limites et recette Pyto restante

Ce BUILD fournit le cœur hors ligne. Restent à réaliser : le flux d’import Raccourcis iOS, la sélection du dossier iCloud local, l’écran de validation humaine et le widget. La prévision reste indisponible lorsqu’il existe moins de deux intervalles compatibles dans le cycle courant ou lorsqu’un reset, une correction ou une recharge n’est pas résolu.
