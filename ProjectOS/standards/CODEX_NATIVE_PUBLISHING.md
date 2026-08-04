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
6. les tests prévus sont exécutables ;
7. les fichiers attendus sont inventoriés, les formats binaires sont identifiés et leur stratégie de livraison est choisie avant création.

Codex ne doit pas arrêter une tâche uniquement parce que :

- `git remote -v` est vide ;
- la branche locale s’appelle `work` ;
- `origin/main` n’existe pas dans le sandbox ;
- `gh auth status` échoue ;
- aucun jeton GitHub n’est exposé ;
- `git push --dry-run` est impossible ;
- l’agent ne peut pas inspecter les boutons de l’interface.

## 5. Compatibilité du diff avec la publication native

Le mécanisme natif Codex peut refuser certains fichiers binaires. La compatibilité ne doit jamais être supposée.

Avant création de tout PNG, JPEG, PDF, ZIP, police, vidéo, base, archive, exécutable ou autre format non textuel, choisir l’une des stratégies suivantes :

1. **Génération déterministe**
   - versionner une source textuelle et un script de génération ;
   - générer le binaire pendant l’installation, les tests, le build ou le packaging ;
   - ignorer le fichier généré dans Git ;
   - vérifier sa présence et ses propriétés dans l’artefact final.
2. **Publication Git capable de binaires**
   - conserver le binaire versionné ;
   - choisir dès le départ Working Copy, un client Git authentifié ou un autre canal autorisé capable de le publier ;
   - ne pas attendre la fin de la tâche pour découvrir l’incompatibilité.
3. **Ressource textuelle native**
   - utiliser SVG, JSON, texte ou autre format diffable uniquement lorsqu’il répond réellement au besoin de la plateforme cible.

Il est interdit :

- d’ajouter un binaire au diff natif Codex sans stratégie explicitement choisie ;
- d’encoder arbitrairement un gros binaire en Base64 pour contourner la limitation ;
- de supprimer une ressource requise uniquement pour rendre le diff publiable ;
- de déclarer une tâche publiable sans avoir contrôlé la nature des fichiers.

Modes de livraison reconnus :

- `codex-native-text` : diff textuel seulement ;
- `codex-native-generated-assets` : sources textuelles versionnées et binaires générés ;
- `git-binary-capable` : binaires versionnés et publication par un client Git compatible.

Le mode est choisi au début de la tâche et rappelé dans la réponse finale.

## 6. Contrôle de publiabilité

Avant de déclarer le diff prêt à publier, exécuter :

```bash
git diff --numstat <base>...HEAD
```

Une ligne dont les colonnes d’ajouts et suppressions valent `-` indique généralement un fichier binaire.

Codex doit alors :

- confirmer qu’aucun binaire incompatible ne reste dans un diff `codex-native-*` ;
- ou signaler qu’un canal `git-binary-capable` est requis ;
- ou remplacer le binaire versionné par une génération déterministe validée.

La réponse finale indique obligatoirement :

- les fichiers binaires prévus ou détectés ;
- leur caractère source ou généré ;
- la stratégie retenue ;
- la commande de génération lorsqu’elle existe ;
- le résultat du contrôle ;
- le canal de publication réellement compatible.

## 7. Séquence normale de livraison

1. Damien sélectionne dans Codex le dépôt canonique et `main` comme branche de base.
2. Codex charge ProjectOS et les références du projet.
3. Codex choisit le mode de livraison et traite les ressources binaires avant implémentation.
4. Codex travaille dans le sandbox fourni.
5. Codex crée les fichiers, exécute les contrôles et produit un diff propre.
6. Codex contrôle la publiabilité du diff.
7. Codex termine avec le résumé, les tests, les limites, les ressources binaires, le canal de publication, le titre et le corps proposés pour la Pull Request, ainsi que le nom logique de branche.
8. Damien ouvre le menu GitHub de la tâche et choisit une demande d’extraction ou une ébauche.
9. La branche et la Pull Request sont vérifiées dans GitHub.
10. La Pull Request n’est jamais fusionnée automatiquement.

## 8. Nommage des branches

Le prompt indique le nom logique attendu. L’interface Codex peut créer une branche technique différente, souvent préfixée par `codex/`. Cela n’invalide pas la livraison si la Pull Request cible bien le dépôt et `main`, si le contenu est correct et si la branche reste identifiable.

## 9. Cas réellement bloquants

La tâche s’arrête avant production uniquement si l’un des cas suivants est vérifié :

- le dépôt ou la branche de base affichés ne correspondent pas au projet ;
- les références nécessaires sont absentes ou contradictoires au point d’empêcher l’exécution ;
- le sandbox ne contient aucune copie exploitable ;
- une dépendance indispensable ne peut pas être obtenue ;
- l’agent ne peut pas produire ou conserver un diff ;
- une contrainte de sécurité interdit le travail ;
- un binaire canonique doit être versionné mais aucun canal de publication compatible n’est disponible.

L’absence de credentials Git dans le terminal n’est pas un cas bloquant dans le mode de publication native.

## 10. Échec de publication après la tâche

Distinguer :

- panne du bouton, de la connexion ou de l’intégration ;
- refus du diff en raison d’un type de fichier, notamment binaire.

En cas d’échec :

1. ne pas relancer tout le Build ;
2. conserver la tâche et son diff ;
3. identifier précisément la cause ;
4. si le diff est textuel, utiliser `Copier git apply` ou `Copier le patch` ;
5. si le diff contient un binaire canonique, utiliser un canal `git-binary-capable` ;
6. si le binaire est générable, corriger la stratégie puis republier sans reconstruire le produit ;
7. ouvrir ou mettre à jour la Pull Request ;
8. documenter l’écart comme incident de publication, pas comme échec de construction.

## 11. Sécurité

- Aucun Personal Access Token ne doit être collé dans un prompt.
- Aucun jeton ne doit être commité dans le dépôt.
- Aucun secret ne doit être ajouté dans `.env` ou un handoff.
- La connexion GitHub native de Codex doit être privilégiée lorsque le diff est compatible.
- `main` reste protégée par la règle : branche dédiée, revue, tests, Pull Request, puis fusion explicite.

## 12. Critère de réussite

Une tâche est construite lorsque le diff et les preuves de tests existent.

Elle est publiable lorsque le diff est compatible avec le canal choisi.

Elle est publiée lorsque la branche et la Pull Request sont visibles dans GitHub.

Elle est livrée lorsque la Pull Request a été relue et jugée conforme.

Elle n’est intégrée que lorsque la fusion a été explicitement décidée.
