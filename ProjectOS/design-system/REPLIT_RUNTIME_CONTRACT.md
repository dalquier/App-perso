# ProjectOS Design System Playground — Replit Runtime Contract

**Statut :** `TEMPORARY C1 VISUAL QA RUNTIME — DO NOT MERGE AS-IS`

## Identité

- ProjectOS ID : `projectos-design-system`
- Nom produit : `ProjectOS Design System Playground`
- Replit app name : `ProjectOS Design System Playground`
- Runtime mode : `GITHUB_IMPORTED_RUNTIME`

## Source canonique

- Repository : `dalquier/App-perso`
- Runtime ref : `runtime/design-system-c1-preview`
- Product baseline ref : `codex/construire-playground-pour-design-system`
- Product baseline SHA reviewed : `6d3ec28c0a6b953a3506d642b5099c395248765e`
- Application path : `apps/design-system/`
- Runtime version proof : relever le SHA GitHub exact de `runtime/design-system-c1-preview` immédiatement avant toute recette.

Cette branche de runtime ajoute uniquement l'infrastructure nécessaire à la Preview C1. Elle ne doit pas être fusionnée dans `main` avec son `.replit` de Preview, car le `.replit` canonique de `main` appartient au runtime Équilibre.

## Lancement

- Launch command : `bash ./start-design-system-preview.sh`
- Working directory initial : racine du monorepo
- Application working directory après lancement : `apps/design-system/`
- Installation : `npm ci`
- Serveur : Storybook dev server
- Bind address : `0.0.0.0`
- Port policy : `$PORT` fourni par le runtime, fallback local `6006`
- Readiness signal : HTTP 200 sur `/`
- Expected HTTP : `200`

## Surface d’exécution

- Nominal surface : `Replit native Preview/Webview`
- Artifact required : `NO`
- Manual Workflow required : `NO`
- Validation tool required to start product : `NO`
- Replit Agent required : `NO`

## CI runtime gate

- Direct Run Smoke : `.github/workflows/design-system-preview-smoke.yml`
- Same launch command as Replit : `YES`
- Browser smoke : `N/A` pour C1 ; HTTP smoke + ressources Storybook
- Product identity assertions : `/`, `/iframe.html` et `/index.json` répondent en HTTP 200.

## PWA / cache

- PWA : `NO`
- Service worker : `N/A`
- Cache version strategy : `N/A`
- Old cache cleanup : `N/A`
- Preview reset procedure : supprimer/recréer le runtime Replit depuis la branche `runtime/design-system-c1-preview` si l'identité du SHA ou le worktree devient ambigu.

## Synchronisation Git

Avant recette :

- worktree clean ;
- branche locale `runtime/design-system-c1-preview` vérifiée ;
- SHA local = SHA GitHub attendu ;
- `ahead = 0` ;
- `behind = 0` ;
- aucun changement durable propre à Replit.

Si divergence ou contamination :

1. arrêter le test ;
2. ne pas Pull/Sync/Push tant que l'état n'est pas compris ;
3. préserver tout travail unique éventuel ;
4. recréer de préférence un runtime neuf depuis GitHub ;
5. refaire le Replit Runtime Preflight.

## Fallbacks interdits

- utiliser Replit Agent pour modifier le produit ou le runtime ;
- considérer `Open Artifact` comme preuve ;
- créer un Workflow manuel pour contourner le bouton Run ;
- utiliser une ancienne Preview comme preuve d'un nouveau SHA ;
- pousser des changements depuis Replit ;
- modifier DeveloperOS ou Équilibre pour faire fonctionner ce Playground.

## Smoke manuel minimal iPhone — C1

- ouvrir la Preview native sur iPhone ;
- confirmer que Storybook charge sans page blanche ;
- ouvrir `Foundations` ;
- vérifier la distinction `LOCKED` / `CANDIDATE` ;
- ouvrir les Overviews Button, Icon Button, Card, List Row, Input/Text Area et Chip/Badge ;
- basculer Light / Dark ;
- vérifier qu'aucun contenu majeur n'est tronqué sur largeur iPhone ;
- vérifier les cibles tactiles principales ;
- tester quelques interactions et états ;
- relever toute anomalie visuelle avant promotion d'un token candidat.

## Definition of Runtime Ready

`RUNTIME READY` uniquement si :

- SHA runtime exact connu ;
- Direct Run Smoke vert sur ce SHA ;
- Replit Runtime Preflight = `READY` ;
- Preview native fonctionne ;
- aucun Artifact/Workflow manuel requis ;
- aucun changement local Replit ;
- runtime recréable depuis cette branche temporaire.

## Fin de vie

Après recette C1 :

- conserver les conclusions de QA dans ProjectOS ;
- décider séparément le canal durable du Design System ;
- supprimer ou archiver le runtime Replit temporaire lorsque sa preuve n'est plus utile ;
- ne jamais fusionner le `.replit` de cette branche vers `main`.
