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

Le bouton `Mettre à jour la sauvegarde` commence par un prévol Google Drive non destructif : réveil du relais, vérification signée de l'accès au dossier, puis lecture de l'index distant. Les pannes temporaires sont retentées trois fois avant toute copie ou mutation. Le bouton `Tester Google Drive` exécute uniquement ce prévol et fournit un diagnostic copiable sans secret. L’interface distingue toujours `Miroir local sécurisé`, `Drive en cours` et `Sauvegarde complète et vérifiée`. Elle affiche la phase, le fichier ou lot courant, une progression réelle et conserve une synthèse finale : ajouts, modifications, suppressions, éléments inchangés, reprises, durées et total vérifié. Un bouton `Fermer` reste disponible.

L’application demande une extension d’exécution à iOS lorsque l’utilisateur change d’app. Cette extension est temporaire et décidée par iOS : elle ne garantit pas une exécution illimitée en arrière-plan. Une interruption conserve le miroir valide, le cache `Resume/` et la file Drive persistante. Le lancement suivant réutilise le travail local validé et reprend uniquement les opérations Drive non confirmées. Les fichiers partiels ne sont jamais repris.

## Installation Pyto

Copier `apps/projectos-backup/` dans le dossier Pyto de l’iPhone puis lancer `run.py`. La configuration existante est conservée.

## Transfert vers Google Drive

Google Drive apparaît dans l’app Fichiers mais ne permet pas à Pyto de sélectionner durablement un dossier fournisseur. La destination Drive n’est donc jamais configurée dans l’interface Pyto.

Le transfert passe par un relais Google Apps Script : Pyto vérifie d'abord la disponibilité du service et de `ROOT_FOLDER_ID`, sans créer ni supprimer de fichier. Il ouvre ou reprend ensuite une session persistante, puis envoie uniquement les fichiers nouveaux ou modifiés. Les lots démarrent à quatre fichiers maximum et environ 1 Mio maximum ; un lot lent est réduit automatiquement jusqu'à un fichier. Après timeout ou reprise, Pyto consulte d'abord l'état distant afin de ne pas renvoyer une opération déjà confirmée. Les suppressions sont appliquées ensuite et `MANIFEST.json` est publié en dernier. Après finalisation, le manifeste Drive complet est relu et comparé au manifeste local. Le secret d’accès reste hors de GitHub. Installation : `ProjectOS/projects/ProjectOSBackup/guides/GOOGLE_APPS_SCRIPT_SETUP.md`.

## Sortie

`Current/<nom-source>/...` est le miroir courant. `Current/MANIFEST.json` contient l’inventaire, tailles, dates et SHA-256. `Transaction/` sert au staging et au rollback. `Resume/` conserve temporairement les fichiers locaux validés d’une exécution interrompue et disparaît après succès. L'état v0.4 conserve séparément la session et la file Drive jusqu'à vérification complète.

Au premier succès, les anciens ZIP de BUILD-01 sont supprimés après staging réussi.

## Automatisation

`headless.py` imprime `current_path`, `manifest_path`, `copied_files`, `deleted_files`, `unchanged_files`, `requested_downloads` et `resumed_files`. `sync_drive.py` reproduit ce miroir sur Drive, sans ZIP, et expose la session, la phase, les compteurs confirmés et le statut final. Une sortie interrompue doit rester `drive_pending`, jamais être présentée comme une sauvegarde Drive complète.

## Tests

`python -m unittest discover apps/projectos-backup/tests`

`python -m compileall apps/projectos-backup`

La recette iPhone v0.4 est décrite dans `ProjectOS/projects/ProjectOSBackup/docs/QA_V04_IPHONE.md`.
