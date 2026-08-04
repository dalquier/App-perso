# ProjectOS — Routage des travaux de code

## Principe

GitHub est la source canonique. Les développements substantiels sont réalisés par Codex, dans un environnement relié au dépôt canonique, puis livrés par branche et Pull Request. ChatGPT cadre, spécifie, relit et pilote. Replit, Pyto et Scriptable exécutent ou complètent le code sans devenir sources de vérité.

## Quand Codex est obligatoire

Codex est obligatoire pour :

- un nouveau Build ;
- une modification multi-fichiers ;
- une architecture, migration ou intégration ;
- un refactoring substantiel ;
- une correction transversale ;
- des tests ou validations nécessitant l’exécution du dépôt.

Les changements documentaires ou triviaux peuvent être réalisés directement par ChatGPT sur une branche dédiée.

## Modes de livraison

- `github-natif` : Codex Cloud produit le diff dans son sandbox, puis l’interface Codex publie la branche et la Pull Request après la tâche.
- `github-cli` : un terminal réellement authentifié pousse la branche et ouvre la Pull Request.
- `handoff-restreint` : un patch, ZIP ou bundle complet est transmis lorsqu’aucune publication directe n’est disponible.

## Codex Cloud

Pour toute tâche Codex Cloud, charger `ProjectOS/standards/CODEX_NATIVE_PUBLISHING.md`.

Lorsque l’interface Codex affiche explicitement le bon dépôt et la bonne branche de base, l’agent travaille dans le sandbox fourni et ne s’arrête pas uniquement parce que :

- la branche locale s’appelle `work` ;
- aucun remote ou upstream n’est visible ;
- aucun identifiant Git n’est exposé au terminal ;
- les commandes GitHub du terminal ne sont pas authentifiées ;
- le sandbox ne peut pas inspecter les boutons de l’interface.

L’agent vérifie seulement la présence des références, la propreté initiale, le périmètre autorisé, les dépendances, les tests et la capacité à produire un diff propre.

La publication intervient après la tâche via le menu GitHub de Codex. `main` n’est jamais modifiée directement et aucune Pull Request n’est fusionnée automatiquement.

## Séquence standard

1. Charger ProjectOS, le registre, le manifeste, les ADR et les standards utiles.
2. Confirmer le dépôt et la branche de base indiqués par l’environnement.
3. Définir le périmètre, les critères d’acceptation, les risques, les tests et le retour arrière.
4. Produire les fichiers dans le sandbox ou la branche de travail.
5. Exécuter les contrôles et obtenir un diff propre.
6. Créer le handoff temporaire requis.
7. Fournir le résumé, les tests, les limites, le nom logique de branche et le texte proposé de Pull Request.
8. Publier par l’interface Codex, Git/CLI ou handoff selon le mode.
9. Vérifier la branche et la Pull Request dans GitHub.
10. Relire avant toute décision de fusion.

## Branches Codex

Le prompt peut demander un nom logique tel que `developeros/build-01-project-core`. Codex peut publier une branche technique préfixée par `codex/`. Cette différence n’est pas bloquante si la Pull Request cible le bon dépôt et `main`, et si son contenu est conforme.

## Échec de publication native

Si le diff existe mais que la publication native échoue :

1. ne pas reconstruire le Build ;
2. conserver la tâche et le diff ;
3. utiliser `Copier git apply` ou `Copier le patch` ;
4. appliquer le patch sur une branche dédiée dans un environnement autorisé ;
5. ouvrir la Pull Request ;
6. classer l’événement comme incident de publication, pas comme échec de construction.

## Critères d’état

- Diff et tests disponibles : `construit`.
- Branche et Pull Request visibles dans GitHub : `publié`.
- Pull Request relue et conforme : `livré`.
- Fusion explicitement décidée : `intégré`.

Aucun résultat local ou temporaire ne doit être présenté comme déjà intégré dans GitHub.