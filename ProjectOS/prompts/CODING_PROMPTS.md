# ProjectOS — Prompts de développement

Ces commandes supposent que `BOOTSTRAP.md` a déjà été chargé.

## Règle commune de démarrage

Le premier prompt d’une nouvelle discussion doit commencer par :

```text
Nom de la discussion : <Projet> — <Vague ou jalon> — <Axe ou mission> — <action>
```

L’agent reprend ce nom dans sa première réponse. Si l’interface ne permet pas le renommage automatique, il demande explicitement à Damien d’appliquer ce nom manuellement.

## Précontrôle obligatoire pour Codex

Avant toute modification substantielle, exécuter et rapporter ce contrôle :

```text
Avant toute production de code, vérifie que cette tâche s’exécute dans un environnement Codex GitHub relié au dépôt canonique.

1. Confirme le dépôt associé à l’environnement.
2. Confirme que l’accès Internet de l’agent est activé lorsque GitHub ou des dépendances distantes sont nécessaires.
3. Vérifie que `origin` pointe vers le dépôt canonique.
4. Accède réellement à `origin/main` et indique son SHA distant actuel.
5. Confirme que la publication d’une branche distante et la création d’une Pull Request sont disponibles.
6. Vérifie que la base locale n’est pas obsolète.

Un simple `git remote -v`, une branche locale ou un commit local ne constitue pas une preuve d’accès GitHub.

Si un contrôle échoue, arrête-toi avant de produire du code. Indique le paramétrage à corriger et classe la tâche `bloquée avant exécution`.
```

## Règle commune de transmission

Pour toute tâche substantielle, crée avant ta réponse finale un fichier temporaire conforme à `ProjectOS/standards/AGENT_HANDOFFS.md`, indique son chemin exact, puis conserve-le jusqu’à ce que l’agent coordinateur confirme sa prise en compte.

La livraison normale exige une branche distante, des commits accessibles, les fichiers complets dans leur arborescence et une Pull Request vérifiable. Un ZIP peut être ajouté sur une branche temporaire comme facilité de téléchargement, sans remplacer les fichiers du projet.

Le mode `handoff-restreint` n’est utilisé qu’après une panne imprévisible survenue malgré un précontrôle réussi, ou sur instruction explicite de Damien. Un chemin local inaccessible ne constitue jamais une livraison.

Après reprise et validation, supprime les éléments temporaires et vérifie qu’ils ne seront pas fusionnés dans la branche canonique.

## Développer

> Identifie le projet, charge son manifeste et ses ADR, exécute le précontrôle Codex, vérifie l’état GitHub vivant, crée une branche distante dédiée, implémente la demande, teste, documente et crée le compte rendu temporaire. Livre les fichiers complets dans leur arborescence et ouvre une Pull Request. Si le précontrôle échoue, arrête avant toute implémentation.

## Corriger

> Exécute le précontrôle Codex lorsque la correction est substantielle. Reproduis le défaut à partir des preuves disponibles, identifie la cause racine, applique la correction minimale, ajoute un test de non-régression, crée le compte rendu temporaire et livre par branche distante et Pull Request.

## Auditer

> Audite le projet selon le manifeste et les standards ProjectOS. Classe les constats par criticité, cite les preuves, distingue les problèmes vérifiés des hypothèses, propose un ordre de correction et enregistre l’audit dans le compte rendu temporaire.

## Refactorer

> Exécute le précontrôle Codex avant toute modification. Préserve le comportement observable, définis les invariants, procède par changements limités, exécute les tests avant et après, documente les compromis, crée le compte rendu temporaire et livre par branche distante et Pull Request.

## Migrer

> Exécute le précontrôle Codex avant toute modification. Inventorie la source et la cible, protège les données, définis un plan de retour arrière, réalise la migration sur une branche distante dédiée, vérifie l’intégrité, mets à jour le registre, le manifeste et les ADR, puis ouvre une Pull Request.

## Reprendre un projet

> Charge les références vivantes, vérifie branches, Pull Requests, derniers commits, documentation, jalon courant, comptes rendus temporaires et bundles disponibles, puis présente l’état réel avant toute modification.
