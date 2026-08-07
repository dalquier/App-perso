# DeveloperOS — Audit de reprise

> **Statut : archive historique.** Ce document décrit le point de départ observé le 2026-08-04. Il ne décrit plus l’état courant de DeveloperOS et ne doit pas être utilisé comme roadmap ni comme instruction de déploiement. Les décisions ultérieures `ADR-002-APP-PERSO-MONOREPO.md` et `ADR-004-GITHUB-PAGES-DEPLOYMENT.md`, ainsi que `PROJECT_MANIFEST.md` et `roadmap.md`, prévalent.

Date de référence : 2026-08-04

## Références vérifiées à cette date
- ProjectOS dans `dalquier/App-perso/main`.
- Registre ProjectOS : DeveloperOS était `à migrer/compléter`, dépôt canonique à confirmer.
- Dépôt historique accessible : `dalquier/Scriptable`.
- PR principale alors observée : `dalquier/Scriptable#5`, branche `developeros/build-1`.

## Matrice des versions au point de reprise

| Version | Technologie | Emplacement | Fonctions | Limites | Statut au 2026-08-04 |
|---|---|---|---|---|---|
| Draft v0.1 | Python 3.10 / Pyto / OpenAI API | `Scriptable/DeveloperOS/` | Mission, boucle autonome, reprise par `state.json` | Pas de gestion de projets, tests ou publication GitHub | Prototype |
| Builder v0.1 | Python / Pyto | `Scriptable/DeveloperOS/Builder/` | Indexation, workspace, sauvegardes, validation Python | Pas de push GitHub, duplication partielle de Codex | Prototype |
| Agent | Python | `Scriptable/DeveloperOS/agent/` | État durable, branche, objectif, commit, PR, blocage, historique | Produit incomplet, orienté agent autonome | Incomplet |
| BUILD-1 Kernel | Python 3.11+, package `src`, CLI | PR `dalquier/Scriptable#5` | Lifecycle, configuration, services, santé, diagnostics, logs, tests | Aucune logique métier ni interface | Candidat technique partiel |
| Interface Pyto historique | Pyto UI | Copie GitHub non identifiée | Liste et fiche de projets évoquées | Scroll, clavier, menus, navigation et clics défaillants | À confirmer |
| PWA / Replit | Web | Aucun emplacement canonique retrouvé à cette date | Non vérifié | Existence non démontrée | À confirmer |

## Fonctionnalités alors prouvées
- Persistance JSON et écriture atomique.
- Historique borné.
- État de branche, objectif, dernier commit, dernière PR et blocage.
- Backups avant modification.
- Refus des chemins dangereux.
- Validation syntaxique Python.
- Kernel déterministe, diagnostics sûrs et tests déclarés.

## Fonctions alors non prouvées
- Liste de projets utilisable.
- Fiche, création et modification fiables.
- Priorité, prochaine action et source canonique dans une interface stable.
- PWA installable et hors ligne.
- Synchronisation GitHub.
- Liens ChatGPT/Codex et suivi de déploiements.

Ces éléments ont depuis évolué ; consulter le manifeste et la roadmap vivants plutôt que cette liste historique.

## Bugs et limites connus au point de reprise
- Vues non défilables.
- Clavier masquant les champs.
- Faux menus ou menus bloquants.
- Clics sans effet et vue inerte.
- Retour arrière impossible.
- WebView fragile.
- Données dispersées.
- Dépôt canonique alors absent.
- Aucune exécution GitHub Actions retrouvée pour le commit de tête de la PR #5 ; CI, Ruff et Mypy restaient non prouvés.

## Décisions de reprise prises le 2026-08-04
- Le produit est un poste de pilotage, pas un agent autonome de construction.
- La PWA est l’interface principale.
- Pyto reste un compagnon optionnel.
- Le BUILD-1 kernel n’est pas fusionné ni repris en bloc.
- Les prototypes historiques restent conservés en lecture seule jusqu’à migration documentée.
- Un dépôt dédié `dalquier/DeveloperOS` était alors recommandé ; **cette recommandation a été remplacée par ADR-002**, qui retient `dalquier/App-perso` avec le code sous `apps/developer-os/`.

## Composants à réutiliser conceptuellement
- Écriture atomique et export sauvegardable.
- Modèle d’historique.
- Champs de suivi GitHub.
- Validation, diagnostics et tests.
- Registre local atomique de Launcher Pro V9 à réévaluer lors de l’import de données.

## Point d’arrêt historique
Trois trajectoires non convergées étaient ouvertes : agent autonome, Builder local et kernel générique. Aucune ne livrait alors le gestionnaire de projets iPhone. La reprise a donc commencé par un noyau PWA local-first.

## État courant

Ne pas le déduire de ce document. Charger :

1. `PROJECT_MANIFEST.md` ;
2. `roadmap.md` ;
3. les ADR acceptées ;
4. l’état vivant de `dalquier/App-perso/main`.
