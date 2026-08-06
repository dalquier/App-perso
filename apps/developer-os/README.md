# DeveloperOS — BUILD-01 Project Core

PWA mobile-first et local-first pour piloter des projets personnels sur iPhone. Les données restent dans IndexedDB ; aucun compte, backend, secret ou service distant n'est requis.

## Installation et commandes

Prérequis stricts : Node.js `20.20.2` et npm `11.4.2`, versions identiques à la CI DeveloperOS.

```bash
cd apps/developer-os
npm ci
npm run icons:generate
npm run dev
npm run lint
npm run typecheck
npm run test:unit
npm run test:components
npm run test:repository
npm run test:pwa
npm run build
npm run playwright:install
npm run test:e2e
npm run preview
npm audit --audit-level=low
npm audit --omit=dev --audit-level=low
```

Les PNG iPhone/PWA sont générés depuis la source SVG textuelle versionnée `public/icons/icon-512.svg` par `npm run icons:generate`; les fichiers `public/icons/apple-touch-icon-180.png`, `public/icons/icon-192.png` et `public/icons/icon-512.png` sont ignorés par Git et ne doivent pas être publiés par Codex. `npm run dev`, `npm run build` et `npm run test:pwa` régénèrent ces PNG avant utilisation. Le build statique est produit dans `dist/`. Les E2E utilisent le build de production via `npm run preview -- --port 4173` et les projets Chromium iPhone SE / iPhone 13 définis dans `playwright.config.ts`.

## Architecture

- `src/domain/` : modèle Project versionné, limites de champs, validation de dates, sources canoniques et import/export JSON.
- `src/data/` : interface repository et implémentation IndexedDB (`idb`), avec transaction pour l'unicité du projet actif et gestion minimale `onblocked` / `onversionchange`.
- `src/routing.tsx` : routeur local léger basé sur l'historique navigateur, sans backend ni dépendance de routage serveur.
- `src/pages/`, `src/components/` : React, contrôles HTML natifs accessibles, liste, fiche, création, modification, archives, restauration et réglages.
- `scripts/generate-icons.mjs` : génération reproductible des icônes PNG 180/192/512 depuis le SVG versionné, avant dev/build/tests PWA.
- `vite-plugin-pwa` : manifeste installable, icônes PNG générées et SVG source complémentaire, service worker Workbox, navigation fallback et nettoyage des caches obsolètes.

Une CSP meta BUILD-01 limite scripts, styles, connexions, objets, base URI et frames à l'origine locale. `style-src 'unsafe-inline'` est conservé uniquement pour compatibilité du build statique et de l'attribut style éventuellement produit par l'environnement navigateur ; aucune ressource distante n'est nécessaire.

## Modèle de données et validations

Le schéma et les exports ont la version `1`. Un projet contient exclusivement les clés canoniques `id`, `schemaVersion`, `name`, `aliases`, `status`, `priority`, `nextAction`, `canonicalSourceType`, `canonicalSource`, `lastKnownState`, `isActive`, `createdAt`, `updatedAt`.

Contraintes appliquées : nom obligatoire et limité, alias bornés, textes longs bornés, `updatedAt >= createdAt`, un seul projet actif, projet archivé non actif, source canonique textuelle validée par type, import JSON limité à 512 Ko, clés dangereuses `__proto__`, `prototype`, `constructor` rejetées, champs inconnus ordinaires ignorés avec avertissement de prévalidation. BUILD-01 ne propose aucune suppression définitive de projet individuel : l'archivage est réversible depuis **Réglages → Projets archivés** ; la réinitialisation globale reste protégée par confirmation.

## Import destructif et sauvegarde préalable

L'import par remplacement suit cette séquence : lecture et validation complète du fichier, génération d'un export JSON valide des données courantes, proposition explicite de téléchargement `developeros-backup-before-import-YYYY-MM-DD.json`, attente d'une confirmation utilisateur claire, puis remplacement IndexedDB dans une transaction. Annuler l'import ou échouer avant confirmation ne mute pas les données locales. Si la transaction échoue avant commit, l'ancien contenu reste intact.

## UX iPhone

Les vues sont défilables et utilisent le viewport dynamique, les safe areas iOS, des cibles tactiles de 44 px minimum, des champs à 16 px et une barre d'actions visible. Les états et priorités utilisent de vrais `select` natifs. La sortie d'un formulaire modifié demande confirmation.

## Validation réalisée

Les preuves détaillées figurent dans `docs/BUILD-01-VERIFICATION.md`.

La validation finale de la PR #28 a confirmé :

- CI GitHub DeveloperOS entièrement verte, y compris lint, TypeScript, tests unitaires, composants, repository, PWA, build et E2E mobiles Playwright ;
- preview HTTPS reproductible dans Replit depuis la branche GitHub canonique ;
- installation réelle de la PWA depuis Safari sur iPhone ;
- lancement et modification hors connexion après premier chargement ;
- persistance IndexedDB après fermeture et relance ;
- archivage d'un projet actif, accès aux archives et restauration en pause sans réactivation ;
- export JSON puis import avec sauvegarde préalable, annulation sans mutation et remplacement confirmé.

## Recette iPhone complémentaire recommandée

Les contrôles suivants restent utiles en non-régression mais ne bloquent pas BUILD-01 :

- audit approfondi VoiceOver et texte agrandi à 200 % ;
- paysage et clavier physique iOS ;
- scénarios IndexedDB multi-onglets, quota et pression de stockage Safari ;
- vérification sur d'autres versions matérielles et logicielles d'iPhone.

## Replit Starter (sous-dossier uniquement)

Importer `dalquier/App-perso`, sans agent IA ni secret. Répertoire de travail : `apps/developer-os/`. Installation : `npm ci`. Installation E2E : `npm run playwright:install` (nécessite accès au CDN Playwright et paquets Linux). Exécution : `npm run dev -- --port 3000`. Build : `npm run build`. Déploiement statique : `dist/`. Replit reste un environnement reproductible, jamais la source du code ou des données.

## Limites restantes

IndexedDB peut être purgé par Safari/iOS ; un export régulier reste recommandé. Aucun appel réseau ne vérifie les sources canoniques. BUILD-01 n'inclut volontairement ni backend, ni authentification, ni synchronisation distante, ni OpenAI. L'avertissement GitHub Actions relatif à la future migration du runtime Node des actions est non bloquant et devra être traité lors d'une maintenance de la CI.

## Retour arrière

Exporter avant une évolution. Revenir au commit/tag précédent pour le code. Toute version de schéma future doit sauvegarder et migrer explicitement sans effacement silencieux.
