# Pyto Agent Usage Widget — installation

Le widget **Calm Instrument** est une projection en lecture seule des journaux Agent Usage BUILD-01/BUILD-02. Le Raccourci iOS alimente les données ; il n’est pas l’interface finale.

## Informations affichées

- **Petite taille** : quota restant, état, reset, crédits supplémentaires et fraîcheur.
- **Taille moyenne** : quota, reset, crédits, date de la dernière commande, titre/statut de la dernière tâche et fraîcheur.
- **Grande taille** : informations précédentes, nombre de tâches Codex/Work de la semaine, consommation observée, prévision exploitable et historique du cycle courant.

Les valeurs restent honnêtes :

- crédits absents → `Crédits : inconnus` ;
- crédits explicitement à zéro → `Crédits : 0` ;
- aucune tâche → `Dernière commande : aucune` ;
- aucune prévision fiable → `Prévision indisponible`.

## Garanties de conception

- lecture de `usage_snapshots.jsonl`, `usage_intervals.jsonl` et `tasks.jsonl` ;
- aucune écriture, réparation ou restauration automatique ;
- aucun réseau, cookie, token, secret ou texte OCR brut ;
- aucun cache métier durable ;
- `null` reste distinct de `0` ;
- les prévisions indisponibles ne sont jamais remplacées par une date inventée ;
- les tâches sont dédupliquées par `task_id` avant affichage.

## Installation dans Pyto

1. Déployer le dossier `agent-usage` complet depuis Working Copy vers `iCloud Drive/Pyto/DeveloperOS/agent-usage/`.
2. Ne pas copier seulement `widget.py` : tous les modules voisins sont nécessaires.
3. Exécuter une première fois `widget.py` dans Pyto.
4. Ajouter un widget **Pyto** sur l’écran d’accueil.
5. Dans sa configuration, choisir **Run Script** puis `widget.py`.
6. Ajouter séparément les tailles petite, moyenne et grande.

Le code et les données ont des rôles différents :

- code exécuté : `iCloud Drive/Pyto/DeveloperOS/agent-usage/` ;
- données locales par défaut : `~/Documents/DeveloperOS/agent-usage/` ;
- source canonique du code : GitHub `dalquier/App-perso`.

## Nettoyage des éléments obsolètes

Le widget actuel génère ses graphiques uniquement en mémoire. Après déploiement, supprimer du dossier Pyto les anciens fichiers générés s’ils existent :

- `quota_gauge.png` ;
- `usage_history.png` ;
- toute variante `quota_gauge_*.png` ou `history_*.png`.

Ne pas supprimer les journaux JSONL, les fichiers `.bak`, le secret local de hash ni le dossier `staging` sans diagnostic explicite.

## Stockage dégradé

- principal absent et `.bak` présent : `Sauvegarde utilisée` ;
- principal présent avec lignes invalides : `Stockage à vérifier` ;
- dossier inaccessible : `Stockage inaccessible` ;
- aucune restauration ou substitution silencieuse n’est effectuée.

## Actualisation

Une nouvelle exécution est demandée environ toutes les 45 minutes. Cette valeur est une demande au plus tôt, jamais une garantie WidgetKit. La fraîcheur du dernier relevé reste donc visible dans toutes les tailles.

## Dépannage initial

- `Aucun relevé` : vérifier le dossier canonique et la présence de `usage_snapshots.jsonl` ;
- `Crédits : inconnus` : aucun montant explicite n’est présent dans le dernier snapshot ;
- `Dernière commande : aucune` : `tasks.jsonl` ne contient aucune tâche valide ;
- `Donnée ancienne` : le dernier relevé dépasse le seuil BUILD-01 de 24 heures ;
- `Stockage à vérifier` : exécuter le diagnostic d’intégrité BUILD-01 dans Pyto ;
- `Stockage inaccessible` : vérifier téléchargement iCloud et autorisations.
