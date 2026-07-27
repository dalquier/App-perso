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
4. produire une livraison récupérable, dans cet ordre de préférence :
   - une archive ZIP contenant les fichiers ajoutés ou modifiés, le compte rendu et `APPLY_INSTRUCTIONS.md` ;
   - un patch Git complet au format `.patch` ;
   - un bundle Git au format `.bundle` ;
   - à défaut, le contenu complet de chaque fichier dans la réponse ;
5. placer les éléments locaux sous :

```text
.projectos-temp/delivery-bundles/<date-heure>-<agent>-<sujet>/
```

6. inclure `APPLY_INSTRUCTIONS.md` avec la base attendue, la branche cible, la liste des fichiers, la procédure d’application, les contrôles et le retour arrière ;
7. transmettre réellement les éléments au destinataire : pièce jointe, téléchargement, feuille de partage iOS, archive enregistrée dans Fichiers ou contenu intégré dans la réponse ;
8. ne jamais considérer un chemin local inaccessible au coordinateur comme une transmission achevée ;
9. indiquer les chemins exacts et le moyen de récupération dans la réponse finale ;
10. distinguer clairement le travail terminé localement de la livraison GitHub non réalisée.

Un simple bloc de commandes à exécuter par Damien ne constitue pas une livraison conforme lorsqu’un patch, un bundle, une archive ou le contenu complet des fichiers peut être produit.

## Passage par Raccourcis iOS

Lorsque la livraison est accessible par la feuille de partage de l’iPhone, le mode recommandé est :

1. partager le ZIP, patch, bundle ou texte vers le raccourci `ProjectOS — Importer une livraison` ;
2. enregistrer l’entrée dans `iCloud Drive/ProjectOS/Inbox/<projet>/<horodatage>/` ;
3. conserver le nom de discussion, l’axe, la branche cible et l’URL de la conversation dans un fichier `IMPORT_METADATA.json` ou `IMPORT_METADATA.md` ;
4. ouvrir le dossier enregistré dans Fichiers ou Working Copy ;
5. notifier que la livraison est prête à être vérifiée ;
6. après intégration confirmée, déplacer ou supprimer le dossier temporaire.

Raccourcis facilite le transfert et le classement, mais ne remplace pas automatiquement l’application d’un patch Git ni l’ouverture d’une Pull Request sauf si une action tierce ou une API explicitement configurée le permet.

## Reprise par l’agent coordinateur

L’agent coordinateur doit lire le compte rendu, vérifier la livraison, la comparer à la branche canonique vivante, l’appliquer sur une branche dédiée, exécuter les contrôles, ouvrir ou mettre à jour la Pull Request, transférer les décisions durables vers les documents canoniques, puis supprimer les éléments temporaires.

## Sécurité et cycle de vie

Aucun fichier temporaire ou bundle ne doit être fusionné dans la branche canonique. La suppression ne garantit pas l’effacement cryptographique de l’historique Git : aucun secret, jeton, identifiant sensible, donnée médicale détaillée, donnée personnelle brute ou contenu confidentiel inutile ne doit y figurer.

Une limitation d’accès GitHub change le mode de livraison, mais ne réduit pas le niveau d’achèvement attendu.

## Critère de conformité

Une tâche substantielle n’est pas complètement transmise tant que le compte rendu n’est pas accessible, que son chemin et son moyen de récupération ne sont pas communiqués, que la reprise autonome n’est pas possible, ou que les éléments temporaires n’ont pas été supprimés après intégration.