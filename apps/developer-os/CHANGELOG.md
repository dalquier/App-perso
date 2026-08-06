# Changelog

## 0.1.1 — 2026-08-06 — Corrections REVIEW-01 et clôture BUILD-01

- Ajout d’une CI DeveloperOS dédiée avec installation verrouillée, Playwright Chromium, tests obligatoires et artefacts d’échec.
- Durcissement import/export : sauvegarde préalable récupérable, validation stricte, champs inconnus non persistés, clés dangereuses rejetées et sources canoniques sécurisées.
- Renforcement IndexedDB : erreurs structurées, `versionchange`, transaction de remplacement protégée et tests `fake-indexeddb`.
- Ajout d’une CSP BUILD-01, d’icônes PNG iOS/PWA, de tests PWA et d’E2E offline sur build de production.
- Retrait de React Router pour supprimer les alertes d’audit et conserver un routeur local statique sans backend.
- Correction de l’historique de navigation après modification d’un projet et durcissement des sélecteurs E2E accessibles.
- Ajout de l’archivage confirmé, de la liste des projets archivés et de la restauration en pause sans réactivation.
- Validation réelle dans Replit et sur iPhone : installation PWA, fonctionnement hors connexion, persistance IndexedDB, archivage/restauration et export/import avec sauvegarde préalable.
- Reformatage des sources et mise à jour de la documentation finale de vérification.

## 0.1.0 — 2026-08-04

- PWA installable, mobile-first et hors connexion.
- Liste, recherche, filtre, fiche, création et modification.
- Projet actif unique, états, priorités, prochaine action et source canonique.
- IndexedDB, export/import JSON versionné et paramètres protégés.
- Tests unitaires, composants, repository et E2E iPhone.
