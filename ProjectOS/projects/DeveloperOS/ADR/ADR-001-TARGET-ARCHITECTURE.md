# ADR-001 — Architecture cible de DeveloperOS

- Statut : accepté
- Date : 2026-08-04

## Contexte
Les versions retrouvées se répartissent entre prototypes Python/Pyto autonomes, Builder local, agent à état durable et kernel Python sans interface. Les prototypes d’interface Pyto ont rencontré des défauts structurants : défilement, clavier, navigation, menus et clics inertes. La vision exige une application iPhone moderne, installable, fiable et local-first.

## Options évaluées

### 1. PWA principale avec Replit
Bonne UX iPhone, vrais contrôles web, défilement et clavier testables, installation écran d’accueil, service worker et déploiement simple.

### 2. Application Pyto principale
Bonne proximité avec les fichiers locaux et Python existant, mais UI, navigation, clavier, distribution et tests d’interface moins fiables.

### 3. PWA principale avec compagnon Pyto
Conserve les avantages de la PWA et réserve Pyto aux opérations locales spécifiques, sans créer deux interfaces concurrentes.

## Décision
Adopter l’option 3 :
- PWA TypeScript principale, installable et local-first ;
- stockage V1 dans IndexedDB avec export/import JSON versionné ;
- service worker pour le hors connexion ;
- Replit Starter pour exécution, tests, preview et déploiement ;
- GitHub comme source canonique ;
- Pyto uniquement comme compagnon local optionnel.

Le choix d’hébergement du code dans le monorepo `dalquier/App-perso`, sous `apps/developer-os/`, est précisé par `ADR-002-APP-PERSO-MONOREPO.md`.

## Conséquences
- Le kernel Python de `dalquier/Scriptable#5` n’est pas la base directe de BUILD-01.
- Ses concepts de configuration, santé, diagnostics et tests peuvent inspirer des composants ultérieurs.
- Les modules d’état atomique, historique et sauvegarde sont des références de conception, pas des dépendances obligatoires.
- La Draft autonome, le Builder OpenAI et l’agent autonome sortent du périmètre V1.
- Aucun backend n’est requis pour BUILD-01.
- Les intégrations GitHub automatisées seront ajoutées après validation du noyau local.

## Critères de réexamen
Réexaminer uniquement si une contrainte vérifiée rend impossible l’installation PWA, la persistance locale, l’export/import ou l’expérience iPhone attendue.
