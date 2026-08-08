# ProjectOS — Tests

## Principes

- Tester d’abord le parcours principal et les risques de perte de données.
- Adapter la profondeur des tests au risque et à la réversibilité.
- Ne jamais déclarer un test réussi sans l’avoir exécuté ou observé.
- Documenter les tests impossibles à exécuter et la raison.
- Distinguer la qualité du résultat, la publiabilité du diff et la récupération effective du livrable.
- Pour une application exécutée dans Replit, appliquer en plus `REPLIT_RUNTIME_CONTRACT.md` : une CI métier verte ne prouve pas à elle seule que le runtime Replit, le port ou la Preview native fonctionnent.

## Niveaux

1. Vérifications statiques : syntaxe, types, format, configuration et secrets.
2. Tests unitaires : logique métier et fonctions critiques.
3. Tests d’intégration : persistance, fichiers, API et interactions entre composants.
4. Test de démarrage : installation et lancement dans l’environnement cible.
5. Test du parcours principal : scénario utilisateur complet.
6. Régression ciblée : comportement corrigé et zones adjacentes.
7. Tests manuels iPhone : clavier, défilement, safe areas, menus, fermeture, reprise et persistance.
8. Contrôle de livraison : diff final, fichiers binaires, artefacts générés, compatibilité du canal de publication, récupération et hygiène Git.

## Replit Runtime Gate

Pour toute application dont Replit constitue un environnement de recette, Preview, exécution ou hébergement :

1. exécuter le `REPLIT RUNTIME PREFLIGHT` de `REPLIT_RUNTIME_CONTRACT.md` avant la recette ;
2. prouver le SHA canonique attendu ;
3. prouver que le worktree/runtime n’est ni sale ni divergent ;
4. exécuter en CI un `Direct Run Smoke` avec la même commande de lancement que Replit ou une commande strictement équivalente ;
5. vérifier un HTTP 200 réel ;
6. lorsqu’une UI web est critique, ajouter un browser smoke vérifiant au minimum DOM non vide et absence d’erreur JavaScript bloquante ;
7. valider la vraie Preview/Webview de l’application, et non `Open Artifact`, un panneau `Validation` ou un Workflow manuel ;
8. refaire ce gate après toute évolution du build, serveur, port, `.replit`, service worker, PWA, manifeste, racine du monorepo ou commande de lancement.

Un test sur un ancien runtime, un ancien Artifact ou une Preview dont le SHA n’est pas prouvé ne peut pas valider la version courante.

## Contrôle de livraison

Avant de déclarer une tâche ou une Pull Request publiable :

- appliquer `ARTIFACT_DELIVERY_AND_RECOVERY.md` ;
- inspecter le diff final avec `git diff --numstat <base>...HEAD` ou un contrôle équivalent ;
- identifier les fichiers binaires prévus ou détectés ;
- distinguer les sources canoniques des artefacts générés ;
- vérifier que les artefacts générés sont reconstructibles par une commande documentée ;
- vérifier leur présence, leur format, leurs dimensions ou autres propriétés essentielles dans l’artefact final ;
- vérifier que le canal de publication choisi accepte tous les fichiers du diff ;
- vérifier qu’aucun fichier généré inutile, cache, build, export réel ou archive opaque n’est suivi par Git ;
- vérifier qu’un plan de récupération est disponible sans dépendre exclusivement du sandbox producteur.

Un contrôle local du build ne prouve pas que le canal de publication accepte le diff. La publiabilité doit être établie séparément. Un commit local ne prouve pas que le résultat est récupérable.

## Checklist de preuve de livraison

Avant de déclarer la tâche terminée :

- [ ] dépôt, branche de base, branche cible et SHA source vérifiés ;
- [ ] mode de livraison annoncé au début ;
- [ ] canal compatible avec les fichiers du diff ;
- [ ] SHA distant vérifié après une publication GitHub ;
- [ ] Pull Request réellement créée ou mise à jour ;
- [ ] état Draft ou Ready conforme à l’instruction ;
- [ ] aucune fusion non demandée ;
- [ ] patch de secours récupérable lorsque requis ;
- [ ] archive ZIP récupérable lorsque requise ;
- [ ] SHA-256 vérifié pour chaque artefact exporté ;
- [ ] aucun lien vide ou chemin interne présenté comme téléchargement ;
- [ ] récupération confirmée hors de l’environnement producteur ;
- [ ] état final qualifié : construit, exporté, publié, livré ou intégré ;
- [ ] pour Replit : Runtime Contract chargé, preflight `READY`, Direct Run Smoke vert et vraie Preview native utilisée pour la recette.

## Preuves de livraison

Une Pull Request ou un manifeste de livraison doit indiquer :

- les commandes exécutées ;
- les résultats observés ;
- l’environnement utilisé ;
- les tests non exécutés ;
- les risques résiduels ;
- la liste des fichiers binaires prévus ou détectés ;
- leur caractère source ou généré ;
- la commande de génération lorsqu’elle existe ;
- leur présence vérifiée dans l’artefact final ;
- le mode et le canal de publication retenus ;
- les SHA de base et de tête ;
- les liens ou emplacements réellement récupérables ;
- les empreintes SHA-256 des artefacts de secours ;
- le résultat de la vérification GitHub après publication ;
- pour une application Replit : mode runtime, nom du Replit, SHA exécuté, commande de lancement, résultat du Direct Run Smoke et résultat de la Preview native.
