# Changelog

Le `package.json` conserve actuellement la version applicative `0.1.0`. Le présent changelog distingue l’état réellement intégré dans `main` des travaux encore ouverts ; aucune version SemVer supplémentaire n’est inventée par la mise à jour de gouvernance.

## En cours — CO-BUILD-02

- Draft PR #83 : `CO-BUILD-02 — Incrément A backend OpenAI API`.
- Head vérifié lors de GOV-02 : `626e6d4396208f7a4dbf7d9c2e99373d0f8fb403`.
- Prépare configuration serveur, limites, validation d’environnement, contrats d’exécution, provider fictif déterministe et tests serveur.
- Hors `main` tant que la PR n’est pas fusionnée.
- Ne contient pas encore serveur HTTP, authentification, stockage serveur réel, scheduler, SDK OpenAI réel, UI API ou CO-BUILD-03.
- `CO-QA-02A` est déclaré en cours ; aucune PR ou documentation canonique portant exactement cet identifiant n’a été trouvée lors de GOV-02.

## Intégré dans `main` — 2026-08-07

### BUILD-02R V3

- PR #86 intégrée.
- Ajout des points de reprise horodatés avec historique borné à 100 entrées par projet.
- Ajout de références manuelles HTTPS sécurisées, ouvrables explicitement et supprimables après confirmation.
- Compatibilité des projets legacy par normalisation sur le schéma IndexedDB v3.
- Préservation testée de `codexConversations` et `conversation-runs` lors des opérations limitées au store `projects`.

### CI-V2

- PR #78 intégrée.
- Déclenchement sur Pull Requests et `main` pour le périmètre DeveloperOS.
- Ajout de `workflow_dispatch`, concurrence, timeout et artefacts E2E en cas d’échec.
- Conservation de lint, TypeScript, tests unitaires, composants, repository, PWA, build et E2E mobiles.

### GitHub Pages

- PR #89 `PAGES-01` intégrée.
- Configuration Vite/PWA pour `/App-perso/developer-os/`.
- Routage compatible hébergement statique.
- Workflow GitHub Pages officiel.
- PR #92 intégrée pour publier l’artefact sous le sous-dossier `developer-os/`.
- URL cible : `https://dalquier.github.io/App-perso/developer-os/`.

### CO-BUILD-01

- PR #70 intégrée.
- Commit d’intégration : `51178d642b6dcc2099a4e378f79f3b133f1bd3b1`.
- Persistance locale des runs Conversation Orchestrator.
- Import/export strict sans écrasement silencieux.
- Canal `chatgpt_plus_manual` avec préparation, lancement manuel, import de réponse et retry.
- IndexedDB porté à la version 3 avec les stores `projects`, `codexConversations` et `conversation-runs`.

## Intégré dans `main` — 2026-08-06

### Conversations Codex

- PR #58 intégrée.
- Domaine et repository local-first dédiés aux conversations Codex.
- Création, recherche, filtres, modification, archivage, import/export et association à un projet.
- Lancement explicite : sauvegarde, copie du prompt, ouverture de Codex, sans collage ni envoi automatique.
- IndexedDB avait alors introduit le store `codexConversations`, ensuite consolidé dans le schéma v3.

### CO-BUILD-00

- PR #60 intégrée.
- Contrats V1, types TypeScript, validation stricte, plan déterministe, graphe de dépendances, contexte injecté et machine d’états Conversation Orchestrator.

### Clipboard

- PR #69 intégrée.
- Correction du test du chemin d’échec `navigator.clipboard.writeText` sans modification du comportement applicatif de secours.

## 0.1.1 — 2026-08-06 — Corrections REVIEW-01 et clôture BUILD-01

- Ajout d’une CI DeveloperOS dédiée avec installation verrouillée, Playwright Chromium, tests obligatoires et artefacts d’échec.
- Durcissement import/export : sauvegarde préalable récupérable, validation stricte, champs inconnus non persistés, clés dangereuses rejetées et sources canoniques sécurisées.
- Renforcement IndexedDB : erreurs structurées, `versionchange`, transaction de remplacement protégée et tests `fake-indexeddb`.
- Ajout d’une CSP BUILD-01, d’icônes PNG iOS/PWA, de tests PWA et d’E2E offline sur build de production.
- Retrait de React Router pour conserver un routeur local statique sans backend.
- Correction de l’historique de navigation après modification d’un projet et durcissement des sélecteurs E2E accessibles.
- Ajout de l’archivage confirmé, de la liste des projets archivés et de la restauration en pause sans réactivation.
- Validation réelle historique de BUILD-01 sur iPhone et dans son environnement de preview de l’époque.

## 0.1.0 — 2026-08-04

- PWA installable, mobile-first et hors connexion.
- Liste, recherche, filtre, fiche, création et modification.
- Projet actif unique, états, priorités, prochaine action et source canonique.
- IndexedDB, export/import JSON versionné et paramètres protégés.
- Tests unitaires, composants, repository et E2E iPhone.
