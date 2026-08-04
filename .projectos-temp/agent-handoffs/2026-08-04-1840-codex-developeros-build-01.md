# Handoff temporaire — DeveloperOS BUILD-01 Project Core

- État : `construit` — à examiner avant fusion.
- Temporaire : ce fichier n’est pas une documentation canonique et **ne doit pas être fusionné dans `main`** après transfert des informations durables.

## Objectif et périmètre
Construire BUILD-01, une PWA React/TypeScript mobile-first, local-first, installable et hors connexion, exclusivement sous `apps/developer-os/`. Aucun backend, compte, secret, OpenAI, synchronisation distante ou suppression définitive.

## Dépôt, branche et livraison
- Dépôt canonique : `dalquier/App-perso`.
- Base demandée : `main` ; branche locale technique du sandbox : `work`.
- Branche logique : `developeros/build-01-project-core`.
- Livraison : publication GitHub native Codex vers une Pull Request ciblant `main`, sans fusion automatique.
- Commit applicatif : `c1151e5` (`feat(developeros): build project core PWA`).

## Décisions et hypothèses
- React 18 + Vite 5 + TypeScript strict ; dépendances verrouillées par `package-lock.json`.
- IndexedDB natif afin d’éviter une dépendance runtime ; accès derrière `ProjectRepository`.
- Schéma Project V1, base IndexedDB V2 et migration explicite des enregistrements V0.
- Import limité à 2 Mo, validé intégralement, puis remplacement atomique après confirmation. Toute incohérence est refusée.
- Routage par fragment d’URL pour conserver retour navigateur/geste iOS sans serveur configuré pour les routes.
- Service worker manuel network-first, limité au scope de l’application, avec shell hors connexion et nettoyage des caches obsolètes.
- Restauration d’une archive vers l’état `paused`, choix simple et réversible.

## Actions réalisées et fichiers
- Modèle, validation, règles métier, migrations et transfert JSON dans `src/domain/`.
- Contrat et implémentation repository IndexedDB dans `src/repository/`.
- Écrans tableau de bord, fiche, création/modification, archives et réglages dans `src/App.tsx` et `src/components/`.
- UX iPhone, accessibilité, safe areas, modes clair/sombre et réduction des animations dans `src/styles.css`.
- Manifeste, icônes et service worker sous `public/`.
- Tests unitaires, composants, repository, PWA et E2E sous `tests/`.
- Installation, exploitation, Replit, recette iPhone, limites et rollback dans `README.md`; version 0.1.0 dans `CHANGELOG.md`.

## Tests exécutés
- `npm ci` : réussi, 366 paquets installés ; 0 test ; audit npm global signale 5 vulnérabilités dans les dépendances de développement.
- `npm run lint` : réussi ; 0 test.
- `npm run typecheck` : réussi ; 0 test.
- `npm run test:unit` : 6 réussis, 0 échoué, 0 ignoré.
- `npm run test:components` : 5 réussis, 0 échoué, 0 ignoré.
- `npm run test:repository` : 4 réussis, 0 échoué, 0 ignoré.
- `npm run test:pwa` : 2 réussis, 0 échoué, 0 ignoré.
- `npm run build` : réussi ; 36 modules transformés ; 0 test.
- `npm run test:e2e` : 8 réussis, 0 échoué, 0 ignoré sur 320×568 et 390×844, y compris hors connexion automatisé.
- `npm audit --omit=dev` : réussi ; 0 vulnérabilité runtime.
- Capture visuelle automatisée 390×844 créée hors dépôt et inspectée : réussie.

## Limites, risques et points ouverts
- Recette physique iPhone/Safari (installation, clavier réel, geste retour, Dynamic Island, VoiceOver, texte agrandi) non exécutée et obligatoire avant fusion.
- Replit n’a pas été exécuté ; les commandes ciblées sont documentées et restent à vérifier.
- Les E2E émulent des dimensions iPhone dans Chromium, pas le moteur Safari/WebKit.
- Les icônes PWA SVG doivent être confirmées sur les versions Safari ciblées.
- IndexedDB peut être purgé par iOS ; l’export régulier reste nécessaire.
- `npm audit` complet remonte 5 vulnérabilités de toolchain de développement ; le graphe runtime contrôlé par `npm audit --omit=dev` en remonte 0.

## Prochaine action
Relire le diff et ce handoff, publier la branche/PR avec le mécanisme natif Codex, effectuer les recettes iPhone et Replit, transférer les éventuelles informations durables, puis supprimer ce handoff de la PR avant fusion.

## Pull Request
- Titre proposé : `DeveloperOS — BUILD-01 — Project Core`
- Statut : création demandée après commits ; aucune fusion autorisée.
