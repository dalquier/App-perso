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
- `src/pages/`, `src/components/` : React, contrôles HTML natifs accessibles, import/export, liste, fiche, création et modification.
- `scripts/generate-icons.mjs` : génération reproductible des icônes PNG 180/192/512 depuis le SVG versionné, avant dev/build/tests PWA.
- `vite-plugin-pwa` : manifeste installable, icônes PNG générées et SVG source complémentaire, service worker Workbox, navigation fallback et nettoyage des caches obsolètes.

Une CSP meta BUILD-01 limite scripts, styles, connexions, objets, base URI et frames à l'origine locale. `style-src 'unsafe-inline'` est conservé uniquement pour compatibilité du build statique et de l'attribut style éventuellement produit par l'environnement navigateur ; aucune ressource distante n'est nécessaire.

## Modèle de données et validations

Le schéma et les exports ont la version `1`. Un projet contient exclusivement les clés canoniques `id`, `schemaVersion`, `name`, `aliases`, `status`, `priority`, `nextAction`, `canonicalSourceType`, `canonicalSource`, `lastKnownState`, `isActive`, `createdAt`, `updatedAt`.

Contraintes appliquées : nom obligatoire et limité, alias bornés, textes longs bornés, `updatedAt >= createdAt`, un seul projet actif, projet archivé non actif, source canonique textuelle validée par type, import JSON limité à 512 Ko, clés dangereuses `__proto__`, `prototype`, `constructor` rejetées, champs inconnus ordinaires ignorés avec avertissement de prévalidation. BUILD-01 ne propose aucune suppression définitive de projet individuel : utiliser l'état Archivé ; la réinitialisation globale reste protégée par confirmation.

## Import destructif et sauvegarde préalable

L'import par remplacement suit cette séquence : lecture et validation complète du fichier, génération d'un export JSON valide des données courantes, proposition explicite de téléchargement `developeros-backup-before-import-YYYY-MM-DD.json`, attente d'une confirmation utilisateur claire, puis remplacement IndexedDB dans une transaction. Annuler l'import ou échouer avant confirmation ne mute pas les données locales. Si la transaction échoue avant commit, l'ancien contenu reste intact.

## UX iPhone

Les vues sont défilables et utilisent le viewport dynamique, les safe areas iOS, des cibles tactiles de 44 px minimum, des champs à 16 px et une barre d'actions visible. Les états et priorités utilisent de vrais `select` natifs. La sortie d'un formulaire modifié demande confirmation.

## Tests réellement exécutés

Les résultats réels sont dans `docs/BUILD-01-VERIFICATION.md`. Les tests couvrent modèle/export, sources dangereuses, import durci, sauvegarde avant remplacement, formulaire React et vrais `select`, repository IndexedDB, unicité du projet actif, remplacement atomique, CSP/PWA statique et scénarios Playwright mobiles production/offline prêts pour CI.

## Procédure iPhone non encore validée physiquement

1. Servir `dist/` en HTTPS, ouvrir dans Safari, puis **Partager → Sur l'écran d'accueil**.
2. Vérifier l'icône iOS PNG 180×180 et le manifeste 192×192 / 512×512.
3. Créer un projet et faire défiler le formulaire avec le clavier ouvert sur les champs du bas.
4. Tester les sélecteurs natifs, Annuler et la confirmation d'abandon.
5. Fermer/rouvrir : vérifier données et projet actif unique.
6. Exporter, vérifier le backup préalable, puis réimporter une sauvegarde.
7. Après un premier chargement, passer en mode avion et vérifier liste, fiche, reload offline et persistance IndexedDB.
8. Vérifier geste retour, safe areas, mode sombre, orientations, VoiceOver, clavier physique iOS et Dynamic Island.

## Replit Starter (sous-dossier uniquement)

Importer `dalquier/App-perso`, sans agent IA ni secret. Répertoire de travail : `apps/developer-os/`. Installation : `npm ci`. Installation E2E : `npm run playwright:install` (nécessite accès au CDN Playwright et paquets Linux). Exécution : `npm run dev -- --port 3000`. Build : `npm run build`. Déploiement statique : `dist/`. Replit reste un environnement reproductible, jamais la source du code ou des données.

## Limites restantes

La validation GitHub Actions réelle du nouveau commit, Replit, Safari/iPhone, installation écran d'accueil, VoiceOver, clavier physique iOS, Dynamic Island et multi-onglets IndexedDB/Safari reste à observer après publication de la PR #23. Aucun appel réseau ne vérifie les sources canoniques.

## Retour arrière

Exporter avant une évolution. Revenir au commit/tag précédent pour le code. Toute version de schéma future doit sauvegarder et migrer explicitement sans effacement silencieux.
