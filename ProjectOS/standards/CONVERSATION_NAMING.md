# ProjectOS — Nommage des discussions

## Objectif

Rendre les conversations ChatGPT et Codex retrouvables et associables aux branches, Pull Requests, synthèses et archives Drive.

## Nom

Format recommandé :

`<Projet> — <Vague ou jalon> — <Axe ou mission> — <action>`

Le premier prompt peut préciser `Nom de la discussion : <nom demandé>`. L’agent reprend ce nom ou indique le nom exact à appliquer si l’interface ne peut pas renommer.

## Activation

- Codex : enregistrement automatique, identifiant attribué dès l’amorçage, première réponse terminée par `Mémoire Codex : enregistrement activé.`.
- ChatGPT/autre : première réponse terminée par `Enregistrer la conversation ?` ; identifiant attribué seulement après un oui.

## Identifiant et dossier

Identifiant : `SES-AAAAMMJJ-NNN`.

Dossier Drive : `App-perso/ProjectOS/Conversation-Archives/<Projet>/<année>/<Session>/`.

Le nom et l’identifiant apparaissent dans l’index, la synthèse, le manifeste, la description de Pull Request et les transmissions pertinentes. Ils ne contiennent ni secret ni donnée sensible.
