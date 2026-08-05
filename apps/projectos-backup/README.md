# ProjectOS Backup — miroir incrémental

Application Pyto locale pour maintenir une copie exacte et vérifiée des dossiers de code choisis sur iPhone.

## Fonctionnement

- les sources sont ajoutées, suspendues ou retirées dans l’application ;
- le dépôt/copie Working Copy `dalquier/Scriptable` reste explicitement exclu ;
- avant la lecture, l’application demande à iOS le téléchargement des éléments iCloud évincés ;
- seuls les fichiers nouveaux ou modifiés sont copiés ;
- les fichiers inchangés restent en place ;
- les fichiers absents d’une source sont supprimés du miroir uniquement après un scan complet réussi ;
- une lecture iCloud impossible annule l’opération et conserve le miroir précédent ;
- `.git`, les caches Python et `.DS_Store` sont exclus ;
- aucune version historique et aucun ZIP ne sont conservés.

La demande de téléchargement iCloud est explicite, mais iOS reste maître de son exécution. La lecture intégrale de chaque fichier modifié constitue la vérification finale : hors ligne, manque d’espace ou erreur fournisseur provoquent un échec sûr.

## Installation Pyto

Copier `apps/projectos-backup/` dans le dossier Pyto de l’iPhone puis lancer `run.py`. La configuration existante est conservée.

## Sortie

`Current/<nom-source>/...` est le miroir courant. `Current/MANIFEST.json` contient l’inventaire, tailles, dates et SHA-256. `Transaction/` ne sert qu’au staging et au rollback.

Au premier succès, les anciens ZIP de BUILD-01 sont supprimés après staging réussi.

## Automatisation

`headless.py` imprime `current_path`, `manifest_path`, `copied_files`, `deleted_files`, `unchanged_files` et `requested_downloads`. Le futur Raccourci Drive devra reproduire le même miroir, sans ZIP.

## Tests

`python -m unittest discover apps/projectos-backup/tests`

`python -m compileall apps/projectos-backup`
