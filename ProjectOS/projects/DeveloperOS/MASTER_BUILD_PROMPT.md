# DeveloperOS — MASTER_BUILD_PROMPT

Ce document est le script maître canonique de reprise et de construction de DeveloperOS. Il décrit l’état vivant et les règles d’exécution actuelles ; il ne constitue pas un prompt figé de BUILD-01.

Toute conversation DeveloperOS commence par charger `ProjectOS/BOOTSTRAP.md`, les références qu’il impose, puis au minimum :

- `ProjectOS/projects/DeveloperOS/PROJECT_MANIFEST.md` ;
- `ProjectOS/projects/DeveloperOS/roadmap.md` ;
- les ADR applicables ;
- les spécifications applicables sous `docs/` ;
- l’état vivant de `apps/developer-os/` et des Pull Requests concernées.

## 1. Identité et vision

- ID : `developeros`.
- Produit : DeveloperOS.
- Vision : poste de pilotage simple, fiable, local-first et utilisable depuis l’iPhone pour reprendre chaque projet sans dépendre de la mémoire.
- Utilisateur V1 : Damien.
- Interface principale : PWA DeveloperOS.
- Source de vérité : GitHub.

## 2. Dépôt et chemins canoniques

- Dépôt : `dalquier/App-perso`.
- Branche principale : `main`.
- Gouvernance : `ProjectOS/projects/DeveloperOS/`.
- Code applicatif : `apps/developer-os/`.
- Historique ancien : `dalquier/Scriptable`, lecture seule sauf instruction explicite.
- Aucun dépôt séparé `dalquier/DeveloperOS` sans nouvelle décision documentée.

## 3. Architecture actuelle

### Client PWA

- React + TypeScript + Vite.
- Mobile-first et iPhone-first.
- Local-first.
- PWA installable et utilisable hors connexion après premier chargement.
- Persistance IndexedDB derrière des repositories.
- Export/import versionné.
- Service worker et manifeste PWA.

### Persistance locale

IndexedDB `developeros` est en version 3 avec exactement les stores canoniques suivants :

- `projects` ;
- `codexConversations` ;
- `conversation-runs`.

Toute évolution de schéma doit préserver les trois stores et appliquer une migration non destructive explicitement testée.

### Déploiement du client

La cible canonique est GitHub Pages :

`https://dalquier.github.io/App-perso/developer-os/`

Référence de décision : `ADR/ADR-004-GITHUB-PAGES-DEPLOYMENT.md`.

Le client doit rester compatible avec le sous-chemin :

`/App-perso/developer-os/`

Le workflow canonique de publication est :

`.github/workflows/developer-os-pages.yml`.

Replit n’est plus une dépendance cible de DeveloperOS pour l’hébergement ou le déploiement. Il peut uniquement être utilisé comme environnement optionnel de reproduction ou de diagnostic lorsqu’un besoin vérifié le justifie.

### Backend Conversation Orchestrator

Le backend futur de `CO-BUILD-02` est un sous-système séparé du client statique :

- Node.js/TypeScript selon SPEC-00 ;
- secret OpenAI uniquement côté serveur ;
- authentification avant exposition publique ;
- stockage privé et politique de rétention ;
- aucune clé dans la PWA, IndexedDB, GitHub, exports ou logs publics.

GitHub Pages n’héberge pas ce backend. La cible serveur est décidée et validée dans le périmètre CO-BUILD-02 ; aucune ancienne mention Replit ne vaut décision implicite pour ce runtime.

## 4. Rôle des outils

### ChatGPT

- audit ;
- architecture et spécification ;
- pilotage ;
- revue indépendante ;
- changements documentaires limités ;
- vérification de l’état vivant GitHub avant décision.

### Codex

- développements substantiels ;
- refactorings et migrations ;
- tests ;
- préparation du diff ;
- travail sur une branche dédiée.

### GitHub

- source de vérité du code et de la documentation ;
- branches, Pull Requests et ADR ;
- CI DeveloperOS ;
- GitHub Pages pour le client PWA.

### Working Copy

- client Git de secours sur iPhone ;
- application de patchs ;
- publication de fichiers lorsque le canal natif ne convient pas.

### Pyto

- fonctions locales iPhone complémentaires ;
- compagnon, jamais seconde interface principale.

### Replit

- optionnel ;
- non canonique ;
- non requis pour publier le client ;
- aucun agent IA Replit sans exception conforme à ProjectOS.

## 5. État intégré vérifié au 2026-08-07

### Noyau et modules

- BUILD-01 — Project Core : intégré.
- Conversations Codex : PR #58 intégrée.
- CO-BUILD-00 — contrats et fondations : PR #60 intégrée.
- Correction Clipboard : PR #69 intégrée.
- CO-BUILD-01 — canal ChatGPT Plus manuel et persistance locale : PR #70 intégrée.
- Commit d’intégration CO-BUILD-01 : `51178d642b6dcc2099a4e378f79f3b133f1bd3b1`.
- BUILD-02R V3 : PR #86 intégrée.
- CO-BUILD-02 Incrément A : PR #103 intégrée.
- Commit d’intégration CO-BUILD-02A : `b22fd5002c4ead8ef73a8927c89f81b9d8b4ff23`.

### Infrastructure

- CI-V2 : PR #78 intégrée.
- PAGES-01 : PR #89 intégrée.
- PAGES-FIX : PR #92 intégrée.
- Configuration PWA/Vite : sous-chemin `/App-perso/developer-os/`.
- La CI DeveloperOS exécute désormais explicitement les tests serveur introduits par CO-BUILD-02A.

## 6. Conversation Orchestrator — décisions stables

Références :

- `ADR/ADR-003-CONVERSATION-ORCHESTRATOR-DUAL-EXECUTION.md` ;
- `docs/CONVERSATION_ORCHESTRATOR_SPEC.md` ;
- `roadmap.md` pour l’état et le séquencement vivant.

Décisions :

1. exactement deux canaux : `chatgpt_plus_manual` et `openai_api` ;
2. `hybrid` est un état dérivé, pas un troisième canal ;
3. le canal ChatGPT Plus reste manuel et assisté par copier-coller ;
4. aucune lecture automatisée ni scraping de l’interface ChatGPT ;
5. les réponses brutes sont préservées ;
6. les dépendances sont injectées de manière déterministe dans les prompts aval ;
7. les missions indépendantes peuvent être parallélisées dans les limites du contrat ;
8. le secret API reste côté serveur ;
9. les données réelles d’exécution restent locales ou privées ;
10. CO-BUILD-03 ne doit pas être anticipé avant clôture de CO-BUILD-02.

## 7. État Conversation Orchestrator

### CO-BUILD-00

Statut : **intégré**.

Contrats, types, validation, graphe, nommage, plan, contexte de dépendances et machine d’états.

### CO-BUILD-01

Statut : **intégré**.

Canal ChatGPT Plus manuel, persistance locale, repository des runs, import/export et reprise.

### CO-BUILD-02

Statut : **en cours**.

L’Incrément A est intégré via PR #103 sur le commit `b22fd5002c4ead8ef73a8927c89f81b9d8b4ff23`.

Il fournit notamment :

- configuration serveur typée ;
- limites bornées ;
- validation des variables d’environnement ;
- erreurs publiques assainies ;
- contrats `ExecutionProvider`, `ProviderRequest`, `ProviderResult`, `ProviderUsage` ;
- `FakeExecutionProvider` déterministe sans réseau ;
- tests serveur intégrés à `npm run check` et à DeveloperOS CI.

Le Build complet n’intègre pas encore :

- serveur HTTP réel ;
- authentification ;
- stockage serveur réel et migrations PostgreSQL ;
- scheduler / orchestration serveur ;
- provider OpenAI réel ;
- UI API ;
- CO-BUILD-03.

La PR historique #83 est fermée sans fusion et supersédée par #103.

### CO-QA-02A

Statut : **terminé**.

Le QA a identifié un défaut d’immutabilité imbriquée dans `ProviderResult.usageObserved`. PR #103 a reconstruit l’Incrément A depuis le `main` canonique, corrigé ce défaut, ajouté la preuve persistante correspondante et obtenu une CI GitHub complète verte, y compris Server tests, build et Mobile E2E.

### CO-BUILD-03

Statut : **futur**.

Ne pas implémenter avant clôture de CO-BUILD-02 et de ses QA bloquants.

Périmètre futur :

- exécution mixte ;
- consolidation ;
- `master-input.md` ;
- lancement de la synthèse maître ;
- résultats partiels confirmés.

## 8. Séquencement canonique

La roadmap fait foi pour l’état opérationnel :

`CO-BUILD-00 → CO-BUILD-01 → QA manuel → CO-BUILD-02 par incréments + QA → CO-BUILD-03 → QA finale`.

Règles :

- un incrément ne devient pas intégré parce qu’il existe en Draft PR ;
- un QA nécessaire au lot suivant est un gate ;
- CO-BUILD-02 n’est terminé que lorsque le canal API prévu par SPEC-00 est réellement exploitable ;
- CO-BUILD-03 ne commence qu’après le gate de clôture de CO-BUILD-02 ;
- CI-V2 et PAGES-01 sont de l’infrastructure, pas des Builds fonctionnels Conversation Orchestrator.

## 9. CI et qualité

Workflow applicatif : `.github/workflows/developer-os.yml`.

La CI principale couvre sur `main` :

- installation verrouillée ;
- lint ;
- TypeScript ;
- tests unitaires ;
- tests composants ;
- tests repository ;
- tests serveur ;
- tests PWA ;
- build ;
- E2E mobiles Playwright.

Tout incrément serveur doit conserver cette chaîne de contrôle et ajouter les preuves spécifiques nécessaires à son périmètre sans supprimer les non-régressions existantes.

## 10. UX et sécurité permanentes

- safe areas iOS ;
- pages longues défilables ;
- champs visibles avec clavier ouvert ;
- cibles tactiles suffisantes ;
- retour toujours possible ;
- aucun modal sans fermeture visible ;
- aucun clic inerte ;
- erreurs compréhensibles et non destructives ;
- confirmation avant action destructive ;
- aucun secret côté client ;
- aucune donnée personnelle réelle dans le dépôt public.

## 11. Règles de développement

- Ne jamais modifier directement `main`.
- Une branche/PR par lot cohérent.
- Exécuter le Delivery Preflight et les gates de fraîcheur ProjectOS applicables.
- Vérifier le SHA distant et le SHA testé avant toute décision de fusion.
- Ne jamais fusionner sans autorisation explicite.
- Préserver les migrations IndexedDB existantes et les trois stores v3.
- Ne pas modifier les contrats partagés en parallèle dans plusieurs branches.
- Ne pas ajouter de dépendance Replit au client pour contourner une lacune d’hébergement déjà résolue par GitHub Pages.

## 12. Prochaine action canonique

1. préparer `CO-BUILD-02` Incrément B depuis le `main` vivant post PR #103 ;
2. relire SPEC-00, ADR-003, l’Incrément A intégré et le code serveur réel ;
3. borner précisément l’Incrément B avant toute implémentation : responsabilités, fichiers autorisés, dépendances, sécurité, preuves et QA ;
4. implémenter ensuite l’Incrément B sur une branche dédiée et obtenir la CI complète sur le SHA candidat réel ;
5. ne pas lancer CO-BUILD-03.

## 13. Source de vérité des statuts

- État produit : `PROJECT_MANIFEST.md`.
- Ordre et jalons : `roadmap.md`.
- Décisions architecturales : `ADR/`.
- Contrat Conversation Orchestrator : `docs/CONVERSATION_ORCHESTRATOR_SPEC.md`.
- Instructions d’exécution actuelles : le présent document.
- État réel d’intégration : GitHub `main` et Pull Requests vivantes.

Lorsqu’un ancien document contient une instruction de déploiement Replit ou un jalon BUILD-01 présenté comme futur, la présente gouvernance, la roadmap et ADR-004 prévalent pour DeveloperOS.
