# BUILD-01 — Vérification REVIEW-01

Date : 2026-08-04. Environnement local : conteneur Codex Linux, Node `v20.20.2`, npm `11.4.2`.

## Séquence finale exécutée

- `npm ci` : réussi, 590 paquets installés, 0 vulnérabilité auditée.
- `npm run lint` : réussi.
- `npm run typecheck` : réussi.
- `npm run test:unit` : réussi, 2 fichiers, 7 tests.
- `npm run test:components` : réussi, 2 fichiers, 5 tests.
- `npm run test:repository` : réussi, 1 fichier, 5 tests.
- `npm run test:pwa` : réussi, 1 fichier, 1 test statique CSP/manifeste/icônes/navigation fallback.
- `npm run build` : réussi ; Vite 7.3.6, 45 modules, `dist/manifest.webmanifest`, `dist/sw.js`, Workbox et 16 entrées précachées générés.
- `npm run playwright:install` : partiel ; les dépendances Linux Chromium ont été installées avec la commande officielle `playwright install --with-deps chromium`, mais le téléchargement du navigateur Playwright a échoué dans le sandbox sur `cdn.playwright.dev` avec HTTP 403 `Domain forbidden`.
- `npm run test:e2e` : exécuté après `npm run build`, échec environnemental local ; 6 scénarios mobiles découverts mais impossibles à lancer car le binaire Chromium Playwright manque suite au HTTP 403.
- `npm audit --audit-level=low` : réussi, 0 vulnérabilité.
- `npm audit --omit=dev --audit-level=low` : réussi, 0 vulnérabilité.

## CI et E2E reproductibles

Le workflow GitHub Actions `.github/workflows/developer-os.yml` exécute `npm ci`, l’installation officielle `npx playwright install --with-deps chromium`, lint, TypeScript, tests unitaires, composants, repository, PWA, build et E2E mobiles depuis `apps/developer-os/`. La CI ne met pas `continue-on-error` sur les étapes obligatoires et publie rapports/traces Playwright uniquement en cas d’échec.

## Limites restantes

La CI GitHub réelle du nouveau SHA ne peut pas être déclarée verte avant publication native de la PR #23. La validation matérielle Safari/iPhone reste obligatoire : installation écran d’accueil, safe areas, clavier, mode avion, gestes retour, VoiceOver, clavier physique iOS et Dynamic Island. Les changements IndexedDB `onblocked` / multi-onglets et Safari doivent aussi être confirmés manuellement.
