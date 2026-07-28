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
Avant toute production substantielle, vérifie que cette tâche s’exécute dans un environnement relié au dépôt canonique et identifie le mécanisme réel de publication.

1. Confirme le dépôt associé à l’environnement.
2. Confirme que l’accès Internet de l’agent est activé lorsque GitHub ou des dépendances distantes sont nécessaires.
3. Vérifie que `origin` pointe vers le dépôt canonique.
4. Accède réellement à `origin/main` et indique son SHA distant actuel.
5. Vérifie que la base locale n’est pas obsolète.
6. Distingue explicitement :
   - lecture GitHub disponible ;
   - écriture Git/CLI disponible ou non ;
   - publication native Codex ou plateforme disponible ou non ;
   - handoff récupérable disponible ou non.
7. Choisis le mode de sortie : `github-natif`, `github-cli` ou `handoff-restreint`.

Un simple `git remote -v`, une branche locale ou un commit local ne constitue pas une preuve d’accès GitHub.
Un `git push --dry-run` refusé faute de credentials ne prouve pas que la publication native Codex est indisponible.

Si aucune méthode de transmission réelle n’est disponible, arrête-toi avant de produire et classe la tâche `bloquée avant exécution`.
Si GitHub est lisible mais que le terminal n’a pas de credentials, utilise la publication native de la plateforme ou annonce avant exécution le mode `handoff-restreint` avec artefact récupérable.
```

## Règle commune de transmission

Pour toute tâche substantielle, crée avant ta réponse finale un fichier temporaire conforme à `ProjectOS/standards/AGENT_HANDOFFS.md`, indique son chemin exact, puis conserve-le jusqu’à ce que l’agent coordinateur confirme sa prise en compte.

La livraison normale peut utiliser :

- la publication native Codex ou plateforme, vérifiée ensuite dans GitHub ;
- Git/GitHub CLI avec credentials ;
- le mode `handoff-restreint` lorsqu’aucune publication directe n’est possible mais qu’un artefact complet peut être transmis.

L’absence de credentials Git dans le terminal n’est pas à elle seule un défaut de paramétrage si la publication native fonctionne. Un chemin local inaccessible ne constitue jamais une livraison.

Après reprise et validation, supprime les éléments temporaires et vérifie qu’ils ne seront pas fusionnés dans la branche canonique.

## Développer

> Identifie le projet, charge son manifeste et ses ADR, exécute le précontrôle des capacités, vérifie l’état GitHub vivant et choisis explicitement `github-natif`, `github-cli` ou `handoff-restreint`. Implémente la demande, teste, documente et crée le compte rendu temporaire. Publie par branche et Pull Request si la plateforme le permet ; sinon transmets un artefact complet et récupérable avec `APPLY_INSTRUCTIONS.md`. Ne te limite jamais à fournir des commandes shell lorsque les fichiers peuvent être transmis.

## Corriger

> Exécute le précontrôle des capacités lorsque la correction est substantielle. Reproduis le défaut à partir des preuves disponibles, identifie la cause racine, applique la correction minimale, ajoute un test de non-régression, crée le compte rendu temporaire et livre via publication native, Git/CLI ou handoff restreint selon les capacités vérifiées.

## Auditer

> Audite le projet selon le manifeste et les standards ProjectOS. Classe les constats par criticité, cite les preuves, distingue les problèmes vérifiés des hypothèses, propose un ordre de correction et enregistre l’audit dans le compte rendu temporaire.

## Refactorer

> Exécute le précontrôle des capacités avant toute modification. Préserve le comportement observable, définis les invariants, procède par changements limités, exécute les tests avant et après, documente les compromis, crée le compte rendu temporaire et publie ou transmets selon le mode choisi.

## Migrer

> Exécute le précontrôle des capacités avant toute modification. Inventorie la source et la cible, protège les données, définis un plan de retour arrière, réalise la migration sur une branche dédiée locale ou distante selon le mode, vérifie l’intégrité, mets à jour le registre, le manifeste et les ADR, puis publie ou transmets la livraison complète.

## Reprendre un projet

> Charge les références vivantes, vérifie branches, Pull Requests, derniers commits, documentation, jalon courant, comptes rendus temporaires et bundles disponibles, puis présente l’état réel avant toute modification.
