# Équilibre — BUILD-03 — Séances et mémoire contrôlée

## Périmètre

BUILD-03 transforme une séance guidée terminée en un enregistrement structuré local contenant les réponses originales, un résumé déterministe et un plan d’action. Une proposition de mémoire peut ensuite être créée par une action explicite.

## Contrôle utilisateur

- aucune mémoire durable n’est créée automatiquement ;
- une proposition reste distincte d’une mémoire confirmée ;
- chaque élément conserve la référence de sa séance source ;
- une proposition peut être confirmée, corrigée ou supprimée ;
- une mémoire confirmée reste modifiable et supprimable ;
- l’effacement global et la désactivation de la persistance suppriment aussi séances et mémoires.

## Stockage

Le stockage passe à la version 3. La migration depuis la version 2 conserve conversations, messages, réglages et dernière séance, puis initialise `sessionRecords` et `memoryEntries` à vide. Une version inconnue reste bloquée sans écrasement automatique.

## Sécurité et limites

Tout reste dans le stockage local du navigateur. Aucun fournisseur distant n’est ajouté. Le résumé est déterministe et ne constitue ni une analyse clinique ni un diagnostic. GitHub et les tests ne contiennent que des données fictives.

## Validation attendue

- migration v2 vers v3 sans perte ;
- séance terminée enregistrée une seule fois ;
- proposition explicite ;
- confirmation, correction et suppression ;
- provenance conservée ;
- effacement total ;
- non-régression des conversations BUILD-02 et de la séance BUILD-01 ;
- recette iPhone : terminer une séance, proposer une mémoire, la corriger, la confirmer, fermer et rouvrir, puis la supprimer.
