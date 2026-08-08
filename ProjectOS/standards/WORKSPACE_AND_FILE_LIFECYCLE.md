# ProjectOS — Workspace et cycle de vie des fichiers

## 1. Objet

Ce standard définit un espace de travail iPhone/iCloud unique pour recevoir, manipuler et classer les fichiers qui ne sont pas encore dans leur destination canonique.

Il évite trois problèmes : fichiers éparpillés dans Téléchargements ou les conteneurs d’apps, copies temporaires confondues avec des sources de vérité, et accumulation de fichiers devenus inutiles.

## 2. Principe directeur

> GitHub conserve le versionnable canonique, Google Drive conserve les archives et sauvegardes privées, Replit exécute, et `iCloud Drive/ProjectOS Workspace` sert uniquement d’espace de travail local et temporaire.

Le Workspace est pratique et remplaçable. Il ne devient jamais une seconde source de vérité.

## 3. Emplacement canonique du Workspace

```text
iCloud Drive/
└── ProjectOS Workspace/
    ├── 00_INBOX/
    ├── 10_WORK/
    │   ├── ProjectOS/
    │   ├── DeveloperOS/
    │   ├── Equilibre/
    │   ├── ProjectOSBackup/
    │   └── Autres/
    ├── 20_EXCHANGE/
    ├── 30_OUTPUT/
    │   ├── ProjectOS/
    │   ├── DeveloperOS/
    │   ├── Equilibre/
    │   ├── ProjectOSBackup/
    │   └── Autres/
    ├── 80_TO_ARCHIVE/
    └── 90_TRASH_7D/
```

Les nouveaux projets peuvent ajouter un sous-dossier dans `10_WORK` et `30_OUTPUT` sans modifier ce standard.

## 4. Rôle des zones

### `00_INBOX`

Point d’entrée par défaut des téléchargements Safari et des fichiers reçus sans destination décidée.

- tri attendu : dans les 7 jours ;
- aucune suppression automatique ;
- aucun traitement métier durable ne doit dépendre d’un fichier restant ici.

### `10_WORK`

Fichiers de travail temporaires réellement utilisés dans un projet : brouillons, données de test locales, documents intermédiaires, fichiers à inspecter ou transformer.

- conservation : tant que le travail est actif ;
- aucune suppression automatique ;
- le résultat durable doit ensuite rejoindre GitHub, Drive ou la destination canonique du projet ;
- cette zone peut être ajoutée comme source à ProjectOS Backup.

### `20_EXCHANGE`

Transit entre ChatGPT, Codex, Pyto, Working Copy, Raccourcis, Replit ou une autre application.

Exemples : patch, ZIP d’installation, export temporaire, fichier à importer dans un autre outil.

- durée cible : moins de 14 jours ;
- aucun fichier unique durable ne doit y rester ;
- les éléments âgés de plus de 14 jours peuvent être déplacés vers `90_TRASH_7D` après confirmation ;
- cette zone n’est pas sauvegardée par défaut.

### `30_OUTPUT`

Livrables générés et terminés localement mais pas encore classés dans leur destination définitive : PDF, DOCX, rapports, exports, images, ZIP, fichiers produits par ChatGPT ou Pyto.

- revue attendue : dans les 30 jours ;
- aucune suppression automatique ;
- cette zone peut être ajoutée comme source à ProjectOS Backup tant que le fichier n’a pas rejoint sa destination durable.

### `80_TO_ARCHIVE`

File d’attente explicite pour les éléments qui doivent être conservés sur Google Drive ou une autre archive privée.

- un fichier n’est retiré qu’après vérification de sa copie dans la destination d’archive ;
- cette zone doit rester courte et visible ;
- elle n’est pas sauvegardée par défaut afin d’éviter une archive de l’archive.

### `90_TRASH_7D`

Zone de quarantaine avant suppression définitive.

- un fichier n’y est placé que lorsqu’il n’est plus utile ;
- suppression autorisée après 7 jours ;
- pendant la phase d’adoption du Workspace, demander confirmation avant toute suppression ;
- cette zone n’est jamais sauvegardée.

## 5. Règle de routage d’un fichier

Lorsqu’un fichier est reçu ou créé, le classer selon l’intention :

- destination inconnue ou téléchargement brut → `00_INBOX` ;
- travail actif → `10_WORK/<Projet>` ;
- transit vers un autre outil → `20_EXCHANGE` ;
- livrable produit localement → `30_OUTPUT/<Projet>` ;
- conservation privée décidée → `80_TO_ARCHIVE` jusqu’à preuve d’archivage ;
- suppression différée → `90_TRASH_7D`.

Si le fichier est déjà canonique dans GitHub ou définitivement archivé dans Drive, ne pas créer une copie permanente supplémentaire dans le Workspace.

## 6. Règles de nommage

Pour un nouveau fichier sans nom métier imposé, utiliser :

```text
YYYY-MM-DD__projet__objet.ext
```

Exemples :

```text
2026-08-08__equilibre__audit-runtime.md
2026-08-08__projectos__workspace-spec.pdf
2026-08-08__developeros__qa-report__v02.md
```

Règles :

- projet en minuscules et nom court lorsque possible ;
- objet descriptif sans caractères fragiles ;
- suffixe `__v02`, `__v03` uniquement lorsqu’il existe réellement plusieurs variantes utiles ;
- conserver le nom original lorsqu’il porte une identité externe importante ou qu’un outil en dépend ;
- éviter les données personnelles ou sensibles dans un nom de fichier destiné à être partagé.

## 7. Source de vérité et promotion

Le passage par le Workspace ne rend jamais un fichier canonique.

### Promotion vers GitHub

Utiliser GitHub pour : code, scripts, règles, ADR, manifests, documentation versionnée, configurations non secrètes et tests.

La promotion se fait par la branche/PR normale du projet ; ne pas copier manuellement un dossier de code entier depuis le Workspace vers `main`.

### Promotion vers Google Drive

Utiliser Drive pour : archives privées, sauvegardes, documents collaboratifs, corpus non versionnables, exports définitifs et fichiers volumineux destinés à être conservés.

Vérifier l’existence de la copie avant de retirer l’élément de `80_TO_ARCHIVE`.

## 8. Intégration ProjectOS Backup

ProjectOS Backup reste une sauvegarde de récupération, pas une archive du Workspace entier.

Configuration recommandée :

- ajouter `ProjectOS Workspace/10_WORK` comme source si des fichiers de travail uniques doivent être protégés ;
- ajouter `ProjectOS Workspace/30_OUTPUT` comme source si des livrables locaux attendent encore leur classement définitif ;
- ne pas ajouter `00_INBOX`, `20_EXCHANGE`, `80_TO_ARCHIVE` ou `90_TRASH_7D` par défaut ;
- ne jamais sauvegarder un dossier `.git` ou utiliser le Workspace pour dupliquer la copie Working Copy canonique.

Une fois un fichier promu vers GitHub ou archivé et vérifié dans Drive, sa copie Workspace peut être supprimée selon son cycle de vie.

## 9. Fichiers créés par ChatGPT, Codex ou un outil ProjectOS

Avant de produire un fichier, déterminer son statut : canonique, livrable final, échange temporaire ou brouillon.

- code substantiel → GitHub/PR ;
- fichier final téléchargeable sans destination canonique immédiate → `30_OUTPUT/<Projet>` après téléchargement ;
- fichier destiné uniquement à être réimporté dans un autre outil → `20_EXCHANGE` ;
- fichier reçu mais non classé → `00_INBOX`.

Lorsque la plateforme ne peut pas écrire directement dans iCloud Drive, elle livre le fichier par son canal disponible et indique la destination Workspace recommandée. L’absence d’accès direct à iCloud ne doit pas conduire à inventer un chemin ou prétendre que le fichier y a été copié.

## 10. Nettoyage

Le nettoyage est conservateur :

- `00_INBOX` > 7 jours : signaler, ne pas supprimer ;
- `20_EXCHANGE` > 14 jours : proposer le déplacement vers `90_TRASH_7D` ;
- `30_OUTPUT` > 30 jours : signaler pour classement, ne pas supprimer ;
- `80_TO_ARCHIVE` non vide : signaler qu’un archivage reste à terminer ;
- `90_TRASH_7D` > 7 jours : suppression possible après confirmation.

Ne jamais automatiser la suppression de `10_WORK`, `30_OUTPUT` ou `80_TO_ARCHIVE`.

## 11. Sécurité et confidentialité

- ne jamais placer de secret, token, mot de passe ou clé API dans un fichier destiné à GitHub ;
- le Workspace iCloud peut contenir temporairement des fichiers privés, mais ceux-ci ne doivent pas être envoyés vers une destination externe sans décision explicite ;
- une sauvegarde ProjectOS Backup vers Drive doit respecter le périmètre de données choisi ;
- avant partage, vérifier le nom du fichier, son contenu et sa destination ;
- ne pas utiliser `90_TRASH_7D` comme substitut à la suppression sécurisée d’un secret exposé : révoquer d’abord le secret concerné.

## 12. Raccourcis iPhone de référence

Deux Raccourcis constituent l’interface minimale :

1. `Ranger dans ProjectOS` : reçoit ou sélectionne un fichier, choisit son rôle et éventuellement son projet, puis le déplace dans la zone correcte ;
2. `Nettoyer Workspace` : identifie les éléments anciens, ne supprime automatiquement aucune zone de travail et demande confirmation avant la purge de `90_TRASH_7D`.

La procédure détaillée est versionnée dans `ProjectOS/guides/WORKSPACE_IPHONE.md`.

## 13. Critère de conformité

Le Workspace est conforme lorsque :

- les téléchargements arrivent dans `00_INBOX` ;
- chaque fichier de travail possède une zone compréhensible ;
- aucun code durable n’existe uniquement dans le Workspace ;
- les fichiers temporaires ne polluent pas Working Copy ou GitHub ;
- les sources ProjectOS Backup excluent les zones jetables ;
- la suppression reste réversible pendant au moins 7 jours via `90_TRASH_7D` ;
- le passage vers GitHub ou Drive est explicite et vérifié.
