# Relais Google Drive — installation iPhone

Ce relais contourne l’impossibilité pour Pyto et Raccourcis de conserver un accès direct à un dossier Google Drive.

## Principe

Pyto fabrique d’abord le miroir local vérifié `Current`. `sync_drive.py` compare ensuite son manifeste à celui de Drive, envoie uniquement les fichiers nouveaux ou modifiés, supprime les fichiers devenus absents, puis publie le manifeste en dernier. Une erreur d’envoi interrompt donc la synchronisation avant toute suppression.

## Installation unique

1. Ouvrir `script.google.com` avec le compte propriétaire de `App-perso/ProjectOS-Backups`.
2. Créer un projet, remplacer `Code.gs` par `apps/projectos-backup/apps-script/Code.gs` et reprendre `appsscript.json` dans les paramètres du projet.
3. Dans **Paramètres du projet > Propriétés du script**, ajouter `ROOT_FOLDER_ID` avec l’identifiant du dossier `ProjectOS-Backups`, puis `AUTH_TOKEN` avec un secret aléatoire d’au moins 24 caractères.
4. Déployer comme **Application Web**, exécutée en tant que propriétaire, accessible à **Tout le monde**. Copier l’URL terminée par `/exec`.
5. Dans Pyto, lancer `configure_drive.py`, saisir l’URL puis le même secret. Le secret reste uniquement sur l’iPhone et dans les propriétés privées Apps Script.

## Exécution

Lancer `headless.py`, puis `sync_drive.py`. Le second script renvoie les compteurs `uploaded_files`, `deleted_files`, `unchanged_files` et `verified_files`.

La taille maximale d’un fichier envoyé est fixée à 7 Mio. Un fichier plus grand provoque un échec visible sans suppression distante.

## Raccourci final

1. Action Pyto **Exécuter le script** : `headless.py`.
2. Si la sortie JSON contient `status = complete`, action Pyto **Exécuter le script** : `sync_drive.py`.
3. Afficher une notification avec la sortie du second script.

L’exécution en arrière-plan reste une extension temporaire accordée par iOS, jamais une garantie illimitée. Une relance est sûre et reprend la comparaison depuis le dernier manifeste Drive validé.
