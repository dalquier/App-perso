# ProjectOS — Fiabilité Codex ↔ GitHub

## 1. Objet

Ce standard rend obligatoire la cohérence entre le travail produit par Codex, l’état réellement publié dans GitHub, les contrôles CI et la décision d’intégration.

Il complète `CODEX_NATIVE_PUBLISHING.md`, `ARTIFACT_DELIVERY_AND_RECOVERY.md`, `PARALLEL_EXECUTION.md` et `TESTING.md`. En cas de conflit, la règle la plus stricte s’applique pour toute tâche Codex ou tout flux où un résultat Codex doit être publié, relu ou fusionné dans GitHub.

Le but est d’empêcher cinq erreurs récurrentes :

- confondre un commit local avec un commit publié ;
- continuer à travailler sur un `main` devenu matériellement obsolète ;
- paralléliser deux tâches qui partagent une ressource logique mutable ;
- interpréter des checks verts attachés à un ancien SHA comme preuve du nouveau travail ;
- fusionner une Pull Request dont le SHA relu, le SHA testé et le SHA de tête ne sont pas identiques.

## 2. Principe fondamental

Une tâche n’est jamais jugée fiable à partir d’un seul environnement.

ProjectOS distingue systématiquement :

1. l’état de départ vérifié dans GitHub ;
2. l’état local produit dans le sandbox ou l’outil d’édition ;
3. l’état distant réellement publié ;
4. l’état effectivement testé par les workflows ;
5. l’état finalement relu et autorisé à la fusion.

Ces états doivent être rapprochés par SHA. Une similarité de contenu, un message de succès ou un nom de branche ne remplace pas cette preuve.

## 3. Reliability Preflight obligatoire

Avant la première modification, ajouter au Delivery Preflight les champs suivants :

```text
CODEX ↔ GITHUB RELIABILITY PREFLIGHT

Repository:
Base branch:
Base SHA observed:
Target branch:
Target PR:
Target PR head SHA observed: / NOT APPLICABLE
Launch context: CODEX UI / @codex / CHATGPT / OTHER

Native publish or Update PR available: YES / NO / NOT VERIFIABLE
Terminal push authenticated: YES / NO
Exportable recovery channel verified: YES / NO

Mutable files reserved:
Logical mutable resources reserved:
Freshness check required before edit: YES / NO
Freshness check required before publish: YES
Expected remote proof:
Expected CI proof:
Expected merge proof:
```

Si la cible est une PR existante, son `head_sha` distant est une précondition et non une information facultative.

Si la publication native ou le push direct ne sont pas vérifiables, un canal de récupération réellement exportable doit être prouvé avant le travail. `/tmp` ne constitue jamais ce canal.

## 4. Freshness Gate

### 4.1 Avant modification

Juste avant la première modification substantielle, vérifier que :

- `main` ou la branche de base existe toujours au SHA attendu ou identifier son nouveau SHA ;
- la branche/PR cible n’a pas changé depuis le preflight ;
- aucun fichier réservé n’a été modifié de manière incompatible ;
- aucune ressource logique réservée n’a changé de version ou de contrat.

Si la branche de base a avancé mais que les changements sont matériellement hors périmètre, la tâche peut continuer en consignant le nouveau SHA et la justification.

Si la branche de base a avancé sur un fichier ou une ressource logique du périmètre, arrêter l’implémentation courante et choisir explicitement entre :

- rebase ou reconstruction depuis la nouvelle base ;
- intégration séquencée d’une dépendance ;
- abandon de la branche devenue obsolète.

Il est interdit de continuer silencieusement avec une base connue comme incompatible.

### 4.2 Avant publication

Immédiatement avant publication ou mise à jour de PR, refaire le contrôle de fraîcheur.

La publication est bloquée si :

- la PR cible a changé depuis le dernier SHA vérifié sans réconciliation ;
- `main` a introduit une modification incompatible dans le même périmètre ;
- une migration, un contrat ou une ressource logique partagée a évolué ;
- le diff a été construit contre une base que l’agent ne peut plus relier proprement à l’état vivant.

## 5. Resource Lock Gate

La notion de ressource mutable ne se limite pas aux fichiers.

Avant toute parallélisation visible ou tout développement concurrent, inventorier et réserver les ressources logiques susceptibles de provoquer un conflit d’intégration, notamment :

- version et schéma de base de données ;
- migrations IndexedDB, SQLite ou stockage local ;
- routeur central et table de routes ;
- manifeste applicatif ;
- registre ProjectOS ;
- contrat JSON, schéma d’import/export ou API publique ;
- version de service worker ou stratégie de cache ;
- configuration de build, package manager ou workflow CI ;
- compteur/version globale ;
- fichier générateur dont plusieurs sorties dépendent ;
- branche ou Pull Request d’intégration commune.

Deux flux ne sont pas indépendants s’ils réclament la même ressource logique, même lorsque leurs fichiers principaux sont différents.

Pour chaque flux parallèle autorisé, consigner :

```text
RESOURCE LOCK
Flux:
Files:
Logical resources:
Owner:
Released when:
```

Un verrou n’est libéré qu’après publication vérifiée ou abandon explicite du flux.

## 6. Remote Proof Gate

Après publication, vérifier dans GitHub :

```text
LOCAL OR PRODUCED SHA:
REMOTE BRANCH HEAD SHA:
PR HEAD SHA:
```

Règle :

```text
published = REMOTE BRANCH HEAD SHA == PR HEAD SHA == SHA réellement publié
```

Le SHA local peut différer uniquement lorsqu’une publication native effectue une transformation explicitement observable, par exemple un squash ou un commit généré par la plateforme. Dans ce cas, la correspondance doit être expliquée et le diff distant relu.

Il est interdit de déclarer `publié`, `livré` ou `prêt pour CI` lorsque :

- aucun nouveau SHA distant n’est visible ;
- la PR reste sur l’ancien SHA ;
- seul un commit local existe ;
- seul un patch interne au sandbox existe.

## 7. CI Proof Gate

Un workflow vert est une preuve uniquement pour le SHA exact auquel il est attaché.

Avant de conclure que la CI valide le travail :

```text
REVIEWED SHA == PR HEAD SHA == CI TESTED SHA
```

Si l’une des trois valeurs diffère :

- le verdict CI est `STALE` pour la décision courante ;
- la PR ne peut pas passer en Ready sur cette base ;
- la fusion est interdite ;
- attendre ou déclencher les contrôles du SHA réellement relu.

La présence de workflows verts sur un ancien commit ne constitue jamais une preuve du nouveau correctif.

## 8. Independent Review Gate

Les tests écrits ou exécutés par l’agent constructeur ne remplacent pas la vérification du contrat.

Pour tout changement substantiel, séparer :

1. **preuve d’implémentation** : tests, build et contrôles locaux du constructeur ;
2. **preuve de conformité** : relecture indépendante du diff par rapport au manifeste, à l’ADR, au contrat ou au prompt accepté ;
3. **preuve d’intégration** : CI du SHA distant exact et, lorsqu’elle est pertinente, recette dans l’environnement cible.

Une tâche peut être `construite` avec des tests verts tout en restant `non livrée` ou `non conforme`.

## 9. Merge Gate

Aucune Pull Request issue d’un travail Codex n’est fusionnable selon ProjectOS tant que toutes les conditions applicables ne sont pas vraies :

- [ ] dépôt, base, branche cible et PR exacts vérifiés ;
- [ ] `main` ou la base a été revérifié juste avant la décision ;
- [ ] aucune incompatibilité non résolue avec un changement concurrent ;
- [ ] toutes les ressources logiques partagées ont été réconciliées ;
- [ ] le SHA relu est le SHA de tête de la PR ;
- [ ] les checks verts concernent exactement ce même SHA ;
- [ ] les discussions ou corrections bloquantes sont résolues ;
- [ ] les tests impossibles et recettes restantes sont explicitement qualifiés comme bloquants ou non bloquants ;
- [ ] aucun handoff temporaire, patch de secours, secret, cache ou artefact interdit n’est destiné à être fusionné ;
- [ ] la PR est dans l’état Draft/Ready attendu ;
- [ ] la fusion a été explicitement demandée ou autorisée.

Condition canonique :

```text
MERGEABLE BY PROJECTOS =
reviewed_sha == pr_head_sha == ci_tested_sha
AND freshness_gate == PASS
AND remote_proof_gate == PASS
AND blocking_reviews == 0
AND explicit_merge_authorization == YES
```

Si la plateforme autorise techniquement une fusion mais que cette expression est fausse, ProjectOS considère la fusion comme interdite.

## 10. Handoff et récupération avant exécution

Le canal de secours doit être défini et vérifié avant la première modification lorsque la publication n’est pas garantie.

Ordre obligatoire :

1. vérifier la publication native ou le push ;
2. sinon vérifier un emplacement exportable tel que `/mnt/data/projectos-delivery/` ;
3. vérifier qu’un fichier produit dans cet emplacement peut réellement être récupéré ;
4. seulement ensuite commencer le travail ;
5. en cas d’échec de publication, exporter le diff existant sans reconstruire l’implémentation.

Un patch uniquement sous `/tmp` est un artefact interne éphémère et ne satisfait jamais ce gate.

## 11. États normatifs

- `base-verifiee` : SHA de départ et cible GitHub vérifiés.
- `construit` : diff et validations locales disponibles.
- `recuperable` : canal de secours réellement utilisable.
- `publie` : nouveau SHA distant et PR vérifiés.
- `ci-validee` : checks verts attachés au SHA de tête actuellement relu.
- `livre` : conformité du résultat relue et preuves cohérentes.
- `pret-a-fusionner` : Merge Gate entièrement satisfait.
- `integre` : fusion explicitement réalisée et vérifiée dans la branche de base.

Ces états ne sont jamais synonymes et doivent progresser dans cet ordre logique.

## 12. Rapport final obligatoire

Pour toute tâche Codex substantielle publiée dans GitHub, le rapport final doit inclure au minimum :

```text
Base SHA initial:
Base SHA vivant avant publication:
PR head SHA initial:
Produced/local SHA:
Remote branch SHA:
PR head SHA final:
CI tested SHA:
Reviewed SHA:

Freshness Gate: PASS / FAIL / NOT APPLICABLE
Resource Lock Gate: PASS / FAIL / NOT APPLICABLE
Remote Proof Gate: PASS / FAIL
CI Proof Gate: PASS / FAIL / PENDING
Merge Gate: PASS / FAIL / NOT REQUESTED
Recovery channel: <mode et emplacement>
```

Toute valeur inconnue reste `UNKNOWN`; elle ne doit jamais être déduite ou inventée.

## 13. Règle permanente

**ProjectOS ne fait confiance ni au sandbox, ni au nom de branche, ni à un message de succès isolé. Il fait confiance à une chaîne de preuves cohérente reliant base vérifiée, diff produit, SHA distant, SHA testé, SHA relu et décision explicite de fusion.**
