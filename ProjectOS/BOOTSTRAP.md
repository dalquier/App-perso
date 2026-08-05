# ProjectOS — BOOTSTRAP

Point d’entrée unique et stable de ProjectOS. GitHub `dalquier/App-perso`, branche `main`, est la source de vérité.

## 1. Principes permanents

- Charger les références vivantes ; ne jamais substituer une copie mémorisée à une référence accessible.
- Appliquer `standards/CREDIT_OPTIMIZATION.md` à toute demande ProjectOS.
- ChatGPT et Codex réalisent le développement ; Replit Starter est réservé à l’exécution, aux tests, au stockage de travail et au déploiement.
- Toute production de modification ou d’artefact applique `standards/ARTIFACT_DELIVERY_AND_RECOVERY.md` avant la première modification.
- Dans Codex Cloud, la publication GitHub native reste valable même si le terminal ne dispose pas de `origin`, `GH_TOKEN` ou `gh`.
- La mémoire et l’archive conversationnelles sont régies par `standards/CONVERSATION_MEMORY.md` et `standards/CONVERSATION_ARCHIVE_PIPELINE.md`.
- Consentement permanent Codex du 5 août 2026 : toute conversation ProjectOS dans Codex est enregistrée automatiquement, avec transcription visible et pièces jointes accessibles dans Google Drive.
- Dans ChatGPT et les autres outils, demander le consentement ponctuel exact avant tout enregistrement.
- Les messages intermédiaires visibles pendant une tâche ProjectOS avec attente ou outils contiennent uniquement : `Temps restant estimé : <durée>.`

## 2. Séquence obligatoire

1. Charger `ProjectOS/00_INDEX.md`, `PROJECT_REGISTRY.md`, puis `core/KERNEL.md`, `core/LIFECYCLE.md` et `core/DECISION_ENGINE.md`.
2. Charger `standards/CREDIT_OPTIMIZATION.md`.
3. Pour un projet logiciel, charger `standards/TOOLCHAIN_POLICY.md`.
4. Pour toute modification ou livraison, charger `standards/ARTIFACT_DELIVERY_AND_RECOVERY.md`; dans Codex Cloud, charger aussi `standards/CODEX_NATIVE_PUBLISHING.md`.
5. Charger `standards/CONVERSATION_MEMORY.md` et `standards/CONVERSATION_ARCHIVE_PIPELINE.md` pour toute nouvelle conversation ProjectOS.
6. Identifier le projet, résoudre son manifeste, puis charger seulement les ADR, standards et documents utiles.
7. Effectuer le Delivery Preflight avant toute première modification.
8. Vérifier l’état vivant des dépôts, branches, Pull Requests, fichiers et exécutions concernés.
9. Appliquer le régime d’enregistrement :
   - Codex : attribuer immédiatement un identifiant `SES-AAAAMMJJ-NNN`, initialiser l’archive Drive, puis terminer la première réponse par `Mémoire Codex : enregistrement activé.` ;
   - ChatGPT/autre : terminer la première réponse par `Enregistrer la conversation ?`, sans texte après ; ne rien enregistrer avant un `oui`.
10. Dès activation, charger sélectivement l’index, la chronologie et les synthèses pertinentes, puis capturer chaque tour selon le pipeline.
11. Exécuter la méthode ProjectOS jusqu’à une livraison vérifiable.

## 3. Ordre d’autorité

1. Instruction explicite de Damien dans la conversation active.
2. Contraintes de sécurité et règles de la plateforme.
3. `PROJECT_MANIFEST.md` du projet concerné.
4. ADR applicables.
5. Règles transverses ProjectOS.
6. Documentation versionnée.
7. Documentation collaborative explicitement référencée sur Google Drive.
8. Index et synthèses conversationnels GitHub.
9. Archive intégrale Google Drive.

Une règle spécifique prévaut sur une règle générale dans son périmètre. Une instruction explicite récente prévaut sauf atteinte à la sécurité ou à l’intégrité des données.

## 4. Chargement sélectif et fraîcheur

- Toujours vérifier la branche, le SHA source, les références absentes ou obsolètes et le canal de livraison.
- Après activation, charger uniquement `memory/CONVERSATION_INDEX.md`, `memory/PROJECT_TIMELINE.md` et les synthèses directement pertinentes.
- Consulter Google Drive uniquement pour une archive activée, une ressource nécessaire ou une restitution demandée.
- Recharger toute référence modifiée pendant la conversation avant une décision dépendante.

## 5. Première réponse

Elle reste courte : source et branche, références obligatoires chargées, projet ou niveau transverse, anomalie éventuelle, disponibilité. Elle se termine obligatoirement par :

- Codex : `Mémoire Codex : enregistrement activé.`
- ChatGPT/autre : `Enregistrer la conversation ?`

Ne jamais demander d’activer ProjectOS lorsqu’il est déjà chargé.
