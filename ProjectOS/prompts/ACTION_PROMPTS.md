# Prompts d’action ProjectOS

## Commande d’activation canonique

Utiliser cette formule au début d’une conversation standard lorsque ProjectOS n’est pas déjà activé par les instructions du projet ChatGPT :

```text
Active ProjectOS depuis `dalquier/App-perso`, charge la dernière version de `ProjectOS/BOOTSTRAP.md`, exécute les références qu’il désigne, puis traite ma demande.
```

La formulation historique « selon le prompt maître » reste comprise comme un alias, mais elle doit désormais être résolue vers `BOOTSTRAP.md` et non vers une copie figée de `MASTER_PROJECT_PROMPT.md`.

```text
Active ProjectOS depuis `dalquier/App-perso`, puis traite ma demande selon le prompt maître.
```

Dans le projet ChatGPT `App perso`, ProjectOS est déjà actif : les commandes ci-dessous peuvent être utilisées sans répéter la phrase d’activation.

## Reprendre un projet

```text
Active ProjectOS depuis `dalquier/App-perso`, charge `ProjectOS/BOOTSTRAP.md`, puis identifie le projet concerné, consulte son manifeste, ses ADR, sa mémoire conversationnelle pertinente et l’état vivant du dépôt. Présente l’état actuel, l’évolution historique vérifiée, les travaux en cours, les contradictions, les risques et la prochaine action recommandée avant toute modification.
```

## Modifier du code

```text
Active ProjectOS depuis `dalquier/App-perso`, charge `ProjectOS/BOOTSTRAP.md`, puis traite ce changement. Travaille sur une branche dédiée, ne modifie pas main directement, inspecte les références et le code existant, implémente le plus petit changement cohérent, exécute les tests pertinents, documente le résultat et ouvre une Pull Request.
```

## Auditer un projet

```text
Active ProjectOS depuis `dalquier/App-perso`, charge `ProjectOS/BOOTSTRAP.md`, puis réalise un audit sans modification : architecture, qualité, sécurité, UX iPhone, données, dépendances, tests, documentation, CI et déploiement. Classe les constats par criticité et propose un plan de correction ordonné.
```

## Migrer un projet existant

```text
Active ProjectOS depuis `dalquier/App-perso`, charge `ProjectOS/BOOTSTRAP.md`, puis inventorie les sources vivantes, doublons et versions contradictoires. Désigne la source canonique, crée une sauvegarde, propose la structure cible, migre sur une branche dédiée, conserve une table de correspondance et un plan de retour arrière, puis ouvre une Pull Request.
```

## Créer un nouveau projet

```text
Active ProjectOS depuis `dalquier/App-perso`, charge `ProjectOS/BOOTSTRAP.md`, puis crée le manifeste, l’architecture, les ADR initiales, le README, les tests essentiels, la CI, la mémoire conversationnelle initiale et le plan de livraison. Utilise GitHub comme source de vérité, Replit Starter comme cloud par défaut et Pyto comme compagnon iPhone permanent lorsque pertinent.
```

## Clôturer une session

```text
Clôture cette session ProjectOS. Distingue les faits vérifiés, décisions, actions, tests, limites et prochaines étapes. Prépare ou mets à jour la synthèse de session, l’index des conversations et la chronologie, puis transfère les décisions durables vers le manifeste, les ADR, la roadmap ou la documentation appropriée. Indique l’état réel de l’archive brute, de la branche et de la Pull Request.
```

## Sauvegarder et vérifier

```text
Active ProjectOS depuis `dalquier/App-perso`, charge `ProjectOS/BOOTSTRAP.md`, puis vérifie la dernière sauvegarde GitHub et Google Drive, crée une archive horodatée si nécessaire, calcule son empreinte, contrôle la restauration possible et signale explicitement toute étape non vérifiée.
```
