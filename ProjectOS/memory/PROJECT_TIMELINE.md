# ProjectOS — Chronologie

Cette chronologie contient uniquement les événements structurants vérifiés de ProjectOS.

## 2026-08-05 — Consentement permanent à la mémoire Codex

- Faits vérifiés : Damien a demandé l’enregistrement de toutes les conversations avec Codex et son intégration à ProjectOS.
- Décision ou évolution : activation automatique de la mémoire structurée pour chaque conversation ProjectOS exécutée avec Codex ; consentement révocable ; archive brute non automatique.
- Références GitHub : ADR-002 ; branche `agent/projectos-permanent-codex-memory` ; PR #30.
- Résultat : PR #30 fusionnée dans `main`.

## 2026-08-05 — Archive directe des conversations sélectionnées

- Faits vérifiés : Damien choisit l’enregistrement pour ChatGPT et maintient l’enregistrement systématique pour Codex.
- Décision ou évolution : GitHub reçoit seulement index et synthèses ; Google Drive reçoit directement transcription visible, pièces jointes accessibles, livrables et manifeste ; aucun transit iCloud.
- Références GitHub : ADR-003 ; branche `agent/projectos-direct-drive-conversation-archive` ; PR #36.
- Preuve Drive pilote : dossier privé `SES-20260805-002`, état `partial`.
