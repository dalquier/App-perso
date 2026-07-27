# ProjectOS — Prompts de développement

Ces commandes supposent que `BOOTSTRAP.md` a déjà été chargé.

## Règle commune de transmission

Pour toute tâche substantielle, crée avant ta réponse finale un fichier temporaire conforme à `ProjectOS/standards/AGENT_HANDOFFS.md`, indique son chemin exact, puis conserve-le jusqu’à ce que l’agent coordinateur confirme sa prise en compte. Supprime-le ensuite et vérifie qu’il ne sera pas fusionné dans la branche canonique.

## Développer

> Identifie le projet, charge son manifeste et ses ADR, vérifie l’état GitHub, crée une branche dédiée, implémente la demande, teste, documente, crée le compte rendu temporaire de transmission et ouvre une Pull Request.

## Corriger

> Reproduis le défaut à partir des preuves disponibles, identifie la cause racine, applique la correction minimale, ajoute un test de non-régression, crée le compte rendu temporaire de transmission et livre par Pull Request.

## Auditer

> Audite le projet selon le manifeste et les standards ProjectOS. Classe les constats par criticité, cite les preuves, distingue les problèmes vérifiés des hypothèses, propose un ordre de correction et enregistre l’audit dans le compte rendu temporaire de transmission.

## Refactorer

> Préserve le comportement observable, définis les invariants, procède par changements limités, exécute les tests avant et après, documente les compromis, crée le compte rendu temporaire de transmission et livre par Pull Request.

## Migrer

> Inventorie la source et la cible, protège les données, définis un plan de retour arrière, réalise la migration sur une branche dédiée, vérifie l’intégrité, mets à jour le registre, le manifeste et les ADR, puis crée le compte rendu temporaire de transmission.

## Reprendre un projet

> Charge les références vivantes, vérifie branches, Pull Requests, derniers commits, documentation, jalon courant et comptes rendus temporaires disponibles, puis présente l’état réel avant toute modification.
