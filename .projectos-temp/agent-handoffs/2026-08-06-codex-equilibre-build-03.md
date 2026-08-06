# Handoff temporaire — Équilibre BUILD-03

- Date : 2026-08-06
- Dépôt : dalquier/App-perso
- Base : main au commit 118bbb67836a8743b349ecdb9572ce8a0be89674
- Branche : agent/equilibre-build-03-memory
- Livraison : GitHub, Pull Request Draft

## Objectif

Livrer les séances structurées enrichies, leurs résumés et plans d’action, puis une mémoire locale explicitement proposée, confirmable, corrigeable et supprimable.

## Changements

- domaine de mémoire indépendant de l’UI ;
- stockage version 3 et migration sans perte depuis la version 2 ;
- enregistrement local d’une séance terminée ;
- résumé déterministe et plan d’action ;
- proposition explicite de mémoire ;
- confirmation, correction et suppression ;
- provenance vers la séance source ;
- écran Mémoire et navigation ;
- tests automatisés et documentation BUILD-03.

## Sécurité

Aucun fournisseur distant, secret ou donnée réelle. Le garde-fou déterministe existant reste avant tout traitement de séance. La désactivation de la persistance et l’effacement global suppriment les nouveaux objets.

## Validation

À compléter après les workflows GitHub : tests, build et contrôles ProjectOS.

## Points ouverts

- recette fonctionnelle Replit ;
- recette physique iPhone ;
- suppression de ce handoff avant fusion ;
- mise à jour du manifeste et de la roadmap après validation.
