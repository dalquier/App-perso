# DeveloperOS — PROJECT_MANIFEST

## Identité
- ID ProjectOS : `developeros`
- Nom produit : DeveloperOS
- Alias : Developer OS, gestionnaire de projets, Project Manager Pyto, PWA DeveloperOS
- Statut : actif — CO-BUILD-02 en cours
- Propriétaire : Damien

## Mission
DeveloperOS est le poste de pilotage iPhone des projets personnels de création. Il rend visibles la source de vérité, l’état, la priorité, la prochaine action, les références ProjectOS, les branches, Pull Requests, déploiements et conversations liées, sans dépendre de la mémoire de l’utilisateur.

## Utilisateur cible
Damien, utilisateur principal sur iPhone, pilotant plusieurs projets avec ChatGPT, Codex, GitHub, Working Copy et ponctuellement Pyto. Replit peut être utilisé comme environnement optionnel de reproduction ou de diagnostic, mais n’est plus une dépendance cible de DeveloperOS.

## Références canoniques
- Dépôt canonique unique : `dalquier/App-perso`.
- Branche principale : `main`.
- Gouvernance, manifeste, ADR, spécifications et script maître : `ProjectOS/projects/DeveloperOS/`.
- Roadmap canonique : `ProjectOS/projects/DeveloperOS/roadmap.md`.
- Code applicatif canonique : `apps/developer-os/`.
- Historique applicatif à consulter sans modifier : `dalquier/Scriptable`.
- Aucun dépôt séparé `dalquier/DeveloperOS` ne doit être créé sans nouvelle décision documentée.

## Architecture cible
DeveloperOS est une PWA TypeScript/React/Vite mobile-first, installable sur iPhone, local-first et utilisable hors connexion après chargement initial.

- Client principal : `apps/developer-os/`.
- Persistance locale : IndexedDB version 3.
- Stores canoniques : `projects`, `codexConversations`, `conversation-runs`.
- Déploiement PWA canonique : GitHub Pages sous `https://dalquier.github.io/App-perso/developer-os/`.
- Chaîne de déploiement : `.github/workflows/developer-os-pages.yml`.
- CI applicative : `.github/workflows/developer-os.yml`.
- Pyto : compagnon limité aux fonctions locales iPhone qui ne peuvent pas être réalisées proprement dans la PWA.
- Replit : environnement optionnel, non canonique et non requis pour l’hébergement ou le déploiement de la PWA.

La décision de déploiement est définie dans `ADR/ADR-004-GITHUB-PAGES-DEPLOYMENT.md`. Elle remplace les anciennes clauses désignant Replit Starter comme cible d’hébergement ou de déploiement DeveloperOS.

Le suivi d’usage agentique est un module officiel de DeveloperOS. Son code compagnon Pyto se trouve sous `apps/developer-os/companions/pyto/agent-usage/` et suit les règles de `ProjectOS/standards/AGENT_USAGE_TRACKING.md` et `docs/AGENT_USAGE_TRACKING_SPEC.md`.

Conversation Orchestrator est un module officiel postérieur au noyau Project Core. Il prépare et orchestre plusieurs prompts fils, permet le choix par mission entre l’API OpenAI et un flux manuel ChatGPT Plus par copier-coller, parallélise les missions indépendantes et remet les réponses normalisées au prompt maître. Sa décision d’architecture et sa spécification sont définies dans `ADR/ADR-003-CONVERSATION-ORCHESTRATOR-DUAL-EXECUTION.md` et `docs/CONVERSATION_ORCHESTRATOR_SPEC.md`.

## Règles permanentes
- GitHub est la source de vérité.
- `main` n’est jamais modifiée directement.
- Les développements substantiels sont réalisés sur une branche dédiée avec tests et Pull Request.
- La PWA DeveloperOS est publiée par GitHub Pages ; Replit n’est pas une étape obligatoire de livraison.
- Google Drive n’est ni obligatoire ni canonique pour le code DeveloperOS.
- Aucun prototype historique n’est supprimé ou écrasé avant inventaire et sauvegarde.
- Une seule interface principale est développée.
- Aucune donnée personnelle, clé, export utilisateur, journal réel ou fichier `.env` ne doit être commis dans le dépôt public.
- Les données réelles de quota, de tâches agentiques, de prompts et de réponses restent locales ou privées ; seuls le code, les schémas et les exemples anonymisés sont versionnés.
- Toute valeur estimée est visuellement et techniquement distincte d’une valeur observée.
- L’interface ChatGPT grand public n’est jamais automatisée pour extraire ses réponses ; le canal ChatGPT Plus reste un flux manuel explicite de copier-coller.
- La clé OpenAI API reste côté serveur et n’est jamais exposée dans la PWA, IndexedDB, GitHub, les exports ou les journaux.
- Le backend futur de CO-BUILD-02 est séparé de l’hébergement statique GitHub Pages et doit disposer d’un runtime privé adapté avant toute mise en production.

## État vérifié au 2026-08-07

### Travaux intégrés dans `main`
- `BUILD-01 — Project Core` est intégré sous `apps/developer-os/`.
- PR #58 : module Conversations Codex, intégré.
- PR #60 : `CO-BUILD-00 — contrats et fondations`, intégré.
- PR #69 : correction du test de secours Clipboard, intégrée.
- PR #70 : `CO-BUILD-01 — Persistance et mode ChatGPT Plus manuel`, intégrée.
- Commit d’intégration CO-BUILD-01 : `51178d642b6dcc2099a4e378f79f3b133f1bd3b1`.
- IndexedDB est en version 3 avec `projects`, `codexConversations` et `conversation-runs`.
- PR #78 : `CI-V2`, intégrée.
- PR #86 : `BUILD-02R V3`, intégrée sans régression des trois stores IndexedDB.
- PR #89 : `PAGES-01`, intégrée.
- PR #92 : correction de publication sous `/developer-os/`, intégrée.
- PR #103 : `CO-BUILD-02 — Incrément A`, intégrée après reconstruction depuis le `main` canonique et correction de CO-QA-02A.
- Commit d’intégration CO-BUILD-02A : `b22fd5002c4ead8ef73a8927c89f81b9d8b4ff23`.
- La configuration Vite et PWA cible `/App-perso/developer-os/`.

### Travaux ouverts
- `CO-BUILD-02` reste en cours ; son Incrément A est désormais intégré.
- PR #83 est fermée sans fusion et conservée uniquement pour traçabilité ; elle est supersédée par PR #103.
- `CO-QA-02A` est terminé : le défaut d’immutabilité imbriquée de `ProviderResult.usageObserved` a été corrigé et couvert par test dans PR #103.
- La prochaine unité de travail est la préparation bornée de l’Incrément B depuis le `main` vivant.

### Travaux futurs
- Terminer CO-BUILD-02 par incréments bornés avec QA entre les incréments lorsque le lot suivant dépend du résultat.
- Ne démarrer CO-BUILD-03 qu’après clôture de CO-BUILD-02 et de ses QA bloquants.
- Réaliser ensuite une recette finale Conversation Orchestrator couvrant les deux canaux, l’hybride, la synthèse maître, la reprise, la sécurité des secrets et l’iPhone.

## Jalons Conversation Orchestrator

### CO-BUILD-00 — Contrats et fondations
Statut : **intégré**.

Contrats JSON/TypeScript, validation, nommage déterministe, graphe de dépendances, contexte injecté et machine d’états.

### CO-BUILD-01 — ChatGPT Plus manuel et persistance locale
Statut : **intégré**.

Import et persistance des runs, repository IndexedDB, préparation du prompt manuel, suivi des tentatives, import des réponses et reprise locale.

### CO-BUILD-02 — Backend et canal OpenAI API
Statut : **en cours**.

L’Incrément A est intégré via PR #103. Il fournit la configuration serveur typée, les limites bornées, la validation d’environnement, les erreurs publiques assainies, les contrats `ExecutionProvider` / `ProviderRequest` / `ProviderResult` / `ProviderUsage`, un provider fictif déterministe et les tests serveur dans la CI. Le Build complet reste ouvert jusqu’à livraison et validation du backend réellement exploitable, de l’authentification, du provider OpenAI, du stockage privé/rétention, de la reprise et des protections du secret prévues par la spécification.

### CO-QA-02A
Statut : **terminé**.

Le QA a identifié un défaut de gel imbriqué de `usageObserved`. PR #103 l’a corrigé, ajouté la preuve persistante correspondante et obtenu une CI GitHub complète verte.

### CO-BUILD-03 — Hybride et synthèse maître
Statut : **futur — ne pas implémenter actuellement**.

Le périmètre reste la combinaison des deux canaux, la consolidation, `master-input.md`, la synthèse maître et les résultats partiels confirmés.

## Séquencement canonique

Le séquencement vivant est défini dans `roadmap.md`. En résumé :

`CO-BUILD-00 → CO-BUILD-01 → QA manuel → CO-BUILD-02 par incréments + QA → CO-BUILD-03 → QA finale`.

CI-V2 et GitHub Pages sont des capacités d’infrastructure déjà intégrées ; elles ne constituent pas des Builds fonctionnels Conversation Orchestrator.

## Prochaine action utile

1. préparer `CO-BUILD-02` Incrément B depuis le `main` vivant post PR #103 ;
2. relire SPEC-00, ADR-003, l’Incrément A intégré et le code serveur actuel ;
3. borner le périmètre, les fichiers autorisés, la sécurité et le QA de l’Incrément B avant toute implémentation ;
4. ne pas produire CO-BUILD-03 dans ce flux.
