# Outils et stockages

## Rôles permanents

- ChatGPT : architecture, recherche, cadrage, pilotage, revue et petits changements.
- Codex : Builds, changements multi-fichiers, refactorings, migrations, débogage, tests et Pull Requests.
- GitHub : source de vérité du contenu versionnable et lieu canonique de livraison.
- Google Drive : documents collaboratifs, sauvegardes et archives conversationnelles intégrales privées.
- Working Copy : client Git principal sur iPhone.
- iCloud Drive : fichiers locaux et échanges iPhone ; aucun transit requis pour les archives conversationnelles.
- Replit Starter : exécution, tests, stockage de travail, hébergement et déploiement.
- Pyto / Scriptable : automatisations iPhone lorsque nécessaires.

## Règles de stockage

1. Code, règles, ADR, documentation, index et synthèses sont commités dans GitHub.
2. Le verbatim conversationnel, les pièces jointes et les livrables ne sont jamais commités dans GitHub ; ils vont directement dans Google Drive.
3. Une conversation activée utilise `App-perso/ProjectOS/Conversation-Archives/<Projet>/<année>/<session>/`.
4. Chaque archive contient un manifeste et sépare `attachments/` de `deliverables/`.
5. Les secrets restent dans les gestionnaires de secrets des plateformes.
6. Les fichiers volumineux sont indexés ; seuls les fragments utiles sont chargés.
7. Toute migration conserve une possibilité de retour arrière.
8. Un ZIP, export ou artefact de test n’est jamais la livraison canonique.
9. Tout changement durable effectué pendant un test est reversé dans GitHub.
10. Les archives conversationnelles sont privées par défaut et ne constituent pas une source de vérité.

## Routage

Appliquer `CODE_WORK_ROUTING.md`, `TOOLCHAIN_POLICY.md` et, pour les conversations activées, `CONVERSATION_ARCHIVE_PIPELINE.md`.

Le parcours cible est entièrement utilisable depuis l’iPhone : Damien choisit dans l’app ; ChatGPT ou Codex écrit directement dans Drive et GitHub via les connexions cloud. Aucun Raccourci iOS, Pyto ou dossier iCloud de transit n’est nécessaire.
