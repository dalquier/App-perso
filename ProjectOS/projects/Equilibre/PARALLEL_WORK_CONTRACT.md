# Équilibre — Contrat de travail parallèle

## Règle générale

Les cinq axes travaillent sur des branches et Pull Requests distinctes, à partir de `main` après fusion de la Vague 0. Aucun axe ne développe de code applicatif pendant le Jalon A.

## Axes et fichiers réservés

### 1. Produit et UX
- Branche : `equilibre/spec-product-ux`
- Répertoire réservé : `ProjectOS/projects/Equilibre/docs/product-ux/`
- Livrables : vision, parcours, architecture de l’information, wireframes, états et critères UX.

### 2. Mémoire et données
- Branche : `equilibre/spec-memory-data`
- Répertoire réservé : `ProjectOS/projects/Equilibre/docs/memory-data/`
- Livrables : modèle conceptuel, schémas, consentement, rétention, anonymisation et critères.

### 3. Moteur TCC
- Branche : `equilibre/spec-tcc-engine`
- Répertoire réservé : `ProjectOS/projects/Equilibre/docs/tcc-engine/`
- Livrables : posture, machine d’états, schéma de protocole, protocoles V1 et tests conversationnels.

### 4. Architecture PWA/Replit/Pyto
- Branche : `equilibre/spec-architecture`
- Répertoire réservé : `ProjectOS/projects/Equilibre/docs/architecture/`
- Livrables : stack, modules, API, PWA, Replit, Pyto, secrets, déploiement et CI.

### 5. Qualité, sécurité et validation
- Branche : `equilibre/spec-quality-safety`
- Répertoire réservé : `ProjectOS/projects/Equilibre/docs/quality-safety/`
- Livrables : risques, stratégie de tests, scénarios sensibles, traçabilité et go/no-go.

## Fichiers partagés protégés

Pendant le Jalon A, aucun axe ne modifie directement :

- `PROJECT_MANIFEST.md` ;
- `roadmap.md` ;
- `PARALLEL_WORK_CONTRACT.md` ;
- `ProjectOS/PROJECT_REGISTRY.md` ;
- les ADR de Vague 0.

Toute proposition de modification est consignée dans `OPEN_POINTS.md` du répertoire de l’axe.

## Format minimum de chaque livraison

Chaque répertoire d’axe contient :

- `README.md` : périmètre et index ;
- `SPECIFICATION.md` : livrable principal ;
- `DECISIONS.md` : décisions et justifications ;
- `OPEN_POINTS.md` : inconnues, contradictions et arbitrages ;
- `ACCEPTANCE_CRITERIA.md` : critères vérifiables ;
- `SUMMARY.md` : synthèse de la PR et dépendances.

Des ADR proposées peuvent être ajoutées sous `ADR/proposals/<axe>/`, sans modifier les ADR acceptées.

## Interfaces obligatoires

Chaque axe explicite :

- données consommées et produites ;
- dépendances envers les autres axes ;
- hypothèses ;
- risques ;
- décisions irréversibles ;
- critères permettant de commencer le code.

## Points de convergence

1. **Convergence A — contrats** : cohérence des termes, objets et parcours.
2. **Convergence B — sécurité** : validation des flux de données et situations sensibles.
3. **Convergence C — MVP** : figer périmètre, architecture, modèle et tests.
4. **Convergence D — BUILD-01** : produire une spécification consolidée avant tout code.

## Règles GitHub

- partir de `main` à jour ;
- une branche et une PR par axe ;
- ne pas fusionner avant revue de convergence ;
- ne jamais stocker de données personnelles ou secrets ;
- documenter les tests ou justifier leur absence ;
- terminer la PR par état vérifié, fichiers, décisions, inconnues, risques et prochaine étape.
