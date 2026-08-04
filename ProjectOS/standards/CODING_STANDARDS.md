# ProjectOS — Standards de code

- Privilégier un code lisible, explicite, modulaire et testable.
- Séparer interface, logique métier, persistance et intégrations externes.
- Éviter les dépendances inutiles et documenter toute dépendance structurante.
- Valider les entrées, gérer les erreurs et produire des messages exploitables.
- Centraliser configuration et version.
- Ne jamais intégrer de secret, token ou donnée personnelle dans le dépôt.
- Préserver la compatibilité utile et documenter toute rupture.
- Préférer les petits changements cohérents aux réécritures globales non justifiées.
- Ajouter des types, contrats ou validations lorsque le langage et le contexte le permettent.
- Nettoyer le code mort uniquement lorsque son absence d’usage est vérifiée.
- Pour iPhone, tenir compte du clavier, des safe areas, du défilement, de la fermeture des vues et des ressources limitées.
- Toute optimisation doit reposer sur une mesure ou un problème observé.

## Ressources et artefacts binaires

- Distinguer les sources versionnées des artefacts générés.
- Inventorier les formats binaires attendus avant l’implémentation et vérifier la compatibilité du canal de publication retenu.
- Préférer une source textuelle versionnable et une génération déterministe lorsque le canal de publication ne prend pas en charge les binaires.
- Une ressource générée doit pouvoir être reconstruite par une commande documentée et verrouillée.
- Le build ou le test concerné doit échouer clairement si une ressource obligatoire n’a pas été générée.
- Les dimensions, formats, noms, chemins et propriétés essentielles des ressources produites doivent être testés.
- Les binaires générés ne doivent pas être commités sauf décision explicite.
- Les fichiers binaires réellement canoniques doivent être publiés par un outil Git compatible et contrôlés contre les limites de taille du dépôt.
- Ne jamais substituer une ressource techniquement inadéquate uniquement parce qu’elle est textuelle.
- Ne jamais contourner une limitation de publication par un encodage Base64 massif ou une archive opaque sans décision documentée.
