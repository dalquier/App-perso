# ProjectOS Backup — miroir incrémental

Application Pyto locale pour maintenir une copie exacte et vérifiée des dossiers de code choisis sur iPhone.

## Fonctionnement

- les sources sont ajoutées, suspendues ou retirées dans l’application ;
- le dépôt/copie Working Copy `dalquier/Scriptable` reste explicitement exclu ;
- l’application ne demande à iOS le téléchargement que des fichiers nouveaux ou potentiellement modifiés ;
- seuls les fichiers nouveaux ou modifiés sont copiés ;
- les fichiers inchangés restent en place ;
- les fichiers absents d’une source sont supprimés du miroir uniquement après un scan complet réussi ;
- une lecture iCloud impossible annule l’opération et conserve le miroir précédent ;
- `.git`, les caches Python et `.DS_Store` sont exclus ;
- aucune version historique et aucun ZIP ne sont conservés.

La demande de téléchargement iCloud est explicite, mais iOS reste maître de son exécution. La lecture intégrale de chaque fichier modifié constitue la vérification finale : hors ligne, manque d’espace ou erreur fournisseur provoquent un échec sûr.

Le bouton unique `Mettre à jour la sauvegarde` enchaîne le miroir local et sa synchronisation Google Drive. L’interface affiche la phase, le fichier courant, une barre de progression, le compteur et le pourcentage, puis le bilan local et Drive. L’application demande également une extension d’exécution à iOS lorsque l’utilisateur change d’app. Cette extension est temporaire et décidée par iOS : elle améliore les changements d’app courts, mais ne garantit pas une exécution illimitée en arrière-plan. Une expiration conserve le miroir valide et les fichiers déjà copiés et vérifiés dans `Resume/` ; le lancement suivant réutilise ce travail sans relire la source. Les fichiers partiels ne sont jamais repris.

## Installation Pyto

Copier `apps/projectos-backup/` dans le dossier Pyto de l’iPhone puis lancer `run.py`. La configuration existante est conservée.

## ProjectOS Workspace

`iCloud Drive/ProjectOS Workspace` est l’espace de travail local défini par ProjectOS pour les téléchargements, fichiers intermédiaires, échanges et livrables locaux.

ProjectOS Backup ne sauvegarde pas automatiquement cette racine. La configuration recommandée consiste à ajouter séparément, uniquement lorsque nécessaire :

- `ProjectOS Workspace/10_WORK` ;
- `ProjectOS Workspace/30_OUTPUT`.

Ne pas sélectionner la racine `ProjectOS Workspace`, ni sauvegarder par défaut `00_INBOX`, `20_EXCHANGE`, `80_TO_ARCHIVE` ou `90_TRASH_7D`. Les sources dynamiques existantes suffisent : aucune modification du moteur n’est nécessaire.

Références :

- `ProjectOS/standards/WORKSPACE_AND_FILE_LIFECYCLE.md` ;
- `ProjectOS/guides/WORKSPACE_IPHONE.md`.

## Transfert vers Google Drive

Google Drive apparaît dans l’app Fichiers mais ne permet pas à Pyto de sélectionner durablement un dossier fournisseur. La destination Drive n’est donc jamais configurée dans l’interface Pyto.

Le transfert passe par un relais Google Apps Script : Pyto regroupe jusqu’à 20 petits fichiers par requête, envoie uniquement les fichiers nouveaux ou modifiés, applique ensuite les suppressions, puis publie `MANIFEST.json` en dernier. Après finalisation, le manifeste Drive complet est relu et comparé au manifeste local. Un ancien déploiement Apps Script reste compatible grâce au repli automatique vers les actions unitaires. Le secret d’accès reste hors de GitHub. Installation : `ProjectOS/projects/ProjectOSBackup/guides/GOOGLE_APPS_SCRIPT_SETUP.md`.

## Sortie

`Current/<nom-source>/...` est le miroir courant. `Current/MANIFEST.json` contient l’inventaire, tailles, dates et SHA-256. `Transaction/` sert au staging et au rollback. `Resume/` conserve temporairement les fichiers validés d’une exécution interrompue et disparaît après succès.

Au premier succès, les anciens ZIP de BUILD-01 sont supprimés après staging réussi.

## Automatisation

`headless.py` imprime `current_path`, `manifest_path`, `copied_files`, `deleted_files`, `unchanged_files` et `requested_downloads` et `resumed_files`. `sync_drive.py` reproduit ce miroir sur Drive, sans ZIP, et imprime `uploaded_files`, `deleted_files`, `unchanged_files` et `verified_files`.

## Tests

`python -m unittest discover apps/projectos-backup/tests`

`python -m compileall apps/projectos-backup`
