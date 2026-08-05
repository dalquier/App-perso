# DeveloperOS — PROJECT_MANIFEST

## Identité
- ID ProjectOS : `developeros`
- Nom produit : DeveloperOS
- Alias : Developer OS, gestionnaire de projets, Project Manager Pyto, PWA DeveloperOS
- Statut : reprise canonique prête à construire
- Propriétaire : Damien

## Mission
DeveloperOS est le poste de pilotage iPhone des projets personnels de création. Il doit rendre immédiatement visibles la source de vérité, l’état, la priorité, la prochaine action, les références ProjectOS, les branches, Pull Requests, déploiements et conversations liées, sans dépendre de la mémoire de l’utilisateur.

## Utilisateur cible
Damien, utilisateur principal sur iPhone, pilotant plusieurs projets avec ChatGPT, Codex, GitHub, Working Copy, Replit Starter et ponctuellement Pyto.

## Références canoniques
- Dépôt canonique unique : `dalquier/App-perso`.
- Branche principale : `main`.
- Gouvernance, manifeste, ADR, spécifications et script maître : `ProjectOS/projects/DeveloperOS/`.
- Code applicatif canonique : `apps/developer-os/`.
- Historique applicatif à consulter sans modifier : `dalquier/Scriptable`.
- Aucun dépôt séparé `dalquier/DeveloperOS` ne doit être créé pour les premiers Builds.

## Architecture cible
PWA TypeScript principale, installable sur iPhone, local-first et utilisable hors connexion. Replit Starter exécute, teste et déploie le sous-dossier `apps/developer-os/`. Pyto reste un compagnon limité aux fonctions locales iPhone qui ne peuvent pas être réalisées proprement dans la PWA.

Le suivi d’usage agentique est un module officiel de DeveloperOS. Son code compagnon Pyto est prévu sous `apps/developer-os/companions/pyto/agent-usage/`. Il suit les tâches Codex et Work, les relevés de quota et les prévisions, conformément à `ProjectOS/standards/AGENT_USAGE_TRACKING.md` et `ProjectOS/projects/DeveloperOS/docs/AGENT_USAGE_TRACKING_SPEC.md`.

## Règles permanentes
- GitHub est la source de vérité.
- `main` n’est jamais modifiée directement.
- Les développements substantiels sont réalisés par Codex sur une branche dédiée avec tests et Pull Request.
- Replit Starter exécute, teste et déploie ; son agent IA ne reconstruit pas l’application.
- Google Drive n’est ni obligatoire ni canonique.
- Aucun prototype historique n’est supprimé ou écrasé avant inventaire et sauvegarde.
- Une seule interface principale est développée.
- Aucune donnée personnelle, clé, export utilisateur, journal réel ou fichier `.env` ne doit être commis dans le dépôt public.
- Les données réelles de quota et de tâches agentiques restent locales ; seuls le code, les schémas et les exemples anonymisés sont versionnés.
- Toute valeur estimée est visuellement et techniquement distincte d’une valeur observée.

## État vérifié au 2026-08-04
- Une Draft Python/Pyto autonome existe sous `dalquier/Scriptable/Scriptable/DeveloperOS/`.
- Un Builder Python existe sous `Scriptable/DeveloperOS/Builder/`.
- Un agent à état durable existe sous `Scriptable/DeveloperOS/agent/`.
- La PR `dalquier/Scriptable#5`, branche `developeros/build-1`, livre un kernel Python sans interface ni logique métier.
- Aucun workflow GitHub Actions n’a été retrouvé pour le commit de tête de cette PR.
- Aucun déploiement PWA ou Replit canonique n’est confirmé.

## Jalons actifs

### BUILD-01 — Project Core
Créer `apps/developer-os/` et livrer la liste, la fiche, la création/modification, l’état, la priorité, la prochaine action, la source canonique, la persistance locale, l’export/import et une UX iPhone fiable.

### Agent Usage — BUILD-00
Formaliser le suivi du quota agentique et des tâches Codex/Work : gouvernance, modèle de données, attribution, confidentialité, architecture Pyto et direction UX du widget.

### Agent Usage — Builds suivants
- `BUILD-01` : core Pyto local, stockage et tests.
- `BUILD-02` : import par Raccourci iOS et validation humaine.
- `BUILD-03` : widget Pyto moderne, esthétique et professionnel en trois tailles.
- `BUILD-04` : intégration à l’interface principale DeveloperOS.
