# Changelog

## 0.1.1 — 2026-08-04 — Corrections REVIEW-01

- Ajout d’une CI DeveloperOS dédiée avec installation verrouillée, Playwright Chromium, tests obligatoires et artifacts d’échec.
- Durcissement import/export : backup préalable récupérable, validation stricte, champs inconnus non persistés, clés dangereuses rejetées et sources canoniques sécurisées.
- Renforcement IndexedDB : erreurs structurées, versionchange, transaction de remplacement protégée et tests fake-indexeddb.
- Ajout CSP BUILD-01, icônes PNG iOS/PWA, tests PWA et E2E offline production.
- Retrait de React Router pour supprimer les advisories audit et conserver un routeur local statique sans backend.
- Reformatage des sources monolignes et documentation des limites restantes iPhone/Replit/GitHub Actions.

## 0.1.0 — 2026-08-04

- PWA installable, mobile-first et hors connexion.
- Liste, recherche, filtre, fiche, création et modification.
- Projet actif unique, états, priorités, prochaine action et source canonique.
- IndexedDB, export/import JSON versionné et paramètres protégés.
- Tests unitaires, composants, repository et E2E iPhone.
