# ProjectOS — Publication native Codex vers GitHub

## 1. Objet

Ce standard définit le fonctionnement permanent des tâches Codex exécutées dans un environnement Codex Cloud relié à un dépôt GitHub.

Il évite les faux blocages provoqués par la confusion entre :

- le sandbox terminal isolé dans lequel Codex produit les modifications ;
- l’environnement GitHub sélectionné dans l’interface Codex ;
- le mécanisme natif de publication de branche et de Pull Request disponible après création d’un diff.

## 2. Règle de confiance de l’environnement

Lorsque l’interface Codex indique explicitement le dépôt canonique et la branche de base attendue, l’agent considère que la tâche est reliée à cet environnement GitHub.

Exemple valide :

```text
Repository: dalquier/App-perso
Base branch: main
```

Le sandbox peut néanmoins présenter :

- une branche locale nommée `work` ;
- aucun remote `origin` ;
- aucun upstream Git ;
- aucune variable `GH_TOKEN` ou `GITHUB_TOKEN` ;
- une commande `gh auth status` non authentifiée ;
- aucune commande native `make_pr` exposée au terminal.

Ces éléments ne constituent pas un blocage lorsque la publication doit être réalisée après la tâche par le bouton GitHub de l’interface Codex.

## 3. Instructions obligatoires dans les prompts Codex

Tout prompt destiné à un environnement Codex Cloud relié au dépôt doit inclure ou appliquer les règles suivantes :

```text
L’environnement Codex est relié au dépôt GitHub indiqué et à la branche de base indiquée.

Travaille dans le sandbox fourni par Codex.
Ne vérifie pas GH_TOKEN ou GITHUB_TOKEN.
Ne lance pas gh auth login.
Ne tente pas de git push depuis le terminal.
Ne considère pas l’absence de remote origin, d’upstream ou de credentials Git dans le terminal comme bloquante.
Ne demande pas au sandbox de prouver que les boutons de publication de l’interface existent.
Produis les modifications, exécute les tests et prépare un diff propre.
La publication de la branche et de la Pull Request sera réalisée avec le mécanisme natif de Codex après la tâche.
Ne modifie jamais directement main.
Ne fusionne jamais la Pull Request sans instruction explicite.
```

## 4. Précontrôle adapté à Codex Cloud

Avant de modifier le code, Codex vérifie uniquement ce qu’il peut vérifier utilement dans le sandbox :

1. le projet et les références ProjectOS sont présents ;
2. la copie de travail correspond au dépôt et à la branche de base affichés par l’environnement ;
3. l’arbre de travail initial est propre ou les changements préexistants sont identifiés ;
4. le périmètre de fichiers autorisé est compris ;
5. les dépendances nécessaires peuvent être installées ou sont disponibles ;
6. les tests prévus sont exécutables.

Codex ne doit pas arrêter une tâche uniquement parce que :

- `git remote -v` est vide ;
- la branche locale s’appelle `work` ;
- `origin/main` n’existe pas dans le sandbox ;
- `gh auth status` échoue ;
- aucun jeton GitHub n’est exposé ;
- `git push --dry-run` est impossible ;
- l’agent ne peut pas inspecter les boutons de l’interface.

## 5. Séquence normale de livraison

1. Damien sélectionne dans Codex le dépôt canonique et `main` comme branche de base.
2. Codex charge ProjectOS et les références du projet.
3. Codex travaille dans le sandbox fourni.
4. Codex crée les fichiers, exécute les contrôles et produit un diff propre.
5. Codex termine avec :
   - le résumé des modifications ;
   - les tests réellement exécutés ;
   - les limites restantes ;
   - le titre et le corps proposés pour la Pull Request ;
   - le nom logique de branche demandé.
6. Damien ouvre le menu GitHub de la tâche et choisit :
   - `Créer une demande d’extraction` pour une livraison prête à relire ;
   - `Créer une ébauche de demande d’extraction` pour une livraison encore en validation.
7. La branche et la Pull Request sont vérifiées dans GitHub.
8. La Pull Request n’est jamais fusionnée automatiquement.

## 6. Nommage des branches

Le prompt indique le nom logique attendu, par exemple :

```text
developeros/build-01-project-core
```

L’interface Codex peut créer une branche technique différente, souvent préfixée par `codex/`. Cela n’invalide pas la livraison si :

- la Pull Request cible bien le dépôt et `main` ;
- le contenu et le périmètre sont corrects ;
- la branche est identifiable et liée à la tâche ;
- la Pull Request est vérifiable dans GitHub.

Le nom exact de branche ne doit donc pas provoquer l’arrêt du Build avant production du diff.

## 7. Cas réellement bloquants

La tâche s’arrête avant production uniquement si l’un des cas suivants est vérifié :

- le dépôt ou la branche de base affichés par l’environnement ne correspondent pas au projet ;
- les références ProjectOS nécessaires sont absentes ou incohérentes au point d’empêcher l’exécution ;
- le sandbox ne contient pas les fichiers attendus et aucune copie exploitable n’est disponible ;
- une dépendance indispensable ne peut pas être obtenue ;
- l’agent ne peut pas produire ou conserver un diff ;
- une contrainte de sécurité interdit le travail.

L’absence de credentials Git dans le terminal n’est pas un cas bloquant dans le mode de publication native.

## 8. Échec de publication après la tâche

Si le bouton natif de publication est absent ou échoue après création du diff :

1. ne pas relancer tout le Build ;
2. conserver la tâche et son diff ;
3. utiliser en priorité `Copier git apply` ou `Copier le patch` ;
4. appliquer le patch sur une branche dédiée avec Working Copy, ChatGPT ou un autre environnement autorisé ;
5. ouvrir la Pull Request ;
6. documenter l’écart comme incident de publication, pas comme échec de construction.

## 9. Sécurité

- Aucun Personal Access Token ne doit être collé dans un prompt.
- Aucun jeton ne doit être commité dans le dépôt.
- Aucun secret ne doit être ajouté dans `.env` ou un handoff.
- La connexion GitHub native de Codex doit être privilégiée.
- `main` reste protégée par la règle : branche dédiée, revue, tests, Pull Request, puis fusion explicite.

## 10. Critère de réussite

Une tâche Codex est construite lorsque le diff et les preuves de tests existent.

Elle est publiée lorsque la branche et la Pull Request sont visibles dans GitHub.

Elle est livrée lorsque la Pull Request a été relue et jugée conforme.

Elle n’est intégrée que lorsque la fusion a été explicitement décidée.
