# PytoReplitTest — Manifeste ProjectOS

## Identité

- ID : `pyto-replit-test`
- Nom : PytoReplitTest
- Statut : expérimentation temporaire — à supprimer après validation
- Dépôt canonique : `dalquier/App-perso`
- Branche canonique : `main`
- Code canonique : `apps/pyto-replit-test/`
- Références ProjectOS : `ProjectOS/projects/PytoReplitTest/`

## Objectif

Valider le chemin technique minimal entre Pyto sur iPhone et un serveur Python exécuté dans Replit : requête HTTPS, réponse JSON et affichage du résultat dans Pyto.

## Architecture

1. Replit exécute un serveur HTTP Python sans dépendance externe.
2. Le serveur expose uniquement `GET /ping`.
3. Pyto appelle l'URL HTTPS et valide le contrat JSON.
4. GitHub conserve le code et la documentation ; Replit reste un environnement d'exécution.

## Contraintes

- aucun secret ;
- aucune API OpenAI ;
- aucune persistance ;
- aucune utilisation requise de l'agent IA Replit ;
- test manuel sur iPhone indispensable avant validation finale ;
- projet explicitement temporaire.

## Données

Le serveur produit uniquement un statut booléen, un message fixe, le nom de la source et un horodatage UTC. Aucune donnée personnelle n'est envoyée ou conservée.

## Risques

- l'URL de développement Replit peut changer ou être indisponible lorsque le workflow est arrêté ;
- le réseau iPhone ou les réglages d'accès du Preview peuvent bloquer la requête ;
- le test local ne prouve pas à lui seul le fonctionnement réel dans Replit et Pyto.

## Critères d'acceptation

- les tests Python automatisés réussissent ;
- `/ping` répond en HTTP 200 avec le contrat attendu dans Replit ;
- Pyto affiche `✅ CONNEXION RÉUSSIE` sur l'iPhone ;
- aucun secret et aucune donnée persistante ne sont introduits.

## Retour arrière et fin de vie

Supprimer les deux dossiers canoniques et l'entrée du registre dans une Pull Request dédiée. Aucun schéma de données ni migration inverse n'est nécessaire.

## Prochain jalon

Importer la branche dans Replit, lancer le serveur, puis exécuter le client dans Pyto sur iPhone.
