# ProjectOS — Documentation

Chaque projet dispose d’un manifeste à jour. Les décisions durables ou difficiles à inverser sont consignées dans une ADR. Les instructions d’installation, test, sauvegarde et restauration doivent être applicables.

Toute livraison précise : changement, raison, fichiers, tests, limites, retour arrière et prochaine action.

Pour toute tâche logicielle substantielle, appliquer `AGENT_HANDOFFS.md`. Les informations durables sont transférées dans la documentation canonique.

La mémoire conversationnelle suit `CONVERSATION_MEMORY.md` et `CONVERSATION_ARCHIVE_PIPELINE.md`.

Pour une conversation enregistrée :

- GitHub contient uniquement l’index, la synthèse et les décisions durables ;
- Google Drive contient la transcription visible intégrale, les pièces jointes accessibles, les livrables et le manifeste ;
- la synthèse distingue faits, hypothèses et informations manquantes ;
- l’index renvoie vers les branches, commits, Pull Requests et le dossier Drive réels ;
- tout manque rend l’archive `partial` ou `error`, jamais `complete` ;
- aucun secret ni contenu sensible inutile n’est conservé.

Un refus d’enregistrement n’empêche jamais de documenter les changements imposés par la tâche. La documentation décrit la réalité vérifiée ; une référence remplacée est mise à jour ou archivée.
