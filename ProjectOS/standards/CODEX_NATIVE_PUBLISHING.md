# ProjectOS — Publication native Codex vers GitHub

## 1. Objet

Ce standard définit le fonctionnement permanent des tâches Codex Cloud reliées à un dépôt GitHub. Il complète obligatoirement `ARTIFACT_DELIVERY_AND_RECOVERY.md`.

Il distingue :

- le sandbox terminal dans lequel Codex produit les modifications ;
- le dépôt et la branche de base sélectionnés dans l’interface Codex ;
- le mécanisme natif de publication après production du diff ;
- les canaux de récupération à utiliser si cette publication échoue.

## 2. Règle de confiance de l’environnement

Lorsque l’interface Codex indique explicitement le dépôt canonique et la branche de base attendue, l’agent considère que la tâche est reliée à cet environnement GitHub.

Exemple :

```text
Repository: dalquier/App-perso
Base branch: main
```

Le sandbox peut présenter une branche locale `work`, aucun `origin`, aucun upstream, aucun jeton et une commande `gh auth status` non authentifiée. Ces éléments ne bloquent pas le mode `codex-native` lorsque l’environnement affiché est correct.

Ils interdisent en revanche de prétendre qu’un `git push` terminal direct est possible.

## 3. Delivery Preflight Codex

Avant toute modification, Codex applique `ARTIFACT_DELIVERY_AND_RECOVERY.md` et consigne :

- dépôt et branche de base affichés par l’interface ;
- SHA ou état de départ vérifiable ;
- périmètre autorisé ;
- nature textuelle ou binaire des fichiers prévus ;
- mode de livraison principal ;
- plan de récupération ;
- preuve externe attendue après la tâche.

Le mode principal est généralement :

- `codex-native-text` pour un diff textuel ;
- `codex-native-generated-assets` pour des sources textuelles et des binaires générés ;
- `git-binary-capable` lorsqu’un binaire canonique doit être versionné.

Le plan de récupération doit être défini avant le travail. Il ne doit pas reposer uniquement sur `/tmp`.

## 4. Instructions obligatoires dans les prompts Codex

```text
L’environnement Codex est relié au dépôt GitHub indiqué et à la branche de base indiquée.

Travaille dans le sandbox fourni par Codex.
Ne lance pas gh auth login.
Ne tente pas de git push depuis le terminal si aucun accès direct n’est disponible.
Ne considère pas l’absence de remote origin, d’upstream, de origin/main ou de credentials Git dans le terminal comme bloquante pour la publication native.
Produis les modifications, exécute les tests et prépare un diff propre.
La publication sera réalisée avec le mécanisme natif de Codex si le diff est compatible.
Avant toute modification, applique le Delivery Preflight de ProjectOS/standards/ARTIFACT_DELIVERY_AND_RECOVERY.md.
Prévois un patch exportable hors de /tmp en cas d’échec de publication.
Ne modifie jamais directement main.
Ne fusionne jamais la Pull Request sans instruction explicite.
```

## 5. Précontrôle utile dans le sandbox

Codex vérifie :

1. la présence des références ProjectOS et du projet ;
2. la cohérence avec le dépôt et la branche de base affichés ;
3. l’état initial du worktree ;
4. le périmètre de fichiers ;
5. la disponibilité des dépendances et tests ;
6. la nature des fichiers prévus ;
7. la possibilité de produire et conserver un diff ;
8. la disponibilité d’un emplacement exportable ou d’un secours base64 si la publication native échoue.

Codex ne s’arrête pas uniquement parce que le terminal ne possède ni remote, ni token, ni `gh` authentifié. Il doit toutefois signaler honnêtement que la preuve de publication ne pourra être obtenue qu’après l’action native.

## 6. Ressources binaires

Avant création de tout PNG, JPEG, PDF, ZIP, police, vidéo, base, archive, exécutable ou format non textuel, choisir :

1. **Génération déterministe** : source textuelle versionnée, script de génération, binaire ignoré par Git et vérifié dans l’artefact final.
2. **Canal Git compatible avec les binaires** : Working Copy, Replit authentifié ou autre client autorisé.
3. **Ressource textuelle native** : SVG, JSON ou texte seulement lorsque cela répond réellement au besoin.

Il est interdit d’encoder arbitrairement un gros binaire en base64 pour contourner une limitation de publication. Le base64 est réservé à la récupération exceptionnelle d’un artefact déjà produit.

## 7. Contrôle du diff

Ordre recommandé :

1. `git diff --numstat <base>...HEAD` si une base fiable existe ;
2. sinon `git diff --numstat` et `git diff --cached --numstat` ;
3. inventaire des extensions ;
4. `git check-attr diff -- <fichiers>` si la nature reste ambiguë.

Une ligne `- -` dans `--numstat` indique généralement un binaire.

La réponse finale distingue :

- fichiers textuels ;
- fichiers binaires sources ;
- fichiers générés ;
- canal compatible ;
- limites du contrôle.

## 8. Séquence normale

1. Sélectionner le dépôt canonique et la branche de base dans Codex.
2. Charger ProjectOS.
3. Exécuter le Delivery Preflight.
4. Choisir le mode de livraison et le plan de récupération.
5. Produire le diff et les validations.
6. Contrôler la publiabilité.
7. Fournir le titre, le corps et le nom logique de branche proposés.
8. Publier via l’interface native Codex.
9. Vérifier dans GitHub la branche, le SHA et la Pull Request.
10. Conserver la PR en Draft sauf instruction contraire.
11. Ne jamais fusionner automatiquement.

## 9. Nommage des branches

Le prompt peut indiquer un nom logique. L’interface Codex peut créer un nom technique préfixé par `codex/`. Ce nom est acceptable si la PR cible le bon dépôt et la bonne base, et si son lien avec la tâche est vérifiable.

## 10. Cas réellement bloquants

Arrêter avant modification si :

- le dépôt ou la branche de base affichés sont incorrects ;
- les références indispensables sont absentes ou contradictoires ;
- aucun diff ne peut être produit ou conservé ;
- une dépendance indispensable est inaccessible ;
- une contrainte de sécurité interdit le travail ;
- un binaire canonique doit être versionné sans canal compatible ;
- ni publication native, ni export de fichier, ni récupération base64 ne sont raisonnablement disponibles.

## 11. Échec de publication après la tâche

En cas d’échec :

1. ne pas reconstruire le Build ;
2. conserver le commit et le diff ;
3. identifier l’échec : intégration, connexion, bouton, type de fichier ou permission ;
4. générer immédiatement un patch, un ZIP et un manifeste dans un emplacement exportable tel que `/mnt/data/projectos-delivery/` ;
5. calculer les SHA-256 ;
6. vérifier que les fichiers sont réellement téléchargeables ;
7. si l’interface n’expose aucun fichier, compresser et transférer le patch selon `base64-recovery` ;
8. reconstruire et vérifier l’empreinte dans un environnement extérieur ;
9. appliquer le patch dans un client Git authentifié ;
10. relancer les validations essentielles ;
11. mettre à jour la branche et la PR prévues.

Il est interdit de terminer avec :

- un fichier uniquement sous `/tmp` ;
- un champ de lien vide ;
- une affirmation de publication sans SHA distant ;
- une demande de recommencer l’implémentation alors que le diff existe encore.

## 12. Sécurité

- Aucun Personal Access Token dans un prompt ou une conversation.
- Aucun secret commité.
- Aucun jeton dans `.env`, un patch, un manifeste ou un handoff.
- Privilégier la connexion native Codex lorsque le diff est compatible.
- Protéger `main` par branche, tests, revue et fusion explicite.

## 13. États et critères de réussite

- **Construit** : diff et validations disponibles.
- **Exporté** : artefact récupéré hors du sandbox.
- **Publié** : branche et Pull Request visibles dans GitHub, SHA vérifié.
- **Livré** : résultat relu et jugé conforme.
- **Intégré** : fusion explicitement décidée et vérifiée.

Une tâche Codex ne doit jamais utiliser ces états comme synonymes.
