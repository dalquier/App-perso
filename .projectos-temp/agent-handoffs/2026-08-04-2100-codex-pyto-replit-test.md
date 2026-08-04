# Handoff — PytoReplitTest

## Objectif et périmètre

Créer une expérimentation temporaire minimale pour valider une requête HTTPS de Pyto vers un serveur Python Replit et son retour JSON.

## Livraison

- Dépôt : `dalquier/App-perso`
- Branche de base : `main`
- Branche logique : `agent/pyto-replit-test`
- Mode : connecteur GitHub, Pull Request en brouillon

## Décisions et hypothèses

- Code sans dépendance externe, secret, persistance ou API OpenAI.
- Projet explicitement temporaire, enregistré selon ProjectOS puis supprimable par Pull Request dédiée.
- L’URL Replit est renseignée localement dans Pyto et ne doit pas être commise après remplacement.

## Actions et fichiers

- Création du serveur, du client Pyto, d’un test automatisé et du README sous `apps/pyto-replit-test/`.
- Création du manifeste et du plan de validation sous `ProjectOS/projects/PytoReplitTest/`.
- Ajout prévu de l’entrée `pyto-replit-test` au registre ProjectOS.

## Tests exécutés

- `python -m py_compile apps/pyto-replit-test/replit_server.py apps/pyto-replit-test/pyto_client.py apps/pyto-replit-test/test_server.py` : réussi.
- `python -m unittest discover -s apps/pyto-replit-test -v` : 1 test réussi.

## Limites et risques

- Le serveur n’a pas été exécuté dans Replit.
- Le client n’a pas été exécuté dans Pyto sur iPhone.
- Le fichier temporaire de handoff doit être supprimé de la branche avant fusion.

## Prochaine action

Publier la branche et la Pull Request, vérifier les fichiers dans GitHub, puis importer la branche dans Replit et exécuter le parcours réel sur iPhone.
