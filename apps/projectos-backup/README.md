# ProjectOS Backup — BUILD-01

Application Pyto locale pour créer une sauvegarde vérifiée des dossiers de code sélectionnés sur iPhone. L'utilisateur peut ajouter, suspendre et retirer des dossiers depuis l'application. L'accès persiste grâce aux bookmarks de sécurité Pyto.

## Règles fonctionnelles

- le dépôt GitHub/Working Copy `dalquier/Scriptable` est explicitement hors périmètre ;
- aucun dossier n'est découvert ou ajouté silencieusement ;
- une source déjà enregistrée n'est pas ajoutée une seconde fois ;
- les dossiers iCloud sont accordés une fois depuis le sélecteur Fichiers ;
- les sources ne sont jamais modifiées ;
- chaque source produit un ZIP et un manifeste contenant les SHA-256 des fichiers ;
- les empreintes sont recalculées depuis les octets réellement écrits dans chaque ZIP ;
- la nouvelle sauvegarde est intégralement construite dans `Staging` ;
- `Current` n'est remplacé que lorsque toutes les archives sont vérifiées ;
- une seule sauvegarde courante reste après succès ;
- les restes de staging et de publication interrompue sont récupérés ou nettoyés ;
- `.git`, les caches Python et `.DS_Store` sont exclus ; les anciennes versions déjà présentes dans une source restent des fichiers de la source et sont donc conservées.

## Installation dans Pyto

Copier le dossier `apps/projectos-backup/` depuis `dalquier/App-perso` dans le dossier Pyto de l'iPhone, puis lancer :

```text
run.py
```

Dans l'application :

1. toucher `Destination de transit` et sélectionner un dossier iCloud dédié, situé en dehors de toutes les sources ;
2. toucher `Ajouter un dossier` pour chaque dossier à protéger ;
3. toucher une source pour l'activer ou la suspendre ;
4. balayer une source vers la gauche pour la retirer de la configuration ;
5. toucher `Sauvegarder maintenant`.

Le retrait d'une source ne supprime jamais le dossier original. Au prochain succès, `Current` reflète uniquement les sources actives.

## Dossiers suggérés

`Pyto`, `Pyto data`, `Scriptable`, `Scriptable Data`, `Équilibre`, `Runestone`, `Maestro`, `Maestro 2`, `Backup Script` et `Scripts 260717`.

Ne pas ajouter la copie Working Copy du dépôt `Scriptable`.

## Sortie

```text
<destination>/
├── Current/
│   ├── MANIFEST.json
│   ├── Pyto.zip
│   ├── Scriptable.zip
│   └── ...
├── ProjectOS-Backup-Current.zip
└── Staging/
```

`ProjectOS-Backup-Current.zip` est le fichier unique destiné au transfert vers Google Drive. Il contient `Current/`, ses archives par source et le manifeste global.

## Automatisation Raccourcis — contrat BUILD-01

Le script `headless.py` utilise la configuration enregistrée par l'interface et imprime un JSON. En cas de succès, la clé `bundle_path` désigne `ProjectOS-Backup-Current.zip`.

Le Raccourci iOS à construire au BUILD-02 devra :

1. exécuter `headless.py` dans Pyto, console désactivée ;
2. vérifier que `status` vaut `complete` ;
3. récupérer le fichier indiqué par `bundle_path` ;
4. remplacer le fichier du même nom dans le dossier Google Drive `ProjectOS-Backups` ;
5. relire sa taille ou son empreinte avant de déclarer le transfert réussi ;
6. conserver la copie iCloud actuelle si le transfert Drive échoue.

Pyto ne doit pas écrire directement dans Google Drive : la documentation Pyto précise que les fournisseurs tiers comme Google Drive n'exposent pas un système de fichiers réel. Raccourcis assure donc l'orchestration Drive.

## Tests

```bash
python -m unittest discover apps/projectos-backup/tests
python -m compileall apps/projectos-backup
```

Les tests couvrent la construction et la vérification ZIP, le remplacement de `Current`, la conservation de l'ancienne sauvegarde en cas d'échec, les chevauchements dangereux et la configuration des sources.

## Limites de BUILD-01

- recette réelle dans Pyto/iOS encore requise ;
- Raccourci Drive et automatisation de recharge à construire au BUILD-02 ;
- sauvegarde cloud du seul dépôt GitHub `dalquier/App-perso` à construire séparément ;
- les fichiers iCloud non téléchargés peuvent provoquer un échec sûr : `Current` reste alors inchangé ;
- aucun secret Google ou GitHub n'est stocké dans le dépôt.
