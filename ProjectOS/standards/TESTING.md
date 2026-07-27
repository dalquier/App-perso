# ProjectOS — Tests

## Principes

- Tester d’abord le parcours principal et les risques de perte de données.
- Adapter la profondeur des tests au risque et à la réversibilité.
- Ne jamais déclarer un test réussi sans l’avoir exécuté ou observé.
- Documenter les tests impossibles à exécuter et la raison.

## Niveaux

1. Vérifications statiques : syntaxe, types, format, configuration et secrets.
2. Tests unitaires : logique métier et fonctions critiques.
3. Tests d’intégration : persistance, fichiers, API et interactions entre composants.
4. Test de démarrage : installation et lancement dans l’environnement cible.
5. Test du parcours principal : scénario utilisateur complet.
6. Régression ciblée : comportement corrigé et zones adjacentes.
7. Tests manuels iPhone : clavier, défilement, safe areas, menus, fermeture, reprise et persistance.

## Preuves de livraison

Une Pull Request doit indiquer les commandes exécutées, les résultats observés, l’environnement utilisé, les tests non exécutés et les risques résiduels.