# DeveloperOS Agent Usage — déploiement GitHub vers Pyto

## Règle d’architecture

Les trois emplacements n’ont pas le même rôle :

- **GitHub `dalquier/App-perso`** : source canonique du code ;
- **Working Copy** : clone Git et moyen de transport sur iPhone ;
- **iCloud Drive/Pyto/DeveloperOS/agent-usage** : copie d’exécution utilisée par Pyto et Raccourcis.

`projectos-backup` sauvegarde des sources sélectionnées vers le miroir de sauvegarde prévu. Il ne clone pas GitHub dans Pyto et ne déploie pas automatiquement les fichiers applicatifs.

## Source de déploiement

Pendant les PR empilées BUILD-02 / BUILD-03, utiliser la branche :

`developeros/agent-usage-build-03-widget-pyto`

Cette branche contient le core BUILD-01, l’import BUILD-02 et le widget BUILD-03.

Après fusion et retarget des PR, utiliser `main`.

## Dossier source

`apps/developer-os/companions/pyto/agent-usage/`

## Dossier cible

`iCloud Drive/Pyto/DeveloperOS/agent-usage/`

Le dossier cible doit contenir tous les modules voisins. Ne jamais copier seulement `shortcuts_quick.py` ou `widget.py`.

## Déploiement iPhone recommandé

1. Dans Working Copy, récupérer la branche source et vérifier qu’elle est à jour.
2. Exporter ou copier le dossier source complet via l’app Fichiers.
3. Créer si nécessaire `iCloud Drive/Pyto/DeveloperOS/`.
4. Remplacer le dossier cible `agent-usage` par la copie complète du dossier source.
5. Ne jamais recopier dans GitHub les journaux locaux, secrets ou fichiers générés : `tasks.jsonl`, `usage_snapshots.jsonl`, `usage_intervals.jsonl`, `import_events.jsonl`, `staging/`, `.raw_text_hash_secret` et sauvegardes locales.
6. Dans l’action Raccourcis **Exécuter le Script**, sélectionner le script depuis le dossier cible et définir ce même dossier comme répertoire actuel.

## Sens de synchronisation

Le déploiement du code est **unidirectionnel** :

`GitHub/Working Copy → Pyto`

Les données locales sont produites dans Pyto et sauvegardées séparément. Elles ne doivent jamais être fusionnées avec le code source.

## Contrôle minimal après déploiement

Le dossier Pyto doit au minimum contenir :

- `config.py`
- `models.py`
- `storage.py`
- `validation.py`
- `analytics.py`
- `shortcuts_bridge.py`
- `shortcuts_quick.py`
- `import_parser.py`
- `import_snapshot.py`
- `import_staging.py`
- `import_ledger.py`
- `widget.py`
- `widget_reader.py`
- `widget_viewmodel.py`
- `widget_render_native.py`
- `widget_render_charts.py`

L’absence de `shortcuts_quick.py` signifie généralement que `main` a été copié alors que BUILD-02 n’est pas encore fusionné. L’absence des fichiers `widget*` signifie que la branche BUILD-03 n’a pas été utilisée.