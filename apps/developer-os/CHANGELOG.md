# Changelog

## Non publié — BUILD-02R

- Ajout des points de reprise horodatés avec historique borné à 100 entrées par projet.
- Ajout de références manuelles HTTPS sécurisées, ouvrables explicitement et supprimables après confirmation.
- Compatibilité des projets legacy par normalisation sur le schéma IndexedDB v3, sans nouveau store ni montée de version BUILD-02R, avec préservation testée de `codexConversations` et `conversation-runs`.
- Ajout des tests domaine, composants, repository, import/export et E2E mobile.

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
