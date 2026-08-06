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

Interprétation obligatoire de cet alias :

1. consulter la branche `main` de `dalquier/App-perso` ;
2. charger la dernière version de `ProjectOS/BOOTSTRAP.md` ;
3. suivre sa séquence de chargement dynamique ;
4. utiliser les références vivantes, manifests et ADR résolus ;
5. traiter ensuite la demande de l’utilisateur ;
6. avec Codex, activer automatiquement la mémoire et l’archive Drive puis terminer par `Mémoire Codex : enregistrement activé.` ; avec ChatGPT ou un autre outil, terminer par `Enregistrer la conversation ?`.

Dans le projet ChatGPT `App perso`, ProjectOS est déjà actif : les commandes ci-dessous peuvent être utilisées sans répéter la phrase d’activation.

## Reprendre un projet

```text
Active ProjectOS depuis `dalquier/App-perso`, charge `ProjectOS/BOOTSTRAP.md`, puis identifie le projet concerné, consulte son manifeste, ses ADR et l’état vivant du dépôt. Présente l’état actuel, les travaux en cours, les risques et la prochaine action recommandée avant toute modification.
```

## Reprendre un projet avec mémoire

Après avoir répondu `oui` à `Enregistrer la conversation ?` :

```text
Charge l’index, la chronologie et uniquement les synthèses de sessions pertinentes du projet. Confronte-les à l’état vivant de GitHub, signale les contradictions et poursuis depuis la dernière action vérifiée.
```

## Évaluer une parallélisation

Après résolution du régime de mémoire, appliquer `standards/PARALLEL_EXECUTION.md`. Lorsque plusieurs flux visibles satisfont tous ses critères, répondre uniquement :

```text
Cette demande comporte des actions indépendantes. Les paralléliser ?
```

Réponses reconnues :

- `oui`, `go`, `vas-y`, `parallélise` ou équivalent positif : produire le découpage, les branches, les livrables et la réconciliation, puis lancer les flux autorisés ;
- `non`, `séquentiel`, `continue normalement` : poursuivre séquentiellement sans reposer la question pour le même périmètre ;
- `détaille`, `montre-moi le découpage`, `quelles actions ?` : présenter les flux, dépendances, outils, coûts et risques, puis terminer par la question canonique exacte.

Les lectures et vérifications internes sans effet de bord peuvent être parallélisées automatiquement sans afficher cette question.

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
Active ProjectOS depuis `dalquier/App-perso`, charge `ProjectOS/BOOTSTRAP.md`, puis crée le manifeste, l’architecture, les ADR initiales, le README, les tests essentiels, la CI et le plan de livraison. Utilise GitHub comme source de vérité, Replit Starter comme cloud par défaut et Pyto comme compagnon iPhone permanent lorsque pertinent.
```

## Clôturer une session enregistrée

```text
Clôture la session ProjectOS enregistrée. Vérifie l’archive Drive et son manifeste, mets à jour la synthèse, l’index et, si nécessaire, la chronologie. Transfère les décisions durables vers les références canoniques, distingue les faits vérifiés des hypothèses et signale tout élément manquant.
```

## Retrouver une conversation

```text
Retrouve la conversation ProjectOS correspondant à <description>. Recherche d’abord l’index et les synthèses GitHub, vérifie le manifeste Drive de la session sélectionnée, puis restitue la transcription et uniquement les pièces jointes demandées.
```

## Sauvegarder et vérifier

```text
Active ProjectOS depuis `dalquier/App-perso`, charge `ProjectOS/BOOTSTRAP.md`, puis vérifie la dernière sauvegarde GitHub et Google Drive, crée une archive horodatée si nécessaire, calcule son empreinte, contrôle la restauration possible et signale explicitement toute étape non vérifiée.
```
