# ProjectOS — Prompts de développement

Ces commandes supposent que `BOOTSTRAP.md` a déjà été chargé.

## Règle commune de démarrage

Le premier prompt d’une nouvelle discussion doit commencer par :

```text
Nom de la discussion : <Projet> — <Vague ou jalon> — <Axe ou mission> — <action>
```

L’agent reprend ce nom dans sa première réponse. Si l’interface ne permet pas le renommage automatique, il demande explicitement à Damien d’appliquer ce nom manuellement.

## Règle commune de transmission

Pour toute tâche substantielle, crée avant ta réponse finale un fichier temporaire conforme à `ProjectOS/standards/AGENT_HANDOFFS.md`, indique son chemin exact, puis conserve-le jusqu’à ce que l’agent coordinateur confirme sa prise en compte.

Si GitHub est accessible en écriture, pousse la branche et ouvre une Pull Request. Si l’environnement est restreint, termine tout de même le travail et produis une archive ZIP partageable, un patch, un bundle Git ou, à défaut, le contenu complet des fichiers avec `APPLY_INSTRUCTIONS.md`. Transmets réellement l’artefact par pièce jointe, téléchargement, feuille de partage iOS ou contenu intégré ; un chemin local inaccessible ne suffit pas. Ne te limite jamais à fournir des commandes shell que Damien devrait exécuter.

Après reprise et validation, supprime les éléments temporaires et vérifie qu’ils ne seront pas fusionnés dans la branche canonique.

## Développer

> Identifie le projet, charge son manifeste et ses ADR, vérifie l’état GitHub, crée une branche dédiée, implémente la demande, teste, documente et crée le compte rendu temporaire. Livre par Pull Request lorsque l’accès GitHub le permet ; sinon produis et transmets une livraison de repli récupérable conforme à `AGENT_HANDOFFS.md`.

## Corriger

> Reproduis le défaut à partir des preuves disponibles, identifie la cause racine, applique la correction minimale, ajoute un test de non-régression, crée le compte rendu temporaire et livre par Pull Request ou par bundle de repli réellement accessible.

## Auditer

> Audite le projet selon le manifeste et les standards ProjectOS. Classe les constats par criticité, cite les preuves, distingue les problèmes vérifiés des hypothèses, propose un ordre de correction et enregistre l’audit dans le compte rendu temporaire. Rends le résultat récupérable même sans accès GitHub.

## Refactorer

> Préserve le comportement observable, définis les invariants, procède par changements limités, exécute les tests avant et après, documente les compromis, crée le compte rendu temporaire et livre par Pull Request ou par bundle de repli récupérable.

## Migrer

> Inventorie la source et la cible, protège les données, définis un plan de retour arrière, réalise la migration sur une branche dédiée, vérifie l’intégrité, mets à jour le registre, le manifeste et les ADR, puis crée le compte rendu temporaire et une livraison récupérable.

## Reprendre un projet

> Charge les références vivantes, vérifie branches, Pull Requests, derniers commits, documentation, jalon courant, comptes rendus temporaires et bundles disponibles, puis présente l’état réel avant toute modification.