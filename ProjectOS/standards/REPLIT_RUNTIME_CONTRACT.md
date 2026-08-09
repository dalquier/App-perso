# ProjectOS — Replit Runtime Contract

## 1. Objet

Ce standard rend explicite et vérifiable la relation entre GitHub, une application ProjectOS et Replit. Il vise à empêcher qu’un environnement Replit devienne une seconde source de vérité, qu’un ancien Artifact ou Workflow soit confondu avec l’application réelle, ou qu’un workspace local divergent bloque les évolutions suivantes.

Il est obligatoire pour tout projet logiciel qui utilise Replit pour exécuter, tester, prévisualiser, héberger ou déployer une application.

## 2. Principe directeur

> GitHub contient le produit canonique. Replit contient un runtime remplaçable. Une Preview Replit ne vaut preuve que si elle exécute le SHA canonique attendu par un chemin de lancement versionné et reproductible.

Le runtime Replit doit pouvoir être supprimé et recréé sans perdre de code, de configuration métier ou de documentation durable.

**L’existence d’un dépôt, d’un `.replit`, d’un ZIP ou d’une commande de lancement correcte ne prouve pas que le flux d’import Replit les exécutera tels quels. Le mécanisme d’entrée dans Replit doit lui-même être qualifié avant usage.**

## 3. Runtime Contract obligatoire

Avant la première utilisation de Replit, chaque application concernée doit disposer d’un contrat runtime versionné, basé sur `ProjectOS/templates/REPLIT_RUNTIME_CONTRACT.md`.

Le contrat déclare au minimum :

- identifiant et nom produit ;
- dépôt GitHub canonique ;
- branche/référence canonique ;
- chemin applicatif dans le dépôt ;
- mode Replit choisi ;
- méthode d’entrée/création du runtime ;
- statut du contrôle de capacité d’import/setup ;
- commande de lancement canonique ;
- comportement attendu du port ;
- surface utilisateur de validation attendue ;
- interdictions de fallback ;
- smoke test CI équivalent ;
- procédure de synchronisation et de remise à zéro ;
- politique de service worker/cache si l’application est une PWA.

Une nouvelle application utilisant Replit n’est pas `RUNTIME READY` tant que ce contrat n’existe pas et que le chemin d’entrée Replit n’a pas passé le `REPLIT IMPORT/SETUP CAPABILITY GATE`.

## 4. Modes Replit — choix explicite

Un projet choisit exactement un mode nominal et l’inscrit dans son Runtime Contract.

### A. `GITHUB_IMPORTED_RUNTIME`

Workspace Replit importé depuis le dépôt GitHub canonique.

Conditions :

- le remote canonique est identifiable ;
- le workspace ne contient aucun changement durable propre à Replit ;
- la branche locale peut être réalignée sans perte sur la référence canonique ;
- la commande de lancement provient du dépôt ;
- la Preview native fonctionne sans Artifact ni Workflow manuel obligatoire ;
- le flux d’import/setup a été vérifié comme compatible avec la politique d’usage de Replit applicable au projet.

### B. `REPLIT_NATIVE_RUNTIME`

App Replit dédiée à l’exécution, configurée comme runtime de la source GitHub canonique.

Conditions :

- GitHub reste explicitement source de vérité ;
- la version exécutée est rattachable à un SHA GitHub ;
- aucune modification fonctionnelle durable n’est laissée uniquement dans Replit ;
- l’agent Replit, s’il est exceptionnellement utilisé pour une capacité propre à Replit, ne doit modifier que le runtime/configuration et respecte `TOOLCHAIN_POLICY.md` ;
- la Preview native est la surface nominale d’exécution ;
- la création/setup du runtime a été qualifiée avant usage.

### Interdiction de mélange

Ne pas alterner implicitement entre import GitHub, import ZIP, Agent/Replit-native, Artifact, Workflow manuel et Preview comme s’ils représentaient le même runtime. Tout changement de mode ou de méthode d’entrée est une décision explicite, documentée dans le contrat et validée avant usage.

## 4.1. REPLIT IMPORT/SETUP CAPABILITY GATE

Avant de créer, importer ou recréer un runtime Replit, effectuer un contrôle de capacité distinct du Runtime Preflight :

```text
REPLIT IMPORT/SETUP CAPABILITY GATE
Project:
Intended runtime mode: GITHUB_IMPORTED_RUNTIME | REPLIT_NATIVE_RUNTIME
Ingress/setup method: EXISTING_RUNTIME | GITHUB_IMPORT | ZIP_IMPORT | BLANK_APP | OTHER
Canonical repository/ref/SHA:
Replit behavior verified from current UI/docs: YES | NO
Agent automatically started or required: YES | NO | UNKNOWN
Can Agent be declined without blocking nominal Run/Preview: YES | NO | UNKNOWN
Import/setup mutates launch configuration before first Run: YES | NO | UNKNOWN
Canonical launch command remains authoritative after setup: YES | NO | UNKNOWN
Artifact or generated website created as substitute product: YES | NO | UNKNOWN
No-Agent policy compatible: YES | NO
Verdict: ADMISSIBLE | AGENT_EXCEPTION_REQUIRED | INCOMPATIBLE | UNKNOWN
```

Règles :

1. `UNKNOWN` n’autorise pas une recette : vérifier d’abord la capacité réelle.
2. Si Agent est requis ou si le refus d’Agent empêche le lancement nominal, le chemin est `INCOMPATIBLE` avec la politique normale sans Agent.
3. Ne jamais utiliser un import ZIP comme contournement d’un import GitHub problématique sans refaire ce gate. La présence d’un `.replit` dans l’archive ne garantit pas que Replit utilisera immédiatement cette commande.
4. Si l’import crée un Artifact, un checkpoint ou une tâche Agent, ces éléments ne deviennent jamais une preuve du produit canonique.
5. Une exception Agent suit obligatoirement `TOOLCHAIN_POLICY.md` et requiert l’autorisation ponctuelle explicite de Damien avant exécution.
6. Lorsque le chemin Replit est `INCOMPATIBLE`, ne pas multiplier les imports ou setups. Réutiliser un runtime déjà qualifié si disponible ; sinon basculer vers un canal d’exécution/QA alternatif adapté au besoin et documenter que ce canal ne constitue pas une preuve Replit.
7. Refaire ce gate si l’interface ou le comportement d’import Replit change matériellement.

### État observé en août 2026

La documentation Replit actuelle présente l’import comme un flux qui détecte/configure l’environnement et encourage la poursuite avec Agent ; le guide ZIP indique explicitement la poursuite avec Agent. Une observation iPhone ProjectOS a confirmé qu’après annulation du setup Agent d’un import ZIP, le bouton Run pouvait relancer `Set up the imported project` au lieu d’exécuter le lanceur versionné.

Conséquence : **`ZIP_IMPORT` est `INCOMPATIBLE` par défaut avec le mode normal ProjectOS sans Agent tant qu’un contrôle ultérieur ne prouve pas un comportement différent.** L’import GitHub doit être testé/qualifié séparément ; il ne doit pas être supposé compatible ou incompatible uniquement par analogie avec le ZIP.

## 5. Replit Runtime Preflight

Le Runtime Preflight n’est exécuté qu’après un Import/Setup Capability Gate `ADMISSIBLE` ou après une exception Agent explicitement autorisée et terminée.

Avant tout test manuel, recette iPhone ou diagnostic Replit, exécuter ce preflight.

```text
REPLIT RUNTIME PREFLIGHT
Project:
Canonical repository:
Canonical ref:
Expected SHA:
Application path:
Runtime mode: GITHUB_IMPORTED_RUNTIME | REPLIT_NATIVE_RUNTIME
Ingress/setup method:
Import/Setup Capability Gate: ADMISSIBLE | AGENT_EXCEPTION_AUTHORIZED
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

La validité technique de cette commande ne dispense jamais du Import/Setup Capability Gate : Replit doit effectivement permettre à cette commande de rester le lancement nominal.

## 8. Preview, Artifact, Workflow et Validation

### Preview native

La surface nominale de preuve runtime est une vraie Preview/Webview de l’application exécutée.

### Artifact

Un Artifact Replit est un artefact de génération ou une surface auxiliaire. Il ne prouve jamais que le produit GitHub canonique est exécuté. `Open Artifact` ne satisfait aucun gate de recette applicative sauf si le projet déclare explicitement l’Artifact comme produit canonique, ce qui doit être exceptionnel.

Un Artifact créé automatiquement pendant un import/setup Agent ne doit ni être ouvert comme fallback nominal, ni être confondu avec l’application importée.

### Workflow manuel

Un Workflow manuel peut servir au diagnostic ou à une tâche de validation, mais il ne doit pas être requis pour lancer normalement une application si le Runtime Contract exige un lancement direct.

### Validation tool

Les commandes de validation/test ne remplacent pas le runtime produit. Un bouton `Run` dans un panneau de validation ne vaut pas démarrage applicatif.

### Preview externe de QA

Lorsque Replit est indisponible ou incompatible avec la politique d’outil, un hébergement ou miroir temporaire peut servir à une **QA visuelle ou fonctionnelle explicitement bornée**, à condition de :

- conserver GitHub comme source canonique ;
- rattacher la QA à un SHA ou à un inventaire exact des éléments reproduits ;
- annoncer clairement qu’il ne s’agit pas d’une preuve `REPLIT VALIDATED` ;
- ne pas promouvoir dans GitHub un changement issu uniquement du miroir sans repasser par le flux canonique ;
- distinguer le chrome injecté par la plateforme de Preview du produit testé.

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

Un Direct Run Smoke vert prouve la commande hors Replit ; il ne prouve pas que le flux d’import/setup Replit laissera cette commande gouverner le bouton Run.

## 10. Gate post-merge

Après une évolution modifiant le runtime, le build, `.replit`, le serveur, le service worker, le manifeste ou la navigation de démarrage :

1. fusionner uniquement après CI verte sur le SHA exact ;
2. relever le nouveau SHA `main` ;
3. réévaluer le Import/Setup Capability Gate si le runtime doit être recréé ;
4. réaligner/recréer le runtime Replit depuis ce SHA uniquement si le chemin reste admissible ;
5. exécuter le Replit Runtime Preflight ;
6. ouvrir la Preview native ;
7. réaliser le smoke produit ;
8. seulement ensuite considérer la version comme `REPLIT VALIDATED`.

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

Lorsqu’un workspace accumule des Artifacts, Workflows, commits locaux, changements `.replit`, branches de QA, checkpoints Agent ou caches historiques :

1. arrêter toute modification fonctionnelle dans ce runtime ;
2. vérifier que GitHub contient bien la dernière version canonique ;
3. classer les changements locaux ;
4. conserver uniquement une preuve si nécessaire ;
5. nettoyer/réaligner le runtime si aucune donnée unique n’existe ;
6. avant toute recréation, refaire le Import/Setup Capability Gate ;
7. si le chemin de recréation est incompatible, ne pas répéter l’import : choisir un autre canal de QA/runtime ;
8. si l’état reste ambigu, recréer un runtime neuf seulement par un chemin admissible plutôt que poursuivre un débogage cumulatif ;
9. ne supprimer l’ancien runtime qu’après validation du nouveau ou après décision explicite qu’aucune preuve utile n’y réside.

La recréation doit être une procédure normale et peu coûteuse lorsqu’un chemin admissible existe ; elle ne doit pas devenir une boucle d’import Agent incontrôlée.

## 13. Création d’une nouvelle application

Lorsqu’un nouveau projet prévoit Replit :

- définir le Runtime Contract au même moment que le manifeste ;
- décider dès le départ du mode Replit ;
- sélectionner et qualifier la méthode d’entrée/setup avec le Import/Setup Capability Gate ;
- choisir le nom stable de l’app Replit ;
- versionner la commande de lancement avant la première recette ;
- ajouter le Direct Run Smoke avant le premier jalon déclaré intégrable ;
- vérifier la Preview native sur iPhone avant de considérer l’environnement prêt ;
- interdire la création spontanée d’Artifact/Workflow parallèle au produit sans besoin explicite.

Si aucun chemin Replit admissible sans Agent n’existe et qu’aucune exception n’est autorisée, **Replit n’est pas un prérequis bloquant du Build** : le projet utilise un canal alternatif pour les validations qui peuvent l’être et conserve `REPLIT VALIDATION = PENDING/BLOCKED` pour les preuves réellement spécifiques à Replit.

## 14. Évolution d’une application existante

Une évolution qui ne change pas le runtime réutilise le contrat vivant et privilégie le runtime déjà qualifié plutôt qu’un nouvel import.

Une évolution qui touche build, serveur, port, PWA, service worker, hébergement, racine du monorepo ou configuration Replit doit :

- relire le contrat avant modification ;
- mettre à jour le contrat dans la même PR si son hypothèse change ;
- faire passer le Direct Run Smoke ;
- refaire le Gate post-merge ;
- refaire le Import/Setup Capability Gate uniquement si une recréation/import est nécessaire ou si le comportement Replit a changé.

## 15. Critères de conformité

Un projet Replit est conforme lorsque :

- GitHub est incontestablement canonique ;
- le Runtime Contract existe ;
- le mode Replit est unique et explicite ;
- la méthode d’entrée/setup est qualifiée ;
- le lancement est versionné ;
- le runtime peut être recréé par un chemin admissible, ou la limitation est explicitement `BLOCKED` sans dégrader la source canonique ;
- le worktree est propre avant recette ;
- la version exécutée est rattachable à un SHA ;
- la Preview native est accessible sans Artifact ;
- aucun Workflow manuel n’est requis pour le lancement nominal, sauf contrat explicite contraire ;
- un Direct Run Smoke automatisé existe pour les applications critiques ;
- les changements durables ne résident jamais uniquement dans Replit.

## 16. Règle permanente

**Ne jamais déboguer le produit tant que l’identité du runtime, son SHA, son mode Replit, sa méthode d’entrée/setup et son chemin de lancement ne sont pas prouvés. Ne jamais répéter un import Replit dont le Capability Gate est `INCOMPATIBLE` pour tenter de contourner le setup de la plateforme.**
