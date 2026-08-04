# ProjectOS — Prompts de développement

Ces commandes supposent que `BOOTSTRAP.md` a déjà été chargé.

## Règle commune de démarrage

Le premier prompt d’une nouvelle discussion doit commencer par :

```text
Nom de la discussion : <Projet> — <Vague ou jalon> — <Axe ou mission> — <action>
```

L’agent reprend ce nom dans sa première réponse. Si l’interface ne permet pas le renommage automatique, il demande explicitement à Damien d’appliquer ce nom manuellement.

## Précontrôle obligatoire pour Codex Cloud

Pour une tâche exécutée dans un environnement Codex relié au dépôt GitHub indiqué, utiliser ce précontrôle et ne pas le remplacer par une recherche de credentials terminal :

```text
L’environnement Codex est relié au dépôt GitHub indiqué et à la branche de base indiquée.

Travaille dans le sandbox fourni par Codex.
Ne vérifie pas GH_TOKEN ou GITHUB_TOKEN.
Ne lance pas gh auth login.
Ne tente pas git push ou git push --dry-run depuis le terminal.
Ne considère pas l’absence de remote origin, d’upstream, de origin/main ou de credentials Git dans le terminal comme bloquante.
Ne demande pas au sandbox de prouver que les boutons de publication de l’interface existent.

Vérifie uniquement :
1. que le dépôt et la branche de base affichés par l’environnement correspondent au projet ;
2. que les références ProjectOS attendues sont présentes ;
3. que l’arbre de travail initial est propre ou que les modifications préexistantes sont identifiées ;
4. que le périmètre de fichiers autorisé est compris ;
5. que les dépendances et tests nécessaires sont exécutables.

Produis les modifications, exécute les tests et prépare un diff propre.
La publication de la branche et de la Pull Request sera réalisée avec le mécanisme natif de Codex après la tâche.
Ne modifie jamais directement main.
Ne fusionne jamais la Pull Request sans instruction explicite.
```

Une branche locale `work`, un `git remote -v` vide, l’absence de `GH_TOKEN` ou l’échec de `gh auth status` sont des caractéristiques possibles du sandbox Codex et ne justifient pas l’arrêt de la tâche.

## Autres environnements

Lorsque la tâche n’est pas exécutée dans Codex Cloud avec publication native, appliquer `ProjectOS/standards/CODE_WORK_ROUTING.md` et choisir explicitement :

- `github-cli` si le terminal possède réellement les credentials nécessaires ;
- `handoff-restreint` si un artefact complet et récupérable doit être transmis.

## Règle commune de transmission

Pour toute tâche substantielle, créer avant la réponse finale un fichier temporaire conforme à `ProjectOS/standards/AGENT_HANDOFFS.md`, indiquer son chemin exact et le conserver jusqu’à prise en compte.

En mode Codex natif, le flux normal est :

1. produire le code et les tests dans le sandbox ;
2. produire un diff propre ;
3. fournir le résumé, les tests, les limites et le texte proposé de Pull Request ;
4. publier ensuite par le menu GitHub de l’interface Codex ;
5. vérifier la branche et la Pull Request dans GitHub.

L’absence de credentials Git dans le terminal n’est pas un défaut de paramétrage dans ce mode.

## Développer

> Identifie le projet, charge son manifeste, ses ADR et `CODEX_NATIVE_PUBLISHING.md` lorsque la tâche s’exécute dans Codex Cloud. Implémente la demande dans le périmètre autorisé, teste, documente, crée le compte rendu temporaire et prépare un diff propre. Ne bloque pas sur l’absence de `origin` ou de jeton dans le sandbox. La publication sera réalisée par le mécanisme natif Codex après la tâche. Ne modifie jamais `main` directement.

## Corriger

> Reproduis le défaut à partir des preuves disponibles, identifie la cause racine, applique la correction minimale, ajoute un test de non-régression, crée le compte rendu temporaire et prépare un diff publiable. Dans Codex Cloud, n’effectue aucun contrôle `GH_TOKEN`, `gh auth login` ou `git push` terminal.

## Auditer

> Audite le projet selon le manifeste et les standards ProjectOS. Classe les constats par criticité, cite les preuves, distingue les problèmes vérifiés des hypothèses, propose un ordre de correction et enregistre l’audit dans le compte rendu temporaire.

## Refactorer

> Préserve le comportement observable, définis les invariants, procède par changements limités, exécute les tests avant et après, documente les compromis, crée le compte rendu temporaire et prépare un diff propre pour publication native Codex ou autre mécanisme prévu.

## Migrer

> Inventorie la source et la cible, protège les données, définis un plan de retour arrière, réalise la migration sur la branche de travail fournie, vérifie l’intégrité, mets à jour le registre, le manifeste et les ADR, puis prépare la livraison complète. Dans Codex Cloud, la publication intervient après la tâche par l’interface native.

## Reprendre un projet

> Charge les références vivantes, vérifie branches, Pull Requests, derniers commits, documentation, jalon courant, comptes rendus temporaires et bundles disponibles, puis présente l’état réel avant toute modification.
