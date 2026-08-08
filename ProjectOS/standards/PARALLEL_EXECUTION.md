# ProjectOS — Exécution parallèle contrôlée

## 1. Objet

Ce standard impose à ProjectOS de détecter les flux de travail réellement indépendants et de proposer leur parallélisation lorsqu’elle apporte un gain concret sans conflit, duplication ou surconsommation injustifiée.

La parallélisation visible reste sous le contrôle de Damien. Les lectures et vérifications internes sans effet de bord peuvent être exécutées en parallèle automatiquement.

Toute parallélisation susceptible de produire plusieurs branches ou Pull Requests dans un dépôt GitHub applique également `GITHUB_MERGE_COORDINATION.md`. Les développements peuvent être parallèles ; leur convergence vers une branche canonique reste séquentielle, fraîchement revalidée et explicitement autorisée.

## 2. Question canonique

Lorsqu’au moins deux flux visibles satisfont tous les critères du présent standard, ProjectOS envoie une réponse décisionnelle dédiée contenant exactement :

```text
Cette demande comporte des actions indépendantes. Les paralléliser ?
```

Cette réponse ne contient aucun préambule, aucune liste, aucune estimation de temps et aucun texte après la question.

Elle constitue une réponse décisionnelle, distincte des mises à jour intermédiaires régies par `PROGRESS_COMMUNICATION.md`.

## 3. Ordre avec la mémoire conversationnelle

Dans une nouvelle conversation ProjectOS :

1. terminer l’amorçage ;
2. appliquer le régime de mémoire défini dans `CONVERSATION_MEMORY.md` ;
3. avec ChatGPT ou un autre outil à consentement ponctuel, attendre la réponse à `Enregistrer la conversation ?` ;
4. reprendre ensuite la demande initiale ;
5. évaluer son potentiel de parallélisation ;
6. poser la question canonique si les critères sont remplis.

La question de parallélisation ne remplace, ne précède et ne fusionne jamais avec la question de consentement mémoire.

## 4. Parallélisation interne automatique

ProjectOS peut lancer automatiquement plusieurs opérations internes simultanées lorsque toutes les conditions suivantes sont réunies :

- lecture, recherche, comparaison ou vérification sans modification ;
- faible coût marginal ;
- aucun agent externe distinct ;
- aucune action demandée à Damien ;
- aucune modification de la stratégie de livraison ;
- aucun risque de conflit sur une ressource mutable.

Exemples : lire plusieurs fichiers indépendants, vérifier plusieurs états GitHub ou comparer des références nécessaires au même diagnostic.

Aucune question n’est affichée dans ce cas.

## 5. Parallélisation visible soumise à autorisation

La question canonique est obligatoire avant de lancer en parallèle :

- plusieurs tâches Codex ;
- plusieurs conversations de travail ;
- plusieurs branches de modification ;
- plusieurs agents ou outils externes ;
- plusieurs livrables indépendants ;
- plusieurs travaux humains distincts proposés à Damien.

## 6. Critères cumulatifs

La parallélisation visible peut être proposée seulement si :

1. au moins deux flux autonomes sont identifiés ;
2. chaque flux possède un objectif et un livrable distincts ;
3. aucun flux n’a besoin du résultat d’un autre pour commencer ;
4. les flux ne modifient pas les mêmes fichiers ;
5. les flux ne modifient pas la même branche ;
6. les flux ne modifient pas la même donnée ou ressource mutable ;
7. leurs critères d’acceptation peuvent être définis séparément ;
8. un coordinateur ou une étape finale de réconciliation est identifié ;
9. le gain attendu dépasse le coût de coordination ;
10. aucune analyse ou implémentation n’est dupliquée ;
11. le coût marginal reste proportionné ;
12. chaque flux dispose d’un canal de livraison réaliste et vérifiable.

## 7. Cas d’interdiction

Ne pas proposer la parallélisation lorsque :

- une action dépend du résultat d’une autre ;
- un diagnostic doit précéder la correction ;
- une décision d’architecture doit précéder l’implémentation ;
- des flux toucheraient les mêmes fichiers, la même branche ou une ressource mutable commune ;
- plusieurs agents reconstruiraient ou auditeraient le même périmètre sans objectif comparatif explicite ;
- l’opération est destructive ou difficilement réversible ;
- les dépendances sont inconnues ;
- aucun coordinateur n’est identifié ;
- le coût augmente fortement sans gain démontrable ;
- Codex et l’agent IA Replit travailleraient sur le même périmètre ;
- une Pull Request empilée dépend d’une branche précédente non stabilisée ;
- la demande peut être exécutée directement en quelques opérations simples.

## 8. Réponses reconnues

### Réponse positive

Reconnaître notamment `oui`, `go`, `vas-y`, `parallélise` et toute formulation positive non ambiguë.

ProjectOS présente alors un plan concis indiquant pour chaque flux : identifiant, objectif, entrées, livrable, critères d’acceptation, outil, branche éventuelle, canal de livraison et coordinateur. Les branches, fichiers et ressources mutables restent exclusifs à un seul flux. Aucune fusion n’est automatique.

Si ces flux produisent plusieurs Pull Requests destinées à une branche canonique, chaque PR entre ensuite dans le processus `DRAFT → READY_FOR_QA → READY_FOR_MERGE → MERGED` défini par `GITHUB_MERGE_COORDINATION.md`. Une fusion dans `main` invalide la qualification `READY_FOR_MERGE` des autres candidates jusqu’à leur nouveau Freshness Gate.

### Réponse négative

Reconnaître notamment `non`, `séquentiel` et `continue normalement`.

ProjectOS poursuit séquentiellement et ne repose pas la question pour le même périmètre, sauf changement matériel de la demande.

### Demande de détail

Reconnaître notamment `détaille`, `montre-moi le découpage` et `quelles actions ?`.

ProjectOS présente les flux, dépendances, outils, branches, coûts, gains et risques, puis termine par la question canonique exacte sans texte après.

Aucun mode permanent de parallélisation automatique n’est créé par ce standard.

## 9. Matrice d’orchestration

Lorsqu’une parallélisation est autorisée, utiliser une matrice de ce type :

| Flux | Objectif | Dépendances initiales | Fichiers ou ressources | Outil | Branche | Livrable | Coordinateur |
|---|---|---|---|---|---|---|---|

Une même Pull Request ne devient jamais un point de concurrence entre plusieurs agents. La réconciliation est réalisée après livraison des flux sur une branche ou dans une Pull Request explicitement désignée.

Pour les PR GitHub concurrentes, le coordinateur d’intégration applique `GITHUB_MERGE_COORDINATION.md` et les fusionne une par une. Après chaque fusion, les PR restantes doivent être revérifiées contre le nouveau `main` avant toute autorisation suivante.

## 10. Coût et outils

Chaque flux applique `CREDIT_OPTIMIZATION.md`. Une parallélisation ne justifie ni la duplication d’agents, ni une exception implicite à la politique Replit. L’agent IA Replit reste interdit par défaut et ne travaille jamais en parallèle avec Codex ou un humain sur les mêmes fichiers ou ressources.

## 11. Exemples normatifs

1. Corriger une faute dans un fichier : séquentiel, aucune question.
2. Vérifier trois fichiers indépendants : lectures internes parallèles, aucune question.
3. Préparer une spécification UX, un plan QA et un contrat de données indépendants : poser la question canonique.
4. Diagnostiquer puis corriger un bug : séquentiel jusqu’au diagnostic.
5. Deux tâches doivent modifier `BOOTSTRAP.md` : coordinateur unique, pas de concurrence.
6. Deux Builds indépendants dans des applications et branches distinctes : proposer la parallélisation ; s’ils produisent deux PR vers `main`, les développements restent parallèles mais les fusions sont séquentielles avec Freshness Gate entre les deux.
7. Nouvelle conversation ChatGPT avec demande parallélisable : résoudre d’abord `Enregistrer la conversation ?`, puis poser la question canonique.
8. Damien répond `non` : poursuivre séquentiellement sans reposer la question pour le même périmètre.

## 12. Conformité

Une exécution parallèle est conforme lorsque les critères sont vérifiés avant lancement, les périmètres sont exclusifs, le coût marginal est évalué, un coordinateur est désigné, les livrables sont traçables et la réconciliation finale est explicitement prévue.

Lorsqu'elle produit plusieurs Pull Requests, la conformité finale exige en plus que leur convergence applique `GITHUB_MERGE_COORDINATION.md` : Resource Locks, Freshness Gate global, preuve CI sur le SHA relu, fusion séquentielle et révalidation des candidates restantes après chaque évolution de `main`.
