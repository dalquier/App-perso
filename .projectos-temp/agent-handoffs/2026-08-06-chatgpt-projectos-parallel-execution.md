# Handoff temporaire — ProjectOS orchestration et progression transparente

- Date : 2026-08-06
- Agent : ChatGPT
- Dépôt : `dalquier/App-perso`
- Base vérifiée : `main` au SHA `0e31d26d1bbae9b446e511dc2a4c7347921b4b8c`
- Branche : `agent/projectos-controlled-parallel-execution`
- Livraison : GitHub direct, Pull Request Draft

## Contexte

Une tâche Codex avait construit et exporté une première version au commit local `7a5b8379a0839d036e8f33848614a7d3f1f9bdd0`, mais ce commit, sa branche et ses artefacts `/mnt/data/projectos-delivery/` n’étaient pas accessibles depuis cette conversation et n’étaient pas visibles dans GitHub.

À la demande explicite de Damien — « Vérifie corrige et publie » — une version corrigée et resserrée a été reconstruite directement depuis la source vivante `main`, sans prétendre publier le commit Codex inaccessible.

Après publication initiale, Damien a demandé que les conversations donnent davantage de détail sur les tâches réalisées tout en maintenant une évaluation du temps restant. La branche a donc été complétée par un standard canonique de communication de progression et l’alignement du Bootstrap et du Kernel.

## Delivery Preflight

```text
Repository: dalquier/App-perso
Source branch or base ref: main
Target branch: agent/projectos-controlled-parallel-execution
Source SHA: 0e31d26d1bbae9b446e511dc2a4c7347921b4b8c
Direct GitHub write available: YES
Binary-compatible channel required: NO
Selected delivery mode: github-direct
Expected external proof: branche distante, commit(s) et Pull Request Draft visibles dans GitHub
```

## Décisions — parallélisation

- créer `standards/PARALLEL_EXECUTION.md` comme référence canonique ;
- créer ADR-004 ;
- charger le standard à chaque demande ProjectOS ;
- préserver la priorité du consentement mémoire ;
- distinguer la question décisionnelle des mises à jour de progression ;
- permettre les lectures internes parallèles sans question ;
- soumettre les tâches, agents, branches ou livrables parallèles à autorisation ;
- interdire le partage de branche, fichiers ou ressources mutables ;
- imposer un coordinateur et une réconciliation ;
- ne créer aucune préférence permanente automatique.

## Décisions — communication de progression

- créer `standards/PROGRESS_COMMUNICATION.md` comme référence canonique ;
- remplacer les messages limités au seul temps restant par le format suivant :

```text
Réalisé : <résultats ou tâches terminés>.
En cours : <action actuelle ou prochaine étape>.
Temps restant estimé : <durée>.
```

- appliquer ce format pendant l’amorçage et les tâches perceptibles ;
- limiter le détail aux faits opérationnels utiles et vérifiables ;
- interdire l’exposition du raisonnement privé, des secrets et des journaux techniques exhaustifs ;
- conserver les questions exactes de mémoire et de parallélisation comme réponses isolées ;
- ne pas produire de mise à jour intermédiaire pour une tâche immédiatement réalisable.

## Fichiers

Ajoutés :

- `ProjectOS/standards/PARALLEL_EXECUTION.md`
- `ProjectOS/standards/PROGRESS_COMMUNICATION.md`
- `ProjectOS/ADR/ADR-004-CONTROLLED-PARALLEL-EXECUTION.md`
- `.projectos-temp/agent-handoffs/2026-08-06-chatgpt-projectos-parallel-execution.md`

Modifiés :

- `ProjectOS/00_INDEX.md`
- `ProjectOS/BOOTSTRAP.md`
- `ProjectOS/core/DECISION_ENGINE.md`
- `ProjectOS/core/KERNEL.md`
- `ProjectOS/prompts/ACTION_PROMPTS.md`

## Vérifications

- comparer la branche à `main` ;
- vérifier la formulation canonique de parallélisation ;
- vérifier l’ordre mémoire puis parallélisation ;
- vérifier le chargement obligatoire des deux nouveaux standards ;
- vérifier que les anciennes interdictions de détailler la progression ont été remplacées dans Bootstrap et Kernel ;
- vérifier l’absence de modification sous `apps/` et dans `PROJECT_REGISTRY.md` ;
- maintenir une Pull Request Draft ;
- contrôler les checks GitHub associés au SHA final.

## Limites

Le diff exact et les artefacts produits par Codex n’étaient pas récupérables dans cette conversation. La publication correspond donc à une reconstruction vérifiée depuis `main`, pas au commit local Codex `7a5b837...`.

Les estimations de durée restent indicatives et doivent être actualisées lorsqu’une opération imprévue modifie sensiblement le travail restant.

## Retour arrière

Fermer la Pull Request sans fusion ou annuler l’ensemble de ses commits.

## Avant fusion

Supprimer ce handoff temporaire après transfert de toute information durable dans les références canoniques.
