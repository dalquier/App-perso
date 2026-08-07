# ADR-001 — Architecture cible de DeveloperOS

- Statut : accepté
- Date : 2026-08-04
- Mise à jour de gouvernance : 2026-08-07

> La décision de PWA principale, local-first, IndexedDB, service worker et compagnon Pyto reste valide. La clause historique qui désignait Replit Starter comme cible d’hébergement/déploiement est remplacée par `ADR-004-GITHUB-PAGES-DEPLOYMENT.md`.

## Contexte
Les versions retrouvées se répartissent entre prototypes Python/Pyto autonomes, Builder local, agent à état durable et kernel Python sans interface. Les prototypes d’interface Pyto ont rencontré des défauts structurants : défilement, clavier, navigation, menus et clics inertes. La vision exige une application iPhone moderne, installable, fiable et local-first.

## Options évaluées en 2026-08-04

### 1. PWA principale avec Replit
Bonne UX iPhone, vrais contrôles web, défilement et clavier testables, installation écran d’accueil, service worker et déploiement simple selon l’hypothèse initiale.

### 2. Application Pyto principale
Bonne proximité avec les fichiers locaux et Python existant, mais UI, navigation, clavier, distribution et tests d’interface moins fiables.

### 3. PWA principale avec compagnon Pyto
Conserve les avantages de la PWA et réserve Pyto aux opérations locales spécifiques, sans créer deux interfaces concurrentes.

## Décision structurelle conservée
Adopter l’option 3 :
- PWA TypeScript principale, installable et local-first ;
- stockage V1 dans IndexedDB avec export/import JSON versionné ;
- service worker pour le hors connexion ;
- GitHub comme source canonique ;
- Pyto uniquement comme compagnon local optionnel.

La cible d’hébergement/déploiement est désormais définie par ADR-004 : GitHub Pages pour le client PWA. Replit n’est plus une dépendance cible de déploiement DeveloperOS.

Le choix d’hébergement du code dans le monorepo `dalquier/App-perso`, sous `apps/developer-os/`, est précisé par `ADR-002-APP-PERSO-MONOREPO.md`.

## Conséquences
- Le kernel Python de `dalquier/Scriptable#5` n’est pas la base directe de BUILD-01.
- Ses concepts de configuration, santé, diagnostics et tests peuvent inspirer des composants ultérieurs.
- Les modules d’état atomique, historique et sauvegarde sont des références de conception, pas des dépendances obligatoires.
- La Draft autonome, le Builder OpenAI et l’agent autonome sortent du périmètre V1.
- Aucun backend n’était requis pour BUILD-01.
- Les intégrations distantes sont ajoutées par Builds dédiés après validation du noyau local.
- Le backend futur de Conversation Orchestrator reste séparé du client statique et n’est pas couvert par l’hébergement GitHub Pages.

## Critères de réexamen
Réexaminer l’architecture principale uniquement si une contrainte vérifiée rend impossible l’installation PWA, la persistance locale, l’export/import ou l’expérience iPhone attendue. Réexaminer séparément la cible de déploiement selon les critères d’ADR-004.
