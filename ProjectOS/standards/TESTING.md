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
8. Contrôle de livraison : diff final, fichiers binaires, artefacts générés, compatibilité du canal de publication et hygiène Git.

## Contrôle de livraison

Avant de déclarer une tâche ou une Pull Request publiable :

- inspecter le diff final avec `git diff --numstat <base>...HEAD` ou un contrôle équivalent ;
- identifier les fichiers binaires prévus ou détectés ;
- distinguer les sources canoniques des artefacts générés ;
- vérifier que les artefacts générés sont reconstructibles par une commande documentée ;
- vérifier leur présence, leur format, leurs dimensions ou autres propriétés essentielles dans l’artefact final ;
- vérifier que le canal de publication choisi accepte tous les fichiers du diff ;
- vérifier qu’aucun fichier généré inutile, cache, build, export réel ou archive opaque n’est suivi par Git.

Un contrôle local du build ne prouve pas que le canal de publication accepte le diff. La publiabilité doit être établie séparément.

## Preuves de livraison

Une Pull Request doit indiquer :

- les commandes exécutées ;
- les résultats observés ;
- l’environnement utilisé ;
- les tests non exécutés ;
- les risques résiduels ;
- la liste des fichiers binaires prévus ou détectés ;
- leur caractère source ou généré ;
- la commande de génération lorsqu’elle existe ;
- leur présence vérifiée dans l’artefact final ;
- le mode et le canal de publication retenus.
