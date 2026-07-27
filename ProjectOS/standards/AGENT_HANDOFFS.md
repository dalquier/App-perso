# ProjectOS — Transmissions temporaires des agents

## Objectif

Permettre à ChatGPT, Codex ou tout autre agent intervenant sur un projet logiciel de rendre son résultat vérifiable par un autre agent sans dépendre de l’accès à la conversation d’origine.

## Règle obligatoire

Pour toute tâche logicielle produisant une analyse, une spécification, une modification, un audit ou une livraison substantielle, l’agent doit enregistrer un compte rendu exploitable dans un fichier temporaire situé sur sa branche de travail.

Chemin recommandé :

```text
.projectos-temp/agent-handoffs/<date-heure>-<agent>-<sujet>.md
```

Le fichier doit être créé avant la réponse finale de l’agent et son chemin doit être indiqué explicitement dans cette réponse.

## Contenu minimal

Le fichier temporaire doit contenir :

- l’objectif traité ;
- l’état GitHub vérifié ;
- les décisions et hypothèses ;
- les actions réalisées ;
- les fichiers créés ou modifiés ;
- les tests ou contrôles exécutés ;
- les résultats obtenus ;
- les limites, risques et points ouverts ;
- la prochaine action recommandée ;
- la branche, les commits et la Pull Request lorsqu’ils existent.

Le compte rendu doit être autonome : un autre agent doit pouvoir le comprendre sans accéder à la conversation source.

## Cycle de vie

1. L’agent crée le fichier temporaire sur sa branche de travail.
2. Il indique son chemin exact dans sa réponse finale.
3. ChatGPT ou l’agent coordinateur lit le fichier, vérifie la livraison et agit en conséquence.
4. Après confirmation de la prise en compte, le fichier est supprimé de la branche active.
5. Aucun fichier de transmission temporaire ne doit être présent dans le contenu final fusionné dans la branche canonique.

La suppression ne garantit pas l’effacement cryptographique de l’historique Git. Ces fichiers ne doivent donc jamais contenir de secret, jeton, identifiant sensible, donnée médicale détaillée, donnée personnelle brute ou contenu confidentiel inutile.

## Portée et exceptions

- Cette règle s’applique aux tâches liées à un projet logiciel ou à ProjectOS.
- Une réponse triviale ne nécessitant aucune analyse ou livraison persistante peut en être dispensée.
- Si l’agent ne dispose pas d’un accès en écriture au dépôt ou à un espace de fichiers partagé, il doit le signaler clairement et fournir le compte rendu directement dans sa réponse selon le même format.
- Le fichier temporaire ne remplace ni la documentation durable, ni les ADR, ni le résumé de Pull Request.
- Les décisions durables doivent toujours être reportées dans les références canoniques avant suppression du fichier temporaire.

## Critère de conformité

Une tâche substantielle n’est pas considérée comme complètement transmise tant que :

- le fichier temporaire n’existe pas ou n’est pas accessible ;
- son chemin n’a pas été communiqué ;
- son contenu ne permet pas une reprise autonome ;
- les éléments durables n’ont pas été transférés vers la documentation canonique ;
- sa suppression finale n’a pas été vérifiée.
