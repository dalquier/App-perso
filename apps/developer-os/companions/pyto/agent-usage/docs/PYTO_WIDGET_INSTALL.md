# Pyto Agent Usage Widget — installation

Le widget **Calm Instrument** est une projection en lecture seule des journaux Agent Usage BUILD-01/BUILD-02.

## Garanties de conception

- lecture de `usage_snapshots.jsonl`, `usage_intervals.jsonl` et `tasks.jsonl` ;
- aucune écriture, réparation ou restauration automatique ;
- aucun réseau, cookie, token, secret ou texte OCR brut ;
- aucun cache métier durable ;
- `null` reste distinct de `0` ;
- les prévisions indisponibles ne sont jamais remplacées par une date inventée.

## Installation dans Pyto

1. Place le dossier `agent-usage` dans un emplacement accessible à Pyto.
2. Utilise de préférence le dossier canonique : `~/Documents/DeveloperOS/agent-usage`.
3. Lorsque les données sont ailleurs, configure `DEVELOPEROS_AGENT_USAGE_DIR` avant l’exécution.
4. Exécute une première fois `widget.py` dans Pyto.
5. Ajoute un widget **Pyto** sur l’écran d’accueil.
6. Dans sa configuration, sélectionne le mode **Run Script**.
7. Sélectionne `widget.py`.
8. Ajoute séparément les tailles petite, moyenne et grande pour vérifier leurs layouts propres.

Les intitulés exacts de la version Pyto installée restent à relever pendant la recette physique.

## Comportement

- Petite taille : quota, statut, jauge, reset et fraîcheur.
- Moyenne : quota, crédits connus, activité, prévision compacte et état du stockage.
- Grande : synthèse hebdomadaire, tâches logiques, intervalles attribuables, prévision et historique du cycle courant.
- Toucher : lien global sûr `open:summary` ou `open:diagnostic`.
- Actualisation : une nouvelle exécution est demandée environ toutes les 45 minutes. Cette valeur est une demande au plus tôt, jamais une garantie WidgetKit.

## Stockage dégradé

- principal absent et `.bak` présent : `Sauvegarde utilisée` ;
- principal présent avec lignes invalides : `Stockage à vérifier` ;
- dossier inaccessible : `Stockage inaccessible` ;
- aucune restauration ou substitution silencieuse n’est effectuée.

## Mode sans Pillow

Lorsque Pillow est absent ou échoue, le widget reste fonctionnel avec une jauge et un historique textuels. Le pourcentage, le statut et les informations essentielles sont toujours du texte natif.

## Dépannage initial

- `Aucun relevé` : vérifier le dossier canonique et la présence des JSONL ;
- `Donnée indisponible` : aucun snapshot observé et validé n’est disponible ;
- `Donnée ancienne` : le dernier relevé dépasse le seuil de fraîcheur BUILD-01 de 24 heures ;
- `Stockage à vérifier` : ouvrir Pyto et exécuter le diagnostic d’intégrité BUILD-01 ;
- `Stockage inaccessible` : vérifier téléchargement iCloud et autorisations.

## Après fusion de BUILD-02

Après fusion de la PR #42 :

1. récupérer `main` ;
2. rebaser `developeros/agent-usage-build-03-widget-pyto` sur `main` ;
3. résoudre les conflits sans merge manuel ;
4. relancer tous les tests ;
5. retargeter la PR BUILD-03 vers `main` ;
6. conserver la PR en Draft jusqu’à la recette physique.
