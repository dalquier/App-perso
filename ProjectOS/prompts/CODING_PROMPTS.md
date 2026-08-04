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
5. que les dépendances et tests nécessaires sont exécutables ;
6. que les fichiers attendus sont inventoriés, que les formats binaires sont identifiés et que leur stratégie de génération ou leur canal de publication est choisi avant création.

Produis les modifications, exécute les tests et prépare un diff propre.
La publication de la branche et de la Pull Request sera réalisée avec le mécanisme natif de Codex après la tâche.
Ne modifie jamais directement main.
Ne fusionne jamais la Pull Request sans instruction explicite.
```

Une branche locale `work`, un `git remote -v` vide, l’absence de `GH_TOKEN` ou l’échec de `gh auth status` sont des caractéristiques possibles du sandbox Codex et ne justifient pas l’arrêt de la tâche.

## Compatibilité des ressources et du canal de publication

Avant l’implémentation, choisir l’un des modes définis dans `ProjectOS/standards/CODEX_NATIVE_PUBLISHING.md` :

- `codex-native-text` ;
- `codex-native-generated-assets` ;
- `git-binary-capable`.

Par défaut en publication native Codex :

- versionner les sources textuelles ;
- générer les artefacts binaires de manière déterministe ;
- ignorer les binaires générés ;
- vérifier les artefacts dans le build final.

Si un binaire doit être versionné, annoncer dès le début que la publication utilisera Working Copy ou un client Git compatible.

Avant la réponse finale :

```text
Contrôle le diff avec git diff --numstat <base>...HEAD.
Si un fichier binaire apparaît, ne déclare pas le diff publiable par Codex natif sans stratégie compatible.
Indique les binaires détectés, leur statut source/généré, leur commande de génération et le canal de publication retenu.
```

Il est interdit de contourner la limitation par un gros fichier Base64 ou par la suppression d’une ressource nécessaire.

## Autres environnements

Lorsque la tâche n’est pas exécutée dans Codex Cloud avec publication native, appliquer `ProjectOS/standards/CODE_WORK_ROUTING.md` et choisir explicitement :

- `github-cli` si le terminal possède réellement les credentials nécessaires ;
- `handoff-restreint` si un artefact complet et récupérable doit être transmis ;
- un client Git capable de binaires lorsque des fichiers binaires canoniques doivent être versionnés.

## Règle commune de transmission

Pour toute tâche substantielle, créer avant la réponse finale un fichier temporaire conforme à `ProjectOS/standards/AGENT_HANDOFFS.md`, indiquer son chemin exact et le conserver jusqu’à prise en compte.

En mode Codex natif, le flux normal est :

1. choisir le mode de livraison et la stratégie des ressources ;
2. produire le code et les tests dans le sandbox ;
3. produire et contrôler un diff propre ;
4. fournir le résumé, les tests, les limites, les fichiers binaires et le texte proposé de Pull Request ;
5. publier ensuite par le canal compatible ;
6. vérifier la branche et la Pull Request dans GitHub.

L’absence de credentials Git dans le terminal n’est pas un défaut de paramétrage dans ce mode.

## Développer

> Identifie le projet, charge son manifeste, ses ADR et `CODEX_NATIVE_PUBLISHING.md`. Choisis le mode de livraison et inventorie les formats binaires avant de créer les fichiers. Implémente la demande dans le périmètre autorisé, teste, documente, crée le compte rendu temporaire, contrôle `git diff --numstat` et prépare un diff compatible avec le canal annoncé. Ne bloque pas sur l’absence de `origin` ou de jeton dans le sandbox. Ne modifie jamais `main` directement.

## Corriger

> Reproduis le défaut à partir des preuves disponibles, identifie la cause racine, applique la correction minimale, ajoute un test de non-régression, vérifie si la correction introduit des fichiers binaires ou générés, crée le compte rendu temporaire et prépare un diff publiable par le canal choisi. Dans Codex Cloud, n’effectue aucun contrôle `GH_TOKEN`, `gh auth login` ou `git push` terminal.

## Auditer

> Audite le projet selon le manifeste et les standards ProjectOS. Classe les constats par criticité, cite les preuves, distingue les problèmes vérifiés des hypothèses, vérifie la compatibilité du diff et des ressources avec le canal de publication, propose un ordre de correction et enregistre l’audit dans le compte rendu temporaire.

## Refactorer

> Préserve le comportement observable, définis les invariants, procède par changements limités, exécute les tests avant et après, documente les compromis, contrôle les artefacts générés et prépare un diff propre pour le canal prévu.

## Migrer

> Inventorie la source et la cible, y compris les fichiers binaires et générés, protège les données, définis un plan de retour arrière, réalise la migration sur la branche de travail fournie, vérifie l’intégrité, mets à jour le registre, le manifeste et les ADR, puis prépare la livraison complète avec un canal compatible.

## Reprendre un projet

> Charge les références vivantes, vérifie branches, Pull Requests, derniers commits, documentation, jalon courant, comptes rendus temporaires, bundles et éventuels incidents de publication, puis présente l’état réel avant toute modification.
