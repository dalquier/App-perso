# Relais Google Drive — installation iPhone

Ce relais contourne l’impossibilité pour Pyto et Raccourcis de conserver un accès direct à un dossier Google Drive.

## Principe

Pyto fabrique d’abord le miroir local vérifié `Current`. `sync_drive.py` ouvre ou reprend ensuite une session persistante, compare les manifestes, envoie uniquement les fichiers nouveaux ou modifiés par petits lots adaptatifs, puis applique les suppressions et publie le manifeste en dernier. Après timeout, il vérifie l'état de la session avant tout renvoi.

## Installation unique

1. Ouvrir `script.google.com` avec le compte propriétaire de `App-perso/ProjectOS-Backups`.
2. Créer un projet, remplacer `Code.gs` par `apps/projectos-backup/apps-script/Code.gs` et reprendre `appsscript.json` dans les paramètres du projet.
3. Dans **Paramètres du projet > Propriétés du script**, ajouter `ROOT_FOLDER_ID` avec l’identifiant du dossier `ProjectOS-Backups`, puis `AUTH_TOKEN` avec un secret aléatoire d’au moins 24 caractères.
4. Déployer comme **Application Web**, exécutée en tant que propriétaire, accessible à **Tout le monde**. Copier l’URL terminée par `/exec`.
5. Dans Pyto, lancer `configure_drive.py`, saisir l’URL puis le même secret. Le secret reste uniquement sur l’iPhone et dans les propriétés privées Apps Script.

## Mise à jour vers la v0.4

Après avoir copié la nouvelle version dans Pyto :

1. remplacer `Code.gs` dans le projet Apps Script existant ;
2. créer une nouvelle version du déploiement Web existant ;
3. conserver l'URL `/exec`, `ROOT_FOLDER_ID` et `AUTH_TOKEN` ;
4. ouvrir l'URL `/exec` dans Safari et vérifier `protocol: 2` dans la réponse JSON ;
5. lancer `configure_drive.py`, puis le bouton `Tester Google Drive` et la recette `ProjectOS/projects/ProjectOSBackup/docs/QA_V04_IPHONE.md`.

Ne créez pas un second déploiement si l'ancien peut être modifié : conserver l'URL évite de reconfigurer Pyto.

Le prévol effectue uniquement des lectures : réveil public, contrôle signé `health`, puis lecture signée de `MANIFEST.json`. Il accepte l'absence de manifeste lors de la toute première sauvegarde. Après trois échecs temporaires, la sauvegarde reste arrêtée avant toute copie ou suppression et l'interface propose un diagnostic expurgé.

## Exécution

Lancer `headless.py`, puis `sync_drive.py`. Le second script renvoie les compteurs `uploaded_files`, `deleted_files`, `unchanged_files` et `verified_files`.

La taille maximale d’un fichier envoyé reste fixée à 7 Mio. Un fichier plus grand provoque un échec visible sans suppression distante. Les lots courants sont volontairement plus petits ; cette limite par fichier n'est pas une taille de lot recommandée.

## Raccourci final

1. Action Pyto **Exécuter le script** : `headless.py`.
2. Si la sortie JSON contient `status = complete`, action Pyto **Exécuter le script** : `sync_drive.py`.
3. Afficher une notification avec la sortie du second script.

L’exécution en arrière-plan reste une extension temporaire accordée par iOS, jamais une garantie illimitée. Une relance reprend la session persistante et vérifie les confirmations distantes avant de renvoyer. Pour la première sauvegarde, garder Pyto au premier plan et brancher l'iPhone.
