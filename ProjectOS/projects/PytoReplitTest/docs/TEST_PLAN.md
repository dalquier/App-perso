# PytoReplitTest — Plan de validation

## Contrôles automatisés

1. Compiler les trois scripts avec `python -m py_compile`.
2. Exécuter `python -m unittest -v`.
3. Vérifier que le contrat contient `success`, `message`, `source` et `timestamp`.

## Test Replit

1. Importer la branche de la Pull Request dans Replit.
2. Lancer `python replit_server.py` depuis `apps/pyto-replit-test/`.
3. Ouvrir `<URL_REPLIT>/ping`.
4. Conserver comme preuve le statut HTTP observé et la réponse JSON, sans donnée sensible.

## Test Pyto sur iPhone

1. Reporter l'URL Replit dans `REPLIT_BASE_URL` du client local Pyto.
2. Exécuter `pyto_client.py`.
3. Vérifier le message de réussite et la présence d'un horodatage.
4. Arrêter le serveur Replit, relancer le client et vérifier qu'une erreur compréhensible est affichée.

## Interprétation

- tests automatisés seuls : code construit, intégration réelle non prouvée ;
- `/ping` observé dans Replit : serveur Replit prouvé ;
- réussite observée dans Pyto : chaîne Pyto + Replit validée ;
- message d'erreur après arrêt : gestion minimale de l'indisponibilité validée.
