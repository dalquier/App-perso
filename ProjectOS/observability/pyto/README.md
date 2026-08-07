# ProjectOS Incidents — Widget Pyto

Widget iPhone en lecture seule pour consulter rapidement l’état du `ProjectOS — Incident Ledger` #87.

## Affichage

Le widget existe en petites, moyennes et grandes tailles et affiche uniquement des indicateurs synthétiques : incidents actifs, incidents uniques, répartition S1–S4, occurrences récentes, récurrence, type principal et couverture ProjectOS selon la taille.

Un toucher ouvre directement le Ledger GitHub #87.

## Données

Le widget ne possède pas sa propre taxonomie. Il charge `incident_aggregator.py` et consomme exactement le contrat `ProjectOS/observability/AGGREGATOR_CONTRACT.md`.

Pour une installation autonome dans Pyto, conserver `incident_widget.py` et `incident_aggregator.py` dans le même dossier. Dans une copie complète du dépôt, le widget retrouve automatiquement l’agrégateur sous `ProjectOS/scripts/`.

Aucun token GitHub n’est nécessaire pour le Ledger public. Le widget n’écrit jamais dans GitHub.

## Rafraîchissement

Le widget demande un prochain rafraîchissement environ 30 minutes plus tard. iOS reste libre de décaler l’exécution. Une impossibilité réseau n’altère aucune donnée canonique ; le Ledger GitHub reste la source de vérité.
