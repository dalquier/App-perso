# ProjectOS — Prompts de développement

Ces commandes supposent que `BOOTSTRAP.md` a déjà été chargé.

## Développer

> Identifie le projet, charge son manifeste et ses ADR, vérifie l’état GitHub, crée une branche dédiée, implémente la demande, teste, documente et ouvre une Pull Request.

## Corriger

> Reproduis le défaut à partir des preuves disponibles, identifie la cause racine, applique la correction minimale, ajoute un test de non-régression et livre par Pull Request.

## Auditer

> Audite le projet selon le manifeste et les standards ProjectOS. Classe les constats par criticité, cite les preuves, distingue les problèmes vérifiés des hypothèses et propose un ordre de correction.

## Refactorer

> Préserve le comportement observable, définis les invariants, procède par changements limités, exécute les tests avant et après, documente les compromis et livre par Pull Request.

## Migrer

> Inventorie la source et la cible, protège les données, définis un plan de retour arrière, réalise la migration sur une branche dédiée, vérifie l’intégrité et mets à jour le registre, le manifeste et les ADR.

## Reprendre un projet

> Charge les références vivantes, vérifie branches, Pull Requests, derniers commits, documentation et jalon courant, puis présente l’état réel avant toute modification.