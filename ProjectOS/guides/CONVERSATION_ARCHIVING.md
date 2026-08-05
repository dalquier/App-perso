# Guide — Enregistrer et retrouver une conversation depuis l’iPhone

## Enregistrer

### ChatGPT

1. Ouvrir une nouvelle conversation ProjectOS.
2. Répondre `oui` à `Enregistrer la conversation ?` pour l’archiver, ou `non` pour ne rien conserver.
3. Continuer normalement : l’archive est alimentée directement dans Google Drive.

### Codex

Aucune action : toute conversation ProjectOS est enregistrée automatiquement tant que le consentement permanent est actif.

## Ce qui est conservé

| Emplacement | Contenu |
|---|---|
| GitHub | Index, synthèse, décisions durables |
| Google Drive | Transcription visible intégrale, pièces jointes accessibles, livrables, manifeste |
| iCloud | Rien pour ce flux |

Dossier type : `App-perso/ProjectOS/Conversation-Archives/<Projet>/<année>/<Session>/`.

## Retrouver

Demander naturellement, par exemple :

- « Retrouve la conversation où nous avons décidé le stockage Drive. »
- « Retrouve la session Codex du 5 août sur l’archive des conversations. »
- « Ouvre les pièces jointes de la conversation liée à la PR #… »

L’agent recherche d’abord l’index et les synthèses GitHub, vérifie le manifeste Drive, puis restitue la conversation ou les fichiers nécessaires.

## Comprendre l’état

- `complete` : tous les messages visibles depuis l’activation et tous les fichiers accessibles ont été vérifiés.
- `partial` : un historique ou un fichier manque ; la cause est indiquée.
- `error` : l’archive n’est pas exploitable.

Les fichiers non exposés par l’application ne peuvent pas être copiés automatiquement. Ils restent listés comme manquants ; l’archive n’est jamais annoncée complète dans ce cas.
