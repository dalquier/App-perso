# ProjectOS — Coordination globale des fusions GitHub

## 1. Objet

Ce standard protège `main` lorsque plusieurs projets, agents, conversations, branches ou Pull Requests évoluent en parallèle dans un même dépôt GitHub.

Il s'applique à toute Pull Request destinée à une branche canonique ProjectOS, quel que soit l'outil qui l'a produite : Codex, ChatGPT, humain, GitHub UI, script ou autre environnement autorisé.

Le principe est permanent :

> Les développements peuvent être parallèles ; les décisions de fusion sont séquentielles et revalidées sur le `main` vivant.

Aucun projet n'a besoin d'être déjà piloté dans DeveloperOS pour bénéficier de cette protection.

## 2. Autorité de fusion

- Aucun agent constructeur ne fusionne automatiquement sa propre Pull Request.
- Toute fusion vers `main` passe par un coordinateur d'intégration explicitement identifié.
- Par défaut, pour `dalquier/App-perso`, le coordinateur est la conversation ProjectOS/CTO de pilotage maître ou toute conversation explicitement désignée par Damien pour cette intégration.
- Une autorisation de créer, publier ou mettre à jour une PR n'est jamais une autorisation de fusion.
- Une autorisation de fusion vaut uniquement pour la PR et le SHA de tête explicitement vérifiés au moment du Merge Gate.

## 3. États normatifs d'une Pull Request

ProjectOS distingue au minimum :

1. `DRAFT` — construction en cours ;
2. `READY_FOR_QA` — implémentation livrée, QA/relecture encore requise ;
3. `READY_FOR_MERGE` — Merge Gate global satisfait sur le `main` vivant ;
4. `MERGED` — fusion réalisée et vérifiée dans la branche cible.

Une PR peut être techniquement mergeable par GitHub et rester interdite à la fusion selon ProjectOS.

## 4. Déclaration obligatoire de périmètre

Toute PR substantielle doit permettre d'identifier :

- dépôt ;
- branche de base ;
- SHA de base initial ;
- branche de travail ;
- SHA de tête courant ;
- fichiers modifiés ;
- ressources logiques mutables touchées ;
- dépendances avec d'autres PR ;
- CI attendue ;
- tests manuels résiduels ;
- coordinateur de fusion.

Les ressources logiques mutables incluent notamment :

- schémas et versions de base de données ;
- migrations ;
- routeur central ;
- contrats JSON/API ;
- manifeste ou registre ProjectOS ;
- package lock / dépendances structurantes ;
- workflows CI/CD ;
- configuration de build/déploiement ;
- service worker/cache ;
- version globale ;
- tout fichier générateur ou ressource partagée dont plusieurs flux dépendent.

## 5. Resource Lock global

Deux travaux ne sont pas indépendants s'ils modifient la même ressource logique, même lorsque leurs fichiers diffèrent.

Avant un développement parallèle substantiel, chaque flux déclare :

```text
RESOURCE LOCK
Flux:
Repository:
Branch:
Files:
Logical resources:
Owner:
Released when:
```

Règles :

- une même ressource mutable ne peut avoir qu'un propriétaire écrivain à la fois ;
- les lectures peuvent rester parallèles ;
- le verrou est libéré après publication vérifiée, abandon explicite ou réconciliation ;
- une PR empilée dépendante d'une autre n'est pas considérée indépendante.

## 6. Freshness Gate global avant fusion

Immédiatement avant toute décision de fusion :

1. relire le SHA vivant de `main` ou de la branche cible ;
2. relire le SHA de tête de la PR ;
3. identifier tous les commits fusionnés dans la base depuis le SHA de base de la PR ;
4. comparer les fichiers modifiés ;
5. comparer les ressources logiques/contrats partagés, même sans conflit textuel ;
6. identifier les autres PR ouvertes susceptibles d'interférer ;
7. qualifier le candidat : `FRESH`, `STALE_COMPATIBLE` ou `STALE_CONFLICTING`.

### FRESH

La PR est déjà alignée sur la base vivante pertinente et peut poursuivre le Merge Gate.

### STALE_COMPATIBLE

La base a avancé sans incompatibilité matérielle. La PR doit être remise à jour sur la base vivante selon la stratégie adaptée, puis tous les checks requis doivent être relancés sur le nouveau SHA candidat.

### STALE_CONFLICTING

Un fichier, contrat, migration, ressource logique ou hypothèse a changé de manière matérielle. La fusion est bloquée jusqu'à réconciliation explicite, reconstruction ou reséquencement.

L'absence de conflit Git textuel ne suffit jamais à conclure `compatible`.

## 7. CI Proof Gate

La preuve CI doit concerner exactement le candidat relu :

```text
REVIEWED SHA == PR HEAD SHA == CI TESTED SHA
```

Si `main` évolue et que la PR est réconciliée :

- l'ancien verdict CI devient `STALE` ;
- les checks doivent être exécutés à nouveau sur le nouveau SHA ;
- aucune fusion ne peut utiliser les résultats d'un SHA précédent.

## 8. Fusion séquentielle obligatoire

Même lorsque plusieurs PR sont simultanément `READY_FOR_MERGE`, ProjectOS les intègre une par une.

Procédure :

1. choisir la prochaine PR selon dépendances, priorité et risque ;
2. exécuter son Freshness Gate global ;
3. exécuter son Merge Gate ;
4. obtenir l'autorisation explicite de fusion ;
5. fusionner ;
6. vérifier le nouveau SHA de `main` ;
7. invalider l'état `READY_FOR_MERGE` des autres PR candidates tant qu'elles n'ont pas été revérifiées contre ce nouveau `main` ;
8. répéter pour la suivante.

Ainsi, le développement est parallèle mais la convergence est sérialisée.

## 9. Merge Gate global

Une PR est `READY_FOR_MERGE` seulement si toutes les conditions applicables sont vraies :

- [ ] dépôt et branche cible vérifiés ;
- [ ] PR exacte vérifiée ;
- [ ] SHA de tête relu ;
- [ ] `main` vivant relu immédiatement avant décision ;
- [ ] Freshness Gate = PASS ;
- [ ] aucun Resource Lock concurrent non réconcilié ;
- [ ] aucun conflit logique non résolu ;
- [ ] SHA relu = SHA de tête = SHA testé par CI ;
- [ ] checks requis verts ;
- [ ] reviews/discussions bloquantes résolues ;
- [ ] tests manuels réellement requis effectués ou explicitement qualifiés non bloquants ;
- [ ] aucune dépendance PR non intégrée oubliée ;
- [ ] autorisation explicite de fusion obtenue pour ce candidat exact.

Condition canonique :

```text
READY_FOR_MERGE =
freshness_gate == PASS
AND resource_lock_conflicts == 0
AND logical_conflicts == 0
AND reviewed_sha == pr_head_sha == ci_tested_sha
AND required_checks == PASS
AND blocking_reviews == 0
AND explicit_merge_authorization == YES
```

## 10. PR simultanées dans plusieurs projets

Le standard est transversal au dépôt.

Lorsque plusieurs projets de `dalquier/App-perso` génèrent des PR en parallèle :

- ProjectOS ne suppose jamais qu'elles sont indépendantes uniquement parce qu'elles appartiennent à des dossiers différents ;
- les fichiers transverses (`ProjectOS/`, `.github/`, lockfiles, configuration racine, déploiement, registres, scripts partagés) sont traités comme ressources communes ;
- les contrats partagés sont examinés séparément des fichiers ;
- une fusion dans un projet peut invalider la preuve de fraîcheur d'une PR d'un autre projet ;
- chaque PR restante repasse par le Freshness Gate après toute fusion pertinente dans `main`.

## 11. GitHub comme filet de sécurité, pas comme autorité unique

Lorsque les fonctionnalités du dépôt le permettent, ProjectOS recommande de configurer GitHub pour :

- exiger une Pull Request avant modification de `main` ;
- exiger les status checks pertinents ;
- exiger que la branche soit à jour avant fusion lorsque ce mode est disponible ;
- empêcher les force pushes sur `main` ;
- empêcher la suppression de `main` ;
- limiter les contournements des protections.

Ces protections complètent ProjectOS mais ne remplacent pas le contrôle des conflits logiques.

## 12. Relation avec les autres standards

- `PARALLEL_EXECUTION.md` décide si des flux peuvent être lancés en parallèle et impose les Resource Locks.
- Le présent standard gouverne leur convergence GitHub et toutes les fusions vers une branche canonique.
- `CODEX_GITHUB_RELIABILITY.md` ajoute les preuves spécifiques aux environnements Codex ; sa règle la plus stricte s'applique lorsqu'elle dépasse le présent standard.
- `ARTIFACT_DELIVERY_AND_RECOVERY.md` gouverne la livraison et la récupération des artefacts.
- `TESTING.md` gouverne les preuves de test.

## 13. Rapport de fusion recommandé

Avant toute fusion substantielle, produire au minimum :

```text
MERGE COORDINATION REPORT
Repository:
PR:
Base branch:
Initial base SHA:
Live base SHA:
PR head SHA:
Reviewed SHA:
CI tested SHA:
Changed files:
Logical resources:
Concurrent PRs checked:
Freshness Gate: PASS / FAIL
Resource Lock Gate: PASS / FAIL
Logical Conflict Gate: PASS / FAIL
CI Proof Gate: PASS / FAIL
Manual QA: PASS / FAIL / NOT REQUIRED
Explicit merge authorization: YES / NO
Verdict: READY_FOR_MERGE / BLOCKED
```

## 14. Règle permanente

**ProjectOS ne protège pas `main` en empêchant le travail parallèle. Il protège `main` en imposant des périmètres exclusifs pendant la construction, puis une réconciliation fraîche, prouvée et séquentielle au moment de chaque fusion.**
