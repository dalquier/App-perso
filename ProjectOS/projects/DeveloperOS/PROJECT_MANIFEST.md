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

Conversation Orchestrator est un module officiel postérieur au noyau Project Core. Il prépare et orchestre plusieurs prompts fils, permet le choix par mission entre l’API OpenAI et un flux manuel ChatGPT Plus par copier-coller, parallélise les missions indépendantes et remet les réponses normalisées au prompt maître. Sa décision d’architecture et sa spécification sont définies dans `ADR/ADR-003-CONVERSATION-ORCHESTRATOR-DUAL-EXECUTION.md` et `docs/CONVERSATION_ORCHESTRATOR_SPEC.md`.

## Règles permanentes
- GitHub est la source de vérité.
- `main` n’est jamais modifiée directement.
- Les développements substantiels sont réalisés par Codex sur une branche dédiée avec tests et Pull Request.
- Replit Starter exécute, teste et déploie ; son agent IA ne reconstruit pas l’application.
- Google Drive n’est ni obligatoire ni canonique.
- Aucun prototype historique n’est supprimé ou écrasé avant inventaire et sauvegarde.
- Une seule interface principale est développée.
- Aucune donnée personnelle, clé, export utilisateur, journal réel ou fichier `.env` ne doit être commis dans le dépôt public.
- Les données réelles de quota, de tâches agentiques, de prompts et de réponses restent locales ou privées ; seuls le code, les schémas et les exemples anonymisés sont versionnés.
- Toute valeur estimée est visuellement et techniquement distincte d’une valeur observée.
- L’interface ChatGPT grand public n’est jamais automatisée pour extraire ses réponses ; le canal ChatGPT Plus reste un flux manuel explicite de copier-coller.
- La clé OpenAI API reste côté serveur et n’est jamais exposée dans la PWA, IndexedDB, GitHub, les exports ou les journaux.

## État vérifié au 2026-08-05
- Une Draft Python/Pyto autonome existe sous `dalquier/Scriptable/Scriptable/DeveloperOS/`.
- Un Builder Python existe sous `Scriptable/DeveloperOS/Builder/`.
- Un agent à état durable existe sous `Scriptable/DeveloperOS/agent/`.
- La PR `dalquier/Scriptable#5`, branche `developeros/build-1`, livre un kernel Python sans interface ni logique métier.
- Aucun workflow GitHub Actions n’a été retrouvé pour le commit de tête de cette PR.
- Aucun déploiement PWA ou Replit canonique n’est confirmé.
- `Agent Usage — BUILD-01` est fusionné dans `main` sous `apps/developer-os/companions/pyto/agent-usage/`.
- `Conversation Orchestrator — SPEC-00` définit le double canal ChatGPT Plus manuel / OpenAI API, le nommage des prompts fils, le contrat JSON et les règles de parallélisation.

## Jalons actifs

### BUILD-01 — Project Core
Créer `apps/developer-os/` et livrer la liste, la fiche, la création/modification, l’état, la priorité, la prochaine action, la source canonique, la persistance locale, l’export/import et une UX iPhone fiable.

### Agent Usage — BUILD-00
Formaliser le suivi du quota agentique et des tâches Codex/Work : gouvernance, modèle de données, attribution, confidentialité, architecture Pyto et direction UX du widget.

### Agent Usage — Builds suivants
- `BUILD-01` : core Pyto local, stockage et tests — fusionné.
- `BUILD-02` : import par Raccourci iOS et validation humaine.
- `BUILD-03` : widget Pyto moderne, esthétique et professionnel en trois tailles.
- `BUILD-04` : intégration à l’interface principale DeveloperOS.

### Conversation Orchestrator — SPEC-00
Formaliser le double mode d’exécution, le contrat JSON, le nommage déterministe, les dépendances, la parallélisation, la collecte et la synthèse maître.

### Conversation Orchestrator — Builds suivants
- `CO-BUILD-00` : contrats, types, validation, nommage, graphe et machine d’états.
- `CO-BUILD-01` : mode ChatGPT Plus manuel et persistance locale.
- `CO-BUILD-02` : backend et mode OpenAI API.
- `CO-BUILD-03` : mode hybride et synthèse maître.
- `CO-QA-01` : validation automatisée, Replit sans agent IA et recette iPhone.
