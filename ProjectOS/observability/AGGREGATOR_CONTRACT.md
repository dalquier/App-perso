# ProjectOS — Incident Aggregator Contract

## Source

L’agrégateur lit exclusivement les commentaires `INCIDENT OCCURRENCE` de l’issue GitHub #87. Les autres commentaires sont ignorés. Il ne modifie jamais le Ledger.

## Sortie JSON

La sortie `schema_version: 1.0` contient :

- `generated_at` ;
- référence du Ledger ;
- `totals` : incidents uniques, occurrences, incidents actifs, incidents récurrents, occurrences sur 7 et 30 jours ;
- `by_severity` : S1 à S4 selon la gravité courante de chaque incident ;
- `by_status` ;
- `by_type` ;
- `by_project` ;
- `by_tool` ;
- `by_projectos_coverage` ;
- `recurrent` : incidents ayant plus d’une occurrence ;
- `incidents` : vue dédupliquée avec statut courant, gravité courante, pire gravité historique, première/dernière occurrence et nombre d’occurrences.

## Règles

- un incident est regroupé par `incident_id`, avec la signature comme identité sémantique ;
- le statut, la gravité courante, le projet, l’outil et la couverture proviennent de l’occurrence la plus récente ;
- la pire gravité historique est conservée séparément ;
- aucun modèle IA n’est utilisé pour les compteurs ;
- le module reste sans dépendance externe Python ;
- un fichier JSON de commentaires peut remplacer GitHub pour les tests et usages hors ligne.

## Consommateurs

Ce contrat est commun au widget Pyto, au dashboard Replit et à l’Incident Analyzer. Aucun consommateur ne doit recalculer une taxonomie différente.
