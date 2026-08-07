# DeveloperOS

PWA mobile-first et local-first pour piloter des projets personnels sur iPhone. GitHub est la source de vérité du code et de la documentation ; les données utilisateur restent dans IndexedDB et dans les exports privés.

## État actuel de `main`

Au 7 août 2026, DeveloperOS contient notamment :

- BUILD-01 — Project Core ;
- le module Conversations Codex issu de la PR #58 ;
- CO-BUILD-00 — contrats et fondations Conversation Orchestrator ;
- CO-BUILD-01 — canal ChatGPT Plus manuel et persistance locale, intégré par la PR #70 ;
- BUILD-02R V3 — reprise horodatée et références HTTPS, intégré par la PR #86 ;
- CI-V2, intégré par la PR #78 ;
- GitHub Pages, intégré par les PR #89 et #92.

CO-BUILD-02 est en cours dans la Draft PR #83. Tant que cette PR n’est pas fusionnée, son backend préparatoire et ses tests serveur ne font pas partie de `main`.

## URL de déploiement

La cible canonique de la PWA est :

`https://dalquier.github.io/App-perso/developer-os/`

Le client est construit pour le sous-chemin :

`/App-perso/developer-os/`

La configuration Vite, le manifeste PWA, le service worker et le workflow Pages doivent conserver ce sous-chemin.

Le workflow de déploiement est :

`.github/workflows/developer-os-pages.yml`.

Replit n’est plus une dépendance de déploiement DeveloperOS. Il peut être utilisé ponctuellement comme environnement de reproduction ou de diagnostic, mais GitHub reste la source canonique et GitHub Pages la cible de publication du client.

## Installation et commandes locales

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
```

Les PNG iPhone/PWA sont générés depuis la source SVG versionnée par `npm run icons:generate`. Ils sont régénérés avant les opérations qui en dépendent et ne constituent pas des sources binaires canoniques à maintenir manuellement.

## Architecture

### PWA principale

- React + TypeScript + Vite ;
- mobile-first ;
- local-first ;
- installable ;
- fonctionnement hors connexion après chargement initial ;
- service worker Workbox ;
- routage compatible GitHub Pages ;
- export/import JSON versionné.

### IndexedDB

La base `developeros` utilise le schéma **version 3** avec trois stores canoniques :

- `projects` ;
- `codexConversations` ;
- `conversation-runs`.

Toute migration future doit préserver les données existantes et les trois stores, sauf décision de migration explicitement documentée et testée.

### Module Conversations Codex

Les routes Codex permettent de gérer un historique local de prompts, de copier un prompt puis d’ouvrir Codex explicitement. L’application ne colle et n’envoie rien automatiquement dans Codex.

Les prompts, URLs et associations de projets restent dans le navigateur et dans les exports privés de l’utilisateur. L’import par fusion ne supprime pas implicitement les conversations existantes.

### Conversation Orchestrator

La décision d’architecture est définie dans :

`ProjectOS/projects/DeveloperOS/ADR/ADR-003-CONVERSATION-ORCHESTRATOR-DUAL-EXECUTION.md`.

Le contrat V1 est défini dans :

`ProjectOS/projects/DeveloperOS/docs/CONVERSATION_ORCHESTRATOR_SPEC.md`.

Deux canaux existent :

- `chatgpt_plus_manual` ;
- `openai_api`.

Le premier reste manuel et assisté par copier-coller. Le second nécessite un backend séparé du client GitHub Pages ; aucun secret OpenAI ne doit être exposé dans la PWA, IndexedDB, GitHub ou les exports.

## BUILD-02R

BUILD-02R enrichit les projets avec :

- un point de reprise horodaté ;
- un historique borné ;
- des références HTTPS sécurisées.

Son import/remplacement reste limité au store `projects` et ne détruit ni `codexConversations` ni `conversation-runs`.

## CI DeveloperOS

Workflow : `.github/workflows/developer-os.yml`.

Sur `main`, la chaîne de contrôle couvre :

- installation verrouillée ;
- lint ;
- TypeScript ;
- tests unitaires ;
- tests composants ;
- tests repository ;
- tests PWA ;
- build de production ;
- E2E mobiles Playwright.

Lorsqu’une branche introduit de nouveaux tests serveur, elle doit les raccorder explicitement à la CI avant fusion. La Draft PR #83 ajoute actuellement cette couverture sur son propre SHA ; cela ne décrit pas encore `main`.

## UX iPhone

Les vues doivent rester :

- défilables ;
- compatibles safe areas ;
- utilisables avec le clavier ouvert ;
- accessibles avec des cibles tactiles suffisantes ;
- toujours quittables par un retour ou une fermeture visible ;
- dépourvues de faux contrôles ou clics inertes.

## Sécurité et données

- aucun secret dans le client ou le dépôt public ;
- aucun `.env` réel versionné ;
- aucune donnée utilisateur réelle dans GitHub ;
- aucune automatisation de lecture ou scraping de ChatGPT ;
- URLs externes validées et ouvertes explicitement ;
- exports utilisateur conservés hors du dépôt public.

## Gouvernance et roadmap

Références principales :

- `ProjectOS/projects/DeveloperOS/PROJECT_MANIFEST.md` ;
- `ProjectOS/projects/DeveloperOS/MASTER_BUILD_PROMPT.md` ;
- `ProjectOS/projects/DeveloperOS/roadmap.md` ;
- `ProjectOS/projects/DeveloperOS/ADR/ADR-004-GITHUB-PAGES-DEPLOYMENT.md`.

Le séquencement Conversation Orchestrator courant est :

`CO-BUILD-00 → CO-BUILD-01 → QA manuel → CO-BUILD-02 par incréments + QA → CO-BUILD-03 → QA finale`.

CO-BUILD-03 est futur et ne doit pas démarrer avant la clôture de CO-BUILD-02 et de ses QA bloquants.

## Limites connues

- Safari/iOS peut purger IndexedDB ; conserver des exports privés utiles.
- GitHub Pages héberge uniquement le client statique et ne fournit pas le runtime serveur futur de CO-BUILD-02.
- Un workflow Pages intégré ne remplace pas un smoke test réel de l’URL publiée.
- Le backend OpenAI de CO-BUILD-02 reste en construction et n’appartient pas encore à `main`.

## Retour arrière

Exporter les données locales avant une évolution de schéma. Pour le code, revenir au dernier commit stable. Toute modification de l’hébergement ou de la séparation client/backend doit être documentée dans une ADR avant de remplacer la cible GitHub Pages actuelle.
