# Test Pyto + Replit

Mini-projet temporaire destiné à vérifier qu'un script Pyto exécuté sur iPhone peut appeler un serveur Python lancé dans Replit et recevoir une réponse JSON.

## Périmètre

- `replit_server.py` : serveur HTTP sans dépendance externe, avec `GET /ping` ;
- `pyto_client.py` : client à exécuter dans Pyto ;
- `test_server.py` : test automatisé du contrat JSON.

Aucune donnée n'est enregistrée. Aucun secret, compte utilisateur ou service OpenAI n'est utilisé.

## Exécuter dans Replit

1. Importer le dépôt GitHub et sélectionner la branche de cette Pull Request.
2. Ouvrir le Shell Replit dans `apps/pyto-replit-test/`.
3. Lancer `python replit_server.py`.
4. Vérifier que le Preview expose le port et relever son URL HTTPS.
5. Ouvrir `<URL_REPLIT>/ping` et vérifier la réponse JSON.

L'URL de développement n'est disponible que pendant l'exécution du workflow Replit. Une publication permanente n'est pas nécessaire pour ce test.

## Exécuter dans Pyto

1. Copier `pyto_client.py` dans Pyto.
2. Remplacer `https://REPLACE-ME.replit.dev` par l'URL affichée dans Replit, sans ajouter `/ping`.
3. Exécuter le script.
4. Vérifier l'affichage `✅ CONNEXION RÉUSSIE`.

## Tests

Depuis le dossier du projet :

```bash
python -m unittest -v
python -m py_compile replit_server.py pyto_client.py test_server.py
```

## Suppression

Après validation, supprimer ensemble :

- `apps/pyto-replit-test/` ;
- `ProjectOS/projects/PytoReplitTest/` ;
- la ligne `pyto-replit-test` dans `ProjectOS/PROJECT_REGISTRY.md`.

La suppression devra être réalisée dans une Pull Request dédiée.
