# ProjectOS — Observability

Ce dossier regroupe les références durables nécessaires à l’observabilité de ProjectOS.

## Source opérationnelle

- Incident Ledger : GitHub issue #87 — `ProjectOS — Incident Ledger`.
- Le Ledger contient les occurrences sous forme de commentaires structurés et append-only.
- `standards/INCIDENT_LEARNING.md` définit la taxonomie, la gravité, la déduplication et la capture.
- `templates/INCIDENT_OCCURRENCE.json.example` définit la forme machine-readable destinée aux futurs agrégateurs.

## Architecture prévue

Une seule source de données structurée alimentera :

1. le compteur/widget synthétique ;
2. la vue Replit détaillée ;
3. l’outil de synthèse et de génération de prompt d’analyse.

Ces interfaces sont des vues et ne deviennent jamais une seconde source de vérité.

## Phases

- Phase 1 — gouvernance, taxonomie, gravité et schéma : définie dans `INCIDENT_LEARNING.md`.
- Phase 2 — capture et Ledger GitHub : issue #87.
- Phase 3 — agrégateur et indicateurs : à construire.
- Phase 4 — widget et dashboard Replit : à construire.
- Phase 5 — Incident Analyzer et générateur de prompt ChatGPT/Codex : à construire.

## Confidentialité

Le dépôt est public : seules des données opérationnelles expurgées peuvent être enregistrées dans le Ledger ou dans ce dossier.
