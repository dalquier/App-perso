# ADR-002 — Personal-first, anonymisable ensuite

- Statut : accepté
- Date : 2026-07-28

## Décision

Équilibre est conçu d’abord pour Damien, mais aucune donnée, règle ou interface ne doit coder son identité en dur. Le modèle doit supporter `user_id`, export, suppression, anonymisation et remplacement du profil.

## Conséquences

- exemples fictifs uniquement dans GitHub ;
- séparation produit/protocoles/données ;
- multi-utilisateur latent sans l’activer dans le MVP ;
- toute mémoire personnelle doit être contrôlable et traçable.
