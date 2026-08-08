# ProjectOS — Replit Runtime Contract

## 1. Objet

Ce standard rend explicite et vérifiable la relation entre GitHub, une application ProjectOS et Replit. Il vise à empêcher qu’un environnement Replit devienne une seconde source de vérité, qu’un ancien Artifact ou Workflow soit confondu avec l’application réelle, ou qu’un workspace local divergent bloque les évolutions suivantes.

Il est obligatoire pour tout projet logiciel qui utilise Replit pour exécuter, tester, prévisualiser, héberger ou déployer une application.

## 2. Principe directeur

> GitHub contient le produit canonique. Replit contient un runtime remplaçable. Une Preview Replit ne vaut preuve que si elle exécute le SHA canonique attendu par un chemin de lancement versionné et reproductible.

Le runtime Replit doit pouvoir être supprimé et recréé sans perdre de code, de configuration métier ou de documentation durable.

## 3. Runtime Contract obligatoire

Avant la première utilisation de Replit, chaque application concernée doit disposer d’un contrat runtime versionné, basé sur `ProjectOS/templates/REPLIT_RUNTIME_CONTRACT.md`.

Le contrat déclare au minimum :

- identifiant et nom produit ;
- dépôt GitHub canonique ;
- branche/référence canonique ;
- chemin applicatif dans le dépôt ;
- mode Replit choisi ;
- commande de lancement canonique ;
- comportement attendu du port ;
- surface utilisateur de validation attendue ;
- interdictions de fallback ;
- smoke test CI équivalent ;
- procédure de synchronisation et de remise à zéro ;
- politique de service worker/cache si l’application est une PWA.

Une nouvelle application utilisant Replit n’est pas `RUNTIME READY` tant que ce contrat n’existe pas.

## 4. Modes Replit — choix explicite

Un projet choisit exactement un mode nominal et l’inscrit dans son Runtime Contract.

### A. `GITHUB_IMPORTED_RUNTIME`

Workspace Replit importé depuis le dépôt GitHub canonique.

Conditions :

- le remote canonique est identifiable ;
- le workspace ne contient aucun changement durable propre à Replit ;
- la branche locale peut être réalignée sans perte sur la référence canonique ;
- la commande de lancement provient du dépôt ;
- la Preview native fonctionne sans Artifact ni Workflow manuel obligatoire.

### B. `REPLIT_NATIVE_RUNTIME`

App Replit dédiée à l’exécution, configurée comme runtime de la source GitHub canonique.

Conditions :

- GitHub reste explicitement source de vérité ;
- la version exécutée est rattachable à un SHA GitHub ;
- aucune modification fonctionnelle durable n’est laissée uniquement dans Replit ;
- l’agent Replit, s’il est exceptionnellement utilisé pour une capacité propre à Replit, ne doit modifier que le runtime/configuration et respecte `TOOLCHAIN_POLICY.md` ;
- la Preview native est la surface nominale d’exécution.

### Interdiction de mélange

Ne pas alterner implicitement entre import GitHub, Agent/Replit-native, Artifact, Workflow manuel et Preview comme s’ils représentaient le même runtime. Tout changement de mode est une décision explicite, documentée dans le contrat et validée avant usage.

## 5. Replit Runtime Preflight

Avant tout test manuel, recette iPhone ou diagnostic Replit, exécuter ce preflight.

```text
REPLIT RUNTIME PREFLIGHT
Project:
Canonical repository:
Canonical ref:
Expected SHA:
Application path:
Runtime mode: GITHUB_IMPORTED_RUNTIME | REPLIT_NATIVE_RUNTIME
Replit app name:
Workspace clean: YES | NO | UNKNOWN
Local ref equals canonical ref: YES | NO | UNKNOWN
Local commits ahead: 0 | <n> | UNKNOWN
Remote commits behind: 0 | <n> | UNKNOWN
Launch command versioned: YES | NO
Launch command:
Binds 0.0.0.0: YES | NO | UNKNOWN
Uses runtime-provided PORT or documented port policy: YES | NO | UNKNOWN
Equivalent CI direct-run smoke: PASS | FAIL | ABSENT
Native Preview expected: YES | NO
Artifact required: NO
Manual Workflow required: NO
Service worker/cache risk checked: YES | NO | N/A
Verdict: READY | DIRTY_WORKTREE | DIVERGED | RUNTIME_CONFIG_MISSING | BLOCKED
```

Aucune recette produit ne commence avec un verdict autre que `READY`.

## 6. Git hygiene dans Replit

Replit n’est jamais utilisé comme branche de développement implicite.

Avant toute récupération de `main` ou d’une branche de validation :

1. identifier la branche locale et la référence distante ;
2. vérifier le worktree ;
3. relever les commits `ahead/behind` ;
4. interdire `Pull`, `Sync` ou `Push` tant qu’un worktree sale ou une divergence non comprise existe ;
5. qualifier tout commit local : canonique à conserver ou parasite de runtime ;
6. si le workspace est explicitement jetable et ne contient aucun travail unique, préférer un réalignement propre sur le remote ou une recréation du runtime plutôt qu’un merge accidentel ;
7. ne jamais pousser un commit local créé par un Artifact, un setup Agent ou une configuration de Preview sans revue explicite.

Un état `ahead > 0` ou `dirty` doit être considéré comme un blocage de synchronisation jusqu’à classification.

## 7. Contrat de lancement

Le lancement nominal doit être versionné dans GitHub et reproductible hors de Replit.

Exigences :

- une commande racine unique ou un chemin explicitement documenté ;
- installation déterministe des dépendances lorsque nécessaire ;
- build de production lorsque le serveur de développement introduit une dépendance inutile à HMR/WebSocket ;
- écoute sur `0.0.0.0` ;
- utilisation de `$PORT` ou d’une politique de port explicitement compatible avec Replit ;
- échec explicite si le serveur ne peut pas démarrer ;
- signal/log de readiness déterministe lorsque raisonnable ;
- HTTP 200 vérifiable sur l’application ;
- aucune dépendance à un Artifact pour démarrer le produit canonique.

## 8. Preview, Artifact, Workflow et Validation

### Preview native

La surface nominale de preuve runtime est une vraie Preview/Webview de l’application exécutée.

### Artifact

Un Artifact Replit est un artefact de génération ou une surface auxiliaire. Il ne prouve jamais que le produit GitHub canonique est exécuté. `Open Artifact` ne satisfait aucun gate de recette applicative sauf si le projet déclare explicitement l’Artifact comme produit canonique, ce qui doit être exceptionnel.

### Workflow manuel

Un Workflow manuel peut servir au diagnostic ou à une tâche de validation, mais il ne doit pas être requis pour lancer normalement une application si le Runtime Contract exige un lancement direct.

### Validation tool

Les commandes de validation/test ne remplacent pas le runtime produit. Un bouton `Run` dans un panneau de validation ne vaut pas démarrage applicatif.

## 9. Gate CI — Direct Run Smoke

Toute application Replit critique ou régulièrement testée sur iPhone doit exécuter en CI un smoke utilisant la même commande de lancement que Replit ou une commande strictement équivalente.

Le smoke vérifie au minimum :

- installation/build réussi ;
- processus serveur réellement lancé ;
- HTTP 200 ;
- identité produit minimale ;
- ressource JS/CSS/manifest principale accessible lorsque pertinent.

Pour une PWA, compléter si possible par un browser smoke réel vérifiant que le DOM n’est pas vide et qu’aucune erreur JavaScript bloquante n’apparaît.

Une CI métier verte sans Direct Run Smoke ne prouve pas la capacité à exécuter le produit dans Replit.

## 10. Gate post-merge

Après une évolution modifiant le runtime, le build, `.replit`, le serveur, le service worker, le manifeste ou la navigation de démarrage :

1. fusionner uniquement après CI verte sur le SHA exact ;
2. relever le nouveau SHA `main` ;
3. réaligner/recréer le runtime Replit depuis ce SHA ;
4. exécuter le Replit Runtime Preflight ;
5. ouvrir la Preview native ;
6. réaliser le smoke produit ;
7. seulement ensuite considérer la version comme `REPLIT VALIDATED`.

Une ancienne Preview encore ouverte ne constitue pas une preuve post-merge.

## 11. PWA et cache/service worker

Pour une PWA utilisée sur des domaines Preview récurrents :

- versionner les caches de shell ;
- prévoir la suppression des caches obsolètes ;
- documenter un chemin de remise à zéro du site lorsque nécessaire ;
- ne pas enregistrer un service worker de développement si cela crée un risque de contamination entre générations ;
- privilégier un browser smoke avec et sans service worker ;
- distinguer un incident applicatif d’un état de cache propre au domaine Preview.

## 12. Politique de récupération d’un runtime contaminé

Lorsqu’un workspace accumule des Artifacts, Workflows, commits locaux, changements `.replit`, branches de QA ou caches historiques :

1. arrêter toute modification fonctionnelle dans ce runtime ;
2. vérifier que GitHub contient bien la dernière version canonique ;
3. classer les changements locaux ;
4. conserver uniquement une preuve si nécessaire ;
5. nettoyer/réaligner le runtime si aucune donnée unique n’existe ;
6. si l’état reste ambigu, recréer un runtime neuf depuis le contrat plutôt que poursuivre un débogage cumulatif ;
7. ne supprimer l’ancien runtime qu’après validation du nouveau.

La recréation doit être une procédure normale et peu coûteuse, pas un dernier recours exceptionnel.

## 13. Création d’une nouvelle application

Lorsqu’un nouveau projet prévoit Replit :

- définir le Runtime Contract au même moment que le manifeste ;
- décider dès le départ du mode Replit ;
- choisir le nom stable de l’app Replit ;
- versionner la commande de lancement avant la première recette ;
- ajouter le Direct Run Smoke avant le premier jalon déclaré intégrable ;
- vérifier la Preview native sur iPhone avant de considérer l’environnement prêt ;
- interdire la création spontanée d’Artifact/Workflow parallèle au produit sans besoin explicite.

## 14. Évolution d’une application existante

Une évolution qui ne change pas le runtime réutilise le contrat vivant.

Une évolution qui touche build, serveur, port, PWA, service worker, hébergement, racine du monorepo ou configuration Replit doit :

- relire le contrat avant modification ;
- mettre à jour le contrat dans la même PR si son hypothèse change ;
- faire passer le Direct Run Smoke ;
- refaire le Gate post-merge.

## 15. Critères de conformité

Un projet Replit est conforme lorsque :

- GitHub est incontestablement canonique ;
- le Runtime Contract existe ;
- le mode Replit est unique et explicite ;
- le lancement est versionné ;
- le runtime peut être recréé ;
- le worktree est propre avant recette ;
- la version exécutée est rattachable à un SHA ;
- la Preview native est accessible sans Artifact ;
- aucun Workflow manuel n’est requis pour le lancement nominal, sauf contrat explicite contraire ;
- un Direct Run Smoke automatisé existe pour les applications critiques ;
- les changements durables ne résident jamais uniquement dans Replit.

## 16. Règle permanente

**Ne jamais déboguer le produit tant que l’identité du runtime, son SHA, son mode Replit et son chemin de lancement ne sont pas prouvés.**
