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
- `.git`, les caches Python et `.DS_Store` sont exclus par défaut ;
- les exclusions de dossiers, fichiers et extensions sont modifiables individuellement depuis **Paramètres > Exclusions** ; aucune extension n'est exclue par défaut ;
- aucune version historique et aucun ZIP ne sont conservés.

La demande de téléchargement iCloud est explicite, mais iOS reste maître de son exécution. La lecture intégrale de chaque fichier modifié constitue la vérification finale : hors ligne, manque d’espace ou erreur fournisseur provoquent un échec sûr.

Le bouton `Mettre à jour la sauvegarde` sécurise d'abord le miroir local, puis exécute un prévol Google Drive frais juste avant le transfert : réveil du relais, vérification signée de l'accès au dossier, puis lecture de l'index distant. Une session Drive déjà en attente est reprise avant le nouveau miroir. **Paramètres > Google Drive** exécute uniquement le prévol et fournit, en cas d'échec, un diagnostic technique copiable sans secret. L’interface distingue toujours `Miroir local sécurisé`, `Drive en cours` et `Sauvegarde complète et vérifiée`. La barre représente exclusivement la phase nommée et utilise le même compteur que le texte affiché ; le pipeline Local/Drive porte l'état global. L'interface conserve une synthèse finale compacte : ajouts, suppressions, éléments inchangés, reprises et total vérifié.

L'écran principal ne contient que l'état, la phase courante, les sources et l'action de sauvegarde. La destination locale, les sources, les exclusions, le test Drive et les archives se trouvent dans la feuille **Paramètres**. Les exclusions sont des lignes indépendantes : ajout court, suppression par balayage et normalisation automatique des extensions.

Le miroir local réutilise un fichier lorsque source, chemin, taille et date de modification concordent avec le manifeste valide. Drive compare ensuite le SHA-256 : un contenu déjà identique n'est pas renvoyé, même si sa date a changé. Chaque source conserve son propre dossier, ce qui empêche deux fichiers homonymes provenant de sources différentes de s'écraser.

L’application demande une extension d’exécution à iOS lorsque l’utilisateur change d’app. Cette extension est temporaire et décidée par iOS : elle ne garantit pas une exécution illimitée en arrière-plan. Une interruption conserve le miroir valide, le cache `Resume/` et la file Drive persistante. Le lancement suivant réutilise le travail local validé et reprend uniquement les opérations Drive non confirmées. Les fichiers partiels ne sont jamais repris.

## Tampon des conversations

La destination contient aussi `ConversationBuffer/Inbox`. Un paquet Codex ou ChatGPT complet déposé dans ce dossier doit contenir `conversation.jsonl` ou `conversation.md` et ses pièces jointes. Au prochain lancement, l’application le capture atomiquement, vérifie tous ses SHA-256 et l’envoie vers `ConversationArchives/<archiveId>` sur Drive. Un transfert interrompu reprend les reçus confirmés sans renvoyer deux fois les mêmes fichiers. Rien n’est supprimé du tampon avant preuve distante ; après vérification, la copie iCloud reste 30 jours. Les archives sont append-only et ne sont pas mélangées au miroir `Current`.

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

`PYTHONPATH=apps/projectos-backup python -m unittest discover -s apps/projectos-backup/tests`

`python -m compileall apps/projectos-backup`

La recette iPhone v0.4 est décrite dans `ProjectOS/projects/ProjectOSBackup/docs/QA_V04_IPHONE.md`.
