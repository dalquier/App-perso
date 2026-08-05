# ADR-003 — Archivage conversationnel direct dans Google Drive

- Statut : accepté
- Date : 2026-08-05
- Portée : toutes les conversations ProjectOS enregistrées

## Contexte

Damien veut choisir l’enregistrement des conversations ChatGPT, enregistrer systématiquement les conversations Codex, conserver le verbatim et toutes les pièces jointes, retrouver facilement une session et réaliser l’ensemble depuis l’iPhone. GitHub ne doit contenir que les synthèses et l’index.

Un export tardif ou un dossier iCloud de transit ne garantit pas la conservation de chaque tour et ajoute une manipulation manuelle.

## Décision

1. ChatGPT demande un consentement ponctuel à chaque nouvelle conversation ProjectOS.
2. Codex applique le consentement permanent existant.
3. Après activation, chaque tour visible est capturé incrémentalement, avant retour de la réponse.
4. Google Drive stocke directement la transcription, les pièces jointes accessibles, les livrables et le manifeste.
5. GitHub stocke uniquement l’index, la synthèse et les décisions durables.
6. iCloud n’intervient pas dans ce flux.
7. Une archive incomplète est explicitement marquée `partial` ou `error`.

## Arborescence

`App-perso/ProjectOS/Conversation-Archives/<Projet>/<année>/<Session>/`

Chaque dossier contient `conversation.jsonl`, `conversation.md`, `MANIFEST.json`, `attachments/` et `deliverables/`.

## Conséquences

- L’usage est 100 % iPhone côté utilisateur, avec écritures cloud réalisées par les connecteurs.
- La capture par tour limite les pertes dues au compactage du contexte.
- La complétude dépend des droits et capacités réelles d’accès aux fichiers.
- Les archives restent secondaires par rapport aux références canoniques GitHub.
- La révocation arrête les captures futures ; les suppressions rétroactives restent explicites.

## Alternatives rejetées

- iCloud de transit puis import : manipulations et points de panne supplémentaires.
- Export en fin de conversation : risque de perte et disponibilité variable.
- Verbatim et pièces jointes dans GitHub : contraire à la séparation demandée et inadapté aux fichiers lourds.
