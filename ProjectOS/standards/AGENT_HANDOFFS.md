# ProjectOS — Transmissions temporaires des agents

## Objectif

Permettre à ChatGPT, Codex ou tout autre agent intervenant sur un projet logiciel de rendre son résultat vérifiable et récupérable par un autre agent sans dépendre de l’accès à la conversation d’origine ni d’un accès GitHub en écriture.

## Règle obligatoire

Pour toute tâche logicielle produisant une analyse, une spécification, une modification, un audit ou une livraison substantielle, l’agent doit enregistrer un compte rendu exploitable dans un fichier temporaire situé sur sa branche ou dans son espace de travail.

Chemin recommandé :

```text
.projectos-temp/agent-handoffs/<date-heure>-<agent>-<sujet>.md
```

Le fichier doit être créé avant la réponse finale de l’agent et son chemin doit être indiqué explicitement dans cette réponse.

## Contenu minimal

Le fichier temporaire doit contenir :

- l’objectif traité ;
- l’état GitHub vérifié, ou l’impossibilité de le vérifier ;
- les décisions et hypothèses ;
- les actions réalisées ;
- les fichiers créés ou modifiés ;
- les tests ou contrôles exécutés ;
- les résultats obtenus ;
- les limites, risques et points ouverts ;
- la prochaine action recommandée ;
- la branche, les commits et la Pull Request lorsqu’ils existent ;
- le mode de livraison utilisé : `github` ou `handoff-restreint`.

Le compte rendu doit être autonome : un autre agent doit pouvoir le comprendre sans accéder à la conversation source.

## Mode normal — accès GitHub disponible

Lorsque l’agent dispose d’un accès GitHub vivant et autorisé en écriture :

1. il travaille sur une branche dédiée ;
2. il crée le fichier temporaire de transmission ;
3. il pousse la branche et ouvre une Pull Request vers la branche canonique ;
4. il indique la branche, la Pull Request et le chemin du fichier temporaire ;
5. il ne fusionne pas sans instruction explicite.

## Mode de repli — environnement restreint

Si `fetch`, `push`, la création de branche distante ou la création de Pull Request échoue pour une raison d’accès, de proxy, de jeton, de réseau ou de politique d’environnement, l’agent ne doit pas s’arrêter après avoir fourni des commandes shell.

Il doit :

1. terminer intégralement le travail dans son espace local ;
2. conserver un arbre de travail propre avec des commits locaux lorsque Git est disponible ;
3. créer le fichier temporaire de transmission ;
4. produire un bundle de livraison récupérable, dans cet ordre de préférence :
   - un patch Git complet au format `.patch` ;
   - un bundle Git au format `.bundle` ;
   - une archive ZIP contenant uniquement les fichiers ajoutés ou modifiés et le fichier de transmission ;
   - à défaut, le contenu complet de chaque fichier dans la réponse ;
5. placer ces éléments sous :

```text
.projectos-temp/delivery-bundles/<date-heure>-<agent>-<sujet>/
```

6. inclure un fichier `APPLY_INSTRUCTIONS.md` décrivant précisément :
   - le commit ou la base attendue ;
   - la branche cible ;
   - la liste des fichiers ;
   - la commande ou la procédure d’application ;
   - les contrôles à exécuter après reprise ;
   - la procédure de retour arrière ;
7. indiquer tous les chemins exacts dans sa réponse finale ;
8. distinguer clairement le travail terminé localement de la livraison GitHub non réalisée.

Un simple bloc de commandes à exécuter par Damien ne constitue pas une livraison conforme lorsqu’un patch, un bundle, une archive ou le contenu complet des fichiers peut être produit.

## Reprise par l’agent coordinateur

L’agent coordinateur doit :

1. lire le fichier de transmission ;
2. vérifier le bundle ou le patch ;
3. comparer les fichiers à la branche canonique vivante ;
4. appliquer la livraison sur une branche dédiée ;
5. exécuter les contrôles indiqués ;
6. ouvrir ou mettre à jour la Pull Request ;
7. transférer les décisions durables vers les documents canoniques ;
8. supprimer les fichiers temporaires et vérifier qu’ils ne seront pas fusionnés.

## Cycle de vie

1. L’agent crée le fichier temporaire et, si nécessaire, le bundle de livraison.
2. Il indique les chemins exacts dans sa réponse finale.
3. ChatGPT ou l’agent coordinateur lit, vérifie et reprend la livraison.
4. Après confirmation de la prise en compte, les fichiers temporaires sont supprimés de la branche active.
5. Aucun fichier de transmission ou bundle temporaire ne doit être présent dans le contenu final fusionné dans la branche canonique.

La suppression ne garantit pas l’effacement cryptographique de l’historique Git. Ces fichiers ne doivent donc jamais contenir de secret, jeton, identifiant sensible, donnée médicale détaillée, donnée personnelle brute ou contenu confidentiel inutile.

## Portée et exceptions

- Cette règle s’applique aux tâches liées à un projet logiciel ou à ProjectOS.
- Une réponse triviale ne nécessitant aucune analyse ou livraison persistante peut en être dispensée.
- Le fichier temporaire ne remplace ni la documentation durable, ni les ADR, ni le résumé de Pull Request.
- Les décisions durables doivent toujours être reportées dans les références canoniques avant suppression du fichier temporaire.
- Une limitation d’accès GitHub change le mode de livraison, mais ne réduit pas le niveau d’achèvement attendu.

## Critère de conformité

Une tâche substantielle n’est pas considérée comme complètement transmise tant que :

- le fichier temporaire n’existe pas ou n’est pas accessible ;
- son chemin n’a pas été communiqué ;
- son contenu ne permet pas une reprise autonome ;
- en environnement restreint, aucun patch, bundle, ZIP ou contenu complet récupérable n’a été fourni ;
- les éléments durables n’ont pas été transférés vers la documentation canonique ;
- la suppression finale des éléments temporaires n’a pas été vérifiée.