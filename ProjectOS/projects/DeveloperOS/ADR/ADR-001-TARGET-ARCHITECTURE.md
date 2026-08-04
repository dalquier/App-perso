# ADR-001 — Architecture cible de DeveloperOS

- Statut : proposé pour validation
- Date : 2026-08-04

## Contexte
Les versions retrouvées se répartissent entre prototypes Python/Pyto autonomes, Builder local, agent à état durable et kernel Python sans interface. Les prototypes d’interface Pyto ont rencontré des défauts structurants : défilement, clavier, navigation, menus et clics inertes. La vision actuelle exige une application iPhone moderne, installable, fiable et local-first.

## Options évaluées

### 1. PWA principale avec Replit
Bonne UX iPhone, vrais contrôles web, défilement et clavier testables, installation écran d’accueil, service worker, déploiement simple. Limite : accès restreint aux fichiers locaux et intégrations iOS profondes.

### 2. Application Pyto principale
Bonne proximité avec les fichiers locaux et Python existant. Limites fortes : UI Pyto fragile, navigation et clavier difficiles, distribution et tests d’interface plus faibles.

### 3. PWA principale avec compagnon Pyto
Conserve les avantages de la PWA et réserve Pyto aux opérations locales spécifiques. Ajoute une frontière à maintenir, mais évite deux interfaces concurrentes si le compagnon reste strictement utilitaire.

## Décision
Adopter l’option 3 :
- PWA TypeScript principale, installable et local-first ;
- stockage V1 dans IndexedDB avec export/import JSON versionné ;
- service worker pour le fonctionnement hors connexion ;
- Replit Starter pour exécution, tests fonctionnels, prévisualisation et déploiement ;
- GitHub comme source canonique ;
- Pyto uniquement comme compagnon local optionnel, sans dupliquer la gestion des projets.

## Conséquences
- Le kernel Python de `dalquier/Scriptable#5` n’est pas la base directe de BUILD-01.
- Ses concepts de configuration, santé, diagnostics et tests peuvent inspirer des composants ultérieurs.
- Les modules d’état atomique, historique et sauvegarde des prototypes Python sont des références de conception, pas des dépendances obligatoires.
- La Draft autonome, le Builder OpenAI et l’agent autonome sortent du périmètre du produit V1.
- Aucun backend n’est requis pour BUILD-01.
- Les intégrations GitHub automatisées seront ajoutées après validation du noyau local.

## Critères de réexamen
Réexaminer cette décision uniquement si une contrainte vérifiée rend impossible : l’installation PWA, la persistance locale, l’export/import ou l’expérience iPhone attendue. Une préférence abstraite pour Python ne suffit pas.
