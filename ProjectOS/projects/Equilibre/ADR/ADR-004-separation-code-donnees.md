# ADR-004 — Séparation code, protocoles et données

- Statut : accepté
- Date : 2026-07-28

## Décision

Le code, les protocoles TCC versionnés et les données personnelles sont trois couches distinctes. Aucune donnée personnelle réelle, aucun secret et aucune conversation privée ne sont stockés dans GitHub ou dans les journaux techniques.

## Conséquences

- les données sensibles utilisent un stockage dédié et chiffré à définir ;
- les protocoles sont auditables et indépendants d’un utilisateur ;
- les tests utilisent des profils fictifs ;
- export, suppression et restauration doivent être conçus avant la production.
