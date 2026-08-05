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
