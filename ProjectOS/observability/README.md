# ProjectOS — Observability

Ce dossier regroupe les références durables nécessaires à l’observabilité de ProjectOS.

## Source opérationnelle

- Incident Ledger : GitHub issue #87 — `ProjectOS — Incident Ledger`.
- Le Ledger contient les occurrences sous forme de commentaires structurés et append-only.
- `standards/INCIDENT_LEARNING.md` définit la taxonomie, la gravité, la déduplication et la capture.
- `templates/INCIDENT_OCCURRENCE.json.example` définit la forme machine-readable d’une occurrence.
- `scripts/incident_aggregator.py` lit le Ledger et produit la vue JSON déterministe commune aux consommateurs.
- `observability/AGGREGATOR_CONTRACT.md` définit ce contrat partagé.

## Composants

Une seule source de données structurée alimente les vues ; aucune vue ne devient une seconde source de vérité.

### Capture et apprentissage

`INCIDENT_LEARNING.md` et le Ledger #87 capturent, classent et dédupliquent les incidents selon type, gravité S1–S4, statut et couverture ProjectOS.

### Agrégateur

`scripts/incident_aggregator.py` calcule sans IA les incidents uniques, occurrences, actifs, récurrents, gravités, statuts, types, projets, outils, étapes, couverture et fenêtres 7/30 jours.

### Widget Pyto

`observability/pyto/incident_widget.py` fournit une vue iPhone simple en tailles petite, moyenne et grande. Il réutilise l’agrégateur canonique, reste en lecture seule et ouvre le Ledger #87 au toucher.

### Dashboard Replit

Une application Replit dédiée `Incident Dashboard` a été créée comme vue détaillée en lecture seule : overview, filtres, récurrence, chronologie et ProjectOS Learning. Elle doit rester un consommateur du Ledger et ne jamais écrire dans GitHub. La validation runtime Replit doit être obtenue avant de qualifier cette vue d’opérationnelle ou de la publier.

### Incident Analyzer

`scripts/incident_analyzer.py` produit à la demande une synthèse filtrable et un prompt d’audit complet pour ChatGPT ou Codex. Il n’applique jamais automatiquement les recommandations. Voir `observability/ANALYZER.md`.

## Quality Gate

`ProjectOS Quality` compile désormais tous les scripts ProjectOS et exécute conditionnellement les tests de l’agrégateur/Analyzer et du widget Pyto lorsqu’ils sont présents.

## État des phases

- Phase 1 — gouvernance, taxonomie, gravité et schéma : **intégrée**.
- Phase 2 — capture et Ledger GitHub #87 : **intégrée**.
- Phase 3 — agrégateur et indicateurs : **intégrée**.
- Phase 4A — widget Pyto : **intégrée, validation automatisée verte ; recette physique iPhone restante**.
- Phase 4B — dashboard Replit : **application créée, validation runtime restante avant publication**.
- Phase 5 — Incident Analyzer et générateur de prompt ChatGPT/Codex : **intégrée et tests automatisés verts**.

## Confidentialité

Le dépôt et le Ledger sont publics : seules des données opérationnelles expurgées peuvent y être enregistrées. Les archives privées, secrets, données personnelles, prompts sensibles et logs bruts restent exclus.
