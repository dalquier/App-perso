# ADR-007 — Versions stables Replit et stockage local v5

- Statut : proposé pour `SESSION-30-C-PREP`
- Date : 2026-08-09
- Référence : `../docs/SESSION_30_C_STABLE_RELEASE_AND_DATA_PRESERVATION.md`

## Contexte

Équilibre est déjà utilisable comme PWA locale et conserve conversations, protocoles, résultats et mémoires dans un état JSON `localStorage` de version 4. Ce stockage possède des migrations v1 à v4, des sauvegardes brutes, une révision monotone, un blocage des écritures obsolètes et une protection anti-résurrection.

Le moteur `SESSION-30-B` ajoute toutefois des séances longues contenant de nombreux Turns et anchors. Leur persistance répétée dans un unique JSON finirait par augmenter le risque de quota, de réécriture globale et de perte lors d'une évolution. En parallèle, les données locales d'une PWA appartiennent à son origine web : une URL Replit de développement temporaire, une nouvelle app ou un nouveau domaine ne retrouve pas automatiquement le stockage de l'ancienne origine.

Le projet doit donc garantir deux propriétés avant d'exposer SESSION-30 dans l'interface : une version stable toujours disponible dans Replit et une montée de schéma vérifiée qui ne détruit pas les données existantes.

## Décision

1. GitHub `main` reste l'unique source de vérité du code. Replit exécute une version publiée et traçable, jamais une branche de développement implicite.
2. L'usage personnel durable s'effectue sur une **origine publiée stable**. Les URL `.replit.dev` restent des surfaces temporaires de développement et ne sont pas une résidence fiable des données utilisateur.
3. Une seule app Replit canonique porte la version stable. Les candidats sont construits et testés dans GitHub/CI ; ils ne remplacent la version stable qu'après passage des gates de promotion.
4. Chaque incrément livrable est compatible avec les données de la dernière version stable et se termine par un état relançable. Aucun Build ne laisse `main` ou Replit dans un état intermédiaire inutilisable.
5. Le stockage cible de SESSION-30-C est un **storage-v5 IndexedDB local-first**, derrière un repository applicatif. `localStorage` v4 reste la source de migration, pas un second writer permanent.
6. Le schéma persistant normalise les collections volumineuses. Les messages et Turns sont stockés séparément de leurs agrégats, puis réhydratés dans les contrats de domaine existants.
7. La migration v4 vers v5 est locale, transactionnelle, idempotente et vérifiée avant activation. La valeur v4 brute est conservée comme snapshot de récupération tant que la v5 n'a pas franchi son checkpoint de validation.
8. L'activation v5 écrit un marqueur de compatibilité. Tout runtime v4 préparé pour la migration bloque alors ses écritures afin d'éviter un split-brain v4/v5.
9. Après activation v5, le retour arrière se fait vers une version de code compatible v5 ou par correctif forward. Redéployer une ancienne version ignorant v5 est interdit.
10. Avant chaque migration destructive ou promotion importante, l'utilisateur peut produire un export portable versionné. Toute restauration valide le format et l'intégrité dans une zone temporaire avant remplacement transactionnel de l'état actif.
11. Une migration n'est réussie que si inventaire, identifiants, relations, révisions et digests attendus sont équivalents avant et après. Au moindre écart, l'ancien état reste autoritaire et les écritures sont bloquées.
12. Les données personnelles, exports et snapshots ne quittent jamais le terminal utilisateur pour GitHub, les fixtures, les logs ou les artefacts CI.

## Modèle logique v5

Le détail physique peut évoluer sans modifier les contrats de domaine, mais le repository v5 sépare au minimum :

- métadonnées de schéma, révision et migration ;
- réglages et pointeurs actifs ;
- conversations ;
- messages de conversation ;
- protocol runs courts et longs ;
- Turns de séances longues ;
- session records ;
- memory entries.

Les anchors et résultats restent rattachés à leur run avec leur provenance. Le choix de séparation physique est guidé par la taille et la fréquence d'écriture, jamais par une duplication métier.

## Conséquences

- `SESSION-30-C` est découpé en petits incréments C0 à C4, tous stables et promouvables séparément.
- C0 prépare la v4 actuelle à l'export, à l'identification de release et au futur marqueur v5 avant toute migration.
- C1 introduit IndexedDB v5 et la migration, sans encore exposer SESSION-30.
- C2 persiste et reprend le moteur long, toujours sans `SessionRecord` ni mémoire.
- C3 expose l'interface iPhone structurée S30-02.
- C4 durcit foreground/background, PWA, offline et recette sur l'origine stable.
- Le domaine `LongSessionEngine` ne connaît ni IndexedDB ni Replit.
- Le runtime publié doit conserver son URL. Tout changement d'origine devient une migration produit explicite avec export depuis l'ancienne origine et import dans la nouvelle.
- Les versions candidates peuvent être testées sans données personnelles, avec fixtures fictives uniquement.

## Alternatives rejetées

- continuer à grossir le JSON v4 unique ;
- écrire simultanément en v4 et v5 sur une longue période ;
- considérer une Preview `.replit.dev` comme origine stable de production ;
- recréer une app Replit à chaque étape ;
- migrer puis revenir à un binaire v4 ignorant le marqueur v5 ;
- utiliser une base serveur pour résoudre un problème de stockage local ;
- inclure persistance, UI, `SessionRecord`, IA et voix dans une seule PR.

## Retour arrière

Avant activation v5, le lot documentaire et C0 sont réversibles sans migration de données. Après activation v5, seul un rollback vers un release compatible v5 ou un correctif forward est autorisé. Le snapshot v4 et l'export portable restent des sources de récupération ; ils ne sont jamais réinjectés automatiquement sans validation.
