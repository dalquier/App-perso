# ProjectOS

ProjectOS est le cadre de pilotage commun des projets personnels de Damien.

## Principes

- **GitHub** est la source de vérité du code, des règles et de la documentation versionnée.
- **iCloud Drive** est l'espace de travail local sur iPhone/iPad/Mac.
- **Google Drive** reçoit des sauvegardes régulières, horodatées et vérifiables.
- **ChatGPT** conçoit, arbitre et documente.
- **Codex** réalise les changements de code importants.
- **Replit** exécute les services cloud et les tâches planifiées.
- **Pyto** gère les opérations locales iOS et iCloud.

## Structure

- `core/` : règles permanentes et kernel de décision.
- `projects/` : index et manifestes des projets.
- `templates/` : modèles réutilisables.
- `scripts/` : synchronisation, contrôle et sauvegarde.
- `config/` : configuration non secrète.
- `docs/` : exploitation et procédures.
- `.github/workflows/` : contrôles automatiques.

## Démarrage

1. Cloner le dépôt dans Working Copy ou Replit.
2. Copier `config/projectos.example.yaml` vers `config/projectos.yaml`.
3. Configurer `rclone` sur Replit ou une machine persistante pour Google Drive.
4. Utiliser `python ProjectOS/scripts/projectos.py doctor` pour vérifier l'installation.
5. Utiliser `python ProjectOS/scripts/projectos.py backup` pour produire une archive locale.

Les secrets OAuth et jetons ne doivent jamais être commités.