# ADR-001 — Snapshot courant vérifié piloté par iPhone

## Statut

Remplacée pour le transport et le format de sauvegarde par le miroir incrémental BUILD-02.2 et l'ADR-002. La décision d'utiliser Pyto et d'exclure `dalquier/Scriptable` reste applicable.

## Contexte

Les fichiers de code sont répartis entre GitHub, iCloud Drive et plusieurs applications iPhone. Damien veut récupérer l'état le plus récent après un crash, sans conserver les générations quotidiennes du backup. Il doit pouvoir ajouter de nouveaux dossiers depuis l'application.

## Décision

- utiliser Pyto pour la sélection et le traitement local des dossiers ;
- persister les autorisations avec `file_system.FolderBookmark` ;
- construire un candidat complet dans `Staging` ;
- créer un ZIP indépendant par source et un manifeste global ;
- vérifier les ZIP et calculer les SHA-256 avant publication ;
- remplacer le répertoire `Current` comme un ensemble et supprimer le précédent après succès ;
- produire un bundle global unique pour Raccourcis ;
- confier à Raccourcis le transfert vers Google Drive, car Pyto ne peut pas traiter Google Drive comme un système de fichiers réel ;
- exclure explicitement `dalquier/Scriptable` et sa copie Working Copy.

## Conséquences

- une source indisponible bloque le nouveau snapshot, mais préserve `Current` ;
- l'utilisateur accorde une fois l'accès à chaque dossier ;
- les anciennes copies déjà contenues dans une source restent sauvegardées tant qu'elles n'ont pas été nettoyées à la source ;
- le BUILD-02 doit vérifier le remplacement du bundle dans Drive ;
- la sauvegarde de `dalquier/App-perso` nécessite un flux cloud séparé.

Les ZIP, le bundle global et le transfert de dossier par Raccourcis décrits ici sont historiques : la v0.4 maintient un miroir `Current` sans versions et utilise un relais Apps Script résilient.

## Retour arrière

Pour un ancien BUILD-01, supprimer l'application/configuration Pyto et conserver le dernier bundle Drive. Pour la v0.4, appliquer le retour arrière de l'ADR-002. Aucun fichier source n'est modifié par le système.
