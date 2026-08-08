# ADR-003 — Tampon iCloud pour les archives de conversations

## Décision

Les archives intégrales Codex et ChatGPT ne transitent jamais directement d’un bac temporaire vers Drive. Elles sont d’abord capturées dans `ConversationBuffer` sous la destination iCloud autorisée, puis envoyées vers le dossier append-only `ConversationArchives` de Google Drive.

Le cycle est `Inbox → Pending → Uploading → Verified`. `Failed` isole une archive locale corrompue et `Quarantine` un paquet incomplet. Chaque paquet contient une transcription intégrale (`conversation.jsonl` ou `conversation.md`), toutes ses pièces jointes disponibles et `BUFFER_MANIFEST.json` avec taille et SHA-256 de chaque fichier.

Une réponse réseau perdue est résolue par lecture des reçus distants avant tout nouvel envoi. Drive publie son manifeste d’archive en dernier. Le paquet local ne devient `Verified` qu’après relecture d’une preuve distante portant la même empreinte. Une archive non vérifiée n’est jamais supprimée automatiquement ; une archive vérifiée reste 30 jours dans le tampon.

## Motifs

- le stockage d’un sandbox Codex n’est pas durable ;
- iOS peut suspendre Pyto à tout moment ;
- Google Drive ou Apps Script peuvent être momentanément indisponibles ;
- une copie locale atomique évite de dépendre d’un transfert réseau immédiat ;
- l’append-only convient à des conversations historiques, contrairement au miroir courant des fichiers de code.

## Limite assumée

Codex Cloud ne peut pas écrire directement dans l’iCloud privé de l’iPhone. Le paquet doit être remis à `ConversationBuffer/Inbox` par téléchargement, partage iOS ou automatisation autorisée. L’application importe ensuite ce paquet sans intervention supplémentaire.
