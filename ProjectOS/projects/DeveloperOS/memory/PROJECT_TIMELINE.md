# DeveloperOS — Chronologie

Cette chronologie est alimentée uniquement par des événements structurants vérifiés issus de sessions enregistrées ou de références GitHub canoniques.

## 2026-08-05 — Conversation Orchestrator SPEC-00

- Adoption des deux canaux `chatgpt_plus_manual` et `openai_api` ; un run hybride est dérivé de leur combinaison.
- Nommage déterministe des prompts fils à partir du nom maître et d’une séquence générée selon l’ordre canonique des missions.
- Définition de `run-request.json`, du plan immuable `run-plan.json`, des résultats normalisés et de la synthèse maître.
- Définition du graphe de dépendances et de l’injection obligatoire des résultats amont dans les prompts aval.
- Séparation des Builds : contrats d’abord, puis lots manuel, API et QA parallélisables sur périmètres exclusifs.
- Publication, relecture et correction de la branche `developeros/spec-00-conversation-orchestrator` dans la PR #44.
