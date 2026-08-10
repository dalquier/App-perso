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
- Runtime module canonique : `nodejs-24`
- Configuration racine autorisée : `modules = ["nodejs-24"]` et `run = "./start-equilibre.sh"`, sans section Workflow.
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

## Origine stable et données locales

- La Preview `.replit.dev` est une surface temporaire de développement et de QA. Elle ne constitue pas l'origine durable des données personnelles.
- L'usage personnel stable doit se faire sur une version publiée à URL stable (`.replit.app` ou domaine dédié).
- Republier une nouvelle version doit conserver cette origine. Créer une nouvelle app, changer de domaine ou utiliser une nouvelle URL exige un export depuis l'ancienne origine puis un import vérifié dans la nouvelle.
- Une seule app Replit canonique porte la version stable. Les branches candidates ne remplacent cette version qu'après les gates GitHub, données, runtime et iPhone.
- Le runtime Replit reste remplaçable comme environnement de code ; l'origine publiée contenant le stockage navigateur ne doit pas être remplacée sans plan de migration explicite.

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

Si le runtime est `dirty`, `ahead` ou `diverged`, ne pas faire `Pull`, `Sync` ou `Push` automatiquement. Classer d’abord les changements locaux. Si aucun travail unique n’existe, réaligner l’application canonique par Git. Toute recréation exceptionnelle applique d’abord le `REPLIT IMPORT/SETUP CAPABILITY GATE` transverse ; elle n’est jamais une méthode de mise à jour.

## Fallbacks interdits

- créer une deuxième application Replit pour une mise à jour ordinaire ;
- réimporter le dépôt au lieu de synchroniser l’application canonique par Git ;
- répéter un import `UNKNOWN` ou `INCOMPATIBLE` ;
- `Open Artifact` comme preuve de fonctionnement ;
- panneau `Validation` comme démarrage produit ;
- création d’un Workflow manuel permanent pour contourner un runtime mal configuré ;
- `runButton = "Project"`, tâche `Start application` ou section `[workflows]` ajoutée par un setup Agent ;
- `replit.md` généré par Agent comme condition de lancement ;
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

Le statut renforcé `STABLE IN REPLIT — DATA PRESERVED` exige en plus une origine publiée stable, un SHA de release exact, les gates de migration applicables et la vérification des données avant/après définis dans `SESSION_30_C_STABLE_RELEASE_AND_DATA_PRESERVATION.md`.

## Recréation exceptionnelle depuis GitHub

La mise à jour normale d’Équilibre utilise `GIT_SYNC` dans l’application Replit canonique. La procédure suivante est réservée à un runtime irrécupérable :

1. préserver l’application actuelle et vérifier qu’elle ne contient aucun travail ou donnée unique ;
2. exécuter le `REPLIT IMPORT/SETUP CAPABILITY GATE` transverse avec `Lifecycle action: EXCEPTIONAL_RECREATION`, `Ingress/setup method: GITHUB_IMPORT` et une preuve actuelle datée ;
3. ne poursuivre que si le verdict est `ADMISSIBLE` ou si une exception Agent ponctuelle a été explicitement autorisée ;
4. si le setup Agent est requis, si son refus bloque `Run/Preview` ou si le verdict reste `UNKNOWN`, arrêter, conserver `REPLIT VALIDATION = BLOCKED` et ne pas répéter l’import ;
5. créer au maximum une candidate de remplacement, sans supprimer ni déclasser l’application canonique existante ;
6. vérifier que `.replit` ne contient que le module Node canonique et la commande `run`, relever le SHA puis lancer la Preview avec données fictives ou isolées ;
7. exécuter le Runtime Preflight et le smoke iPhone ; vérifier l’origine stable, la conservation des données et le rollback selon `SESSION_30_C_STABLE_RELEASE_AND_DATA_PRESERVATION.md` ;
8. promouvoir la remplaçante comme application canonique uniquement après ces preuves, puis archiver l’ancienne selon une décision explicite.
