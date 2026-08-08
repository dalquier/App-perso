# Équilibre — Replit Runtime Contract

## Identité

- ProjectOS ID : `equilibre`
- Nom produit : `Équilibre`
- Replit app name cible : `Équilibre`
- Runtime mode cible : `REPLIT_NATIVE_RUNTIME`

## Source canonique

- Repository : `dalquier/App-perso`
- Canonical ref : `main`
- Application path : `apps/equilibre`
- Runtime version proof : SHA GitHub exact de `main` obligatoire avant recette.

GitHub reste l’unique source de vérité. Replit est un runtime remplaçable.

## Lancement

- Launch command canonique : `./start-equilibre.sh`
- Working directory initial : racine du monorepo
- Build : production Vite
- Serveur : serveur statique Node dédié `apps/equilibre/scripts/replit-server.mjs`
- Bind address : `0.0.0.0`
- Port policy : port fourni/détecté par Replit ; aucun port local historique ne doit être considéré comme invariant produit.
- Readiness : le lancement doit rendre l’application accessible et le smoke CI doit obtenir HTTP 200.

## Surface d’exécution

- Surface nominale : `Replit native Preview/Webview`
- Artifact required : `NO`
- Manual Workflow required : `NO`
- Validation tool required to start product : `NO`

`Open Artifact` ne valide jamais Équilibre. Un Workflow manuel peut être utilisé pour diagnostic ponctuel, mais ne fait pas partie du lancement nominal.

## CI runtime gate

Le workflow Équilibre doit conserver un `Replit direct-run smoke` exécutant le même chemin de lancement que Replit et vérifiant au minimum :

- build réussi ;
- processus serveur actif ;
- HTTP 200 ;
- identité `Équilibre` ;
- ressources principales accessibles.

Un browser smoke réel est recommandé pour les modifications touchant shell, navigation, PWA, service worker ou runtime.

## PWA / cache

- PWA : `YES`
- Service worker : `apps/equilibre/public/sw.js`
- Cache shell courant au moment de ce contrat : `equilibre-shell-v6`
- Les anciennes générations de cache Équilibre doivent être supprimées par le service worker courant.
- Après une évolution du shell/service worker, tester contexte vierge, reload contrôlé et offline après amorçage lorsque pertinent.

## Synchronisation Git

Avant toute recette Replit :

- relever le SHA `main` canonique ;
- worktree Replit propre ;
- aucune modification locale `.replit` non revue ;
- aucun commit local parasite ;
- `ahead = 0` ;
- `behind = 0` ;
- branche/runtime rattaché au SHA canonique attendu.

Si le runtime est `dirty`, `ahead` ou `diverged`, ne pas faire `Pull`, `Sync` ou `Push` automatiquement. Classer d’abord les changements locaux. Si aucun travail unique n’existe, réaligner ou recréer le runtime depuis GitHub.

## Fallbacks interdits

- `Open Artifact` comme preuve de fonctionnement ;
- panneau `Validation` comme démarrage produit ;
- création d’un Workflow manuel permanent pour contourner un runtime mal configuré ;
- changement métier par Replit Agent pour corriger un problème de Preview/port ;
- utilisation d’une ancienne Preview comme preuve du nouveau SHA ;
- push de commits locaux générés par setup Agent sans revue.

## Smoke manuel iPhone minimal

Après tout changement touchant le runtime ou avant validation d’un jalon important :

1. ouvrir la Preview native ;
2. vérifier le titre `Équilibre` ;
3. vérifier les cinq destinations : Accueil, Historique, Échanger, Protocoles, Mémoire ;
4. vérifier l’absence de `Séance` comme destination principale ;
5. ouvrir Protocoles et voir exactement `Clarifier une situation` et `Faire un petit pas` ;
6. vérifier l’absence de page blanche ;
7. vérifier les safe areas principales ;
8. compléter le parcours nominal demandé par la recette du build concerné.

## Definition of Runtime Ready

Équilibre est `RUNTIME READY` uniquement lorsque :

- `main` et son SHA sont connus ;
- le Direct Run Smoke est vert ;
- le Replit Runtime Preflight retourne `READY` ;
- la Preview native exécute réellement Équilibre ;
- aucun Artifact ni Workflow manuel n’est nécessaire au lancement nominal ;
- le runtime peut être recréé depuis ce contrat sans dépendre d’un ancien workspace.
