# ProjectOS — Chronologie

Cette chronologie contient uniquement les événements structurants vérifiés de ProjectOS.

## 2026-08-05 — Consentement permanent à la mémoire Codex

- Faits vérifiés : Damien a demandé l’enregistrement de toutes les conversations avec Codex et son intégration à ProjectOS.
- Décision ou évolution : activation automatique de la mémoire structurée pour chaque conversation ProjectOS exécutée avec Codex ; consentement révocable.
- Références GitHub : ADR-002 ; branche `agent/projectos-permanent-codex-memory` ; PR #30.
- État : intégré à `main`.

## 2026-08-05 — Archivage sélectif des conversations enregistrées

- Faits vérifiés : Damien veut conserver sur Google Drive uniquement les conversations ChatGPT et Codex enregistrées par ProjectOS et leurs fichiers associés, afin de limiter l’espace GitHub tout en permettant la récupération.
- Décision ou évolution : GitHub conserve l’index et les synthèses ; Drive conserve les archives disponibles et non canoniques ; iCloud sert de transit ; aucun export global du compte OpenAI.
- Références GitHub : ADR-003 ; branche `agent/projectos-selective-conversation-archives` ; PR #33.
- Limite : l’automatisation dépend de l’accès réel au verbatim et aux pièces jointes ; la présente session n’expose pas son export brut.
- Prochaine action : relire puis fusionner explicitement la PR #33 si elle est conforme.
