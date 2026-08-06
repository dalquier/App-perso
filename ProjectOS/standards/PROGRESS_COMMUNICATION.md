# ProjectOS — Communication de progression

## 1. Objectif

Maintenir Damien informé pendant les tâches qui nécessitent une attente perceptible, plusieurs opérations ou l’utilisation d’outils, sans exposer les raisonnements internes ni produire un journal technique illisible.

Chaque mise à jour doit permettre de comprendre rapidement :

- ce qui a réellement été terminé ou vérifié ;
- ce qui est en cours ;
- ce qu’il reste à faire avant la livraison ;
- combien de temps la suite devrait encore prendre.

## 2. Format canonique

Les messages intermédiaires utilisent ce format :

```text
Avancement
- Réalisé : <un à trois éléments terminés ou résultats vérifiés>.
- En cours : <action actuelle concrète>.
- Reste à faire : <prochaines étapes essentielles>.
- Temps restant estimé : <durée ou fourchette>.
```

Un champ facultatif peut être ajouté lorsqu’il apporte une information utile :

```text
- Point d’attention : <blocage, anomalie, décision ou cause d’une variation de durée>.
```

## 3. Niveau de détail attendu

Le champ `Réalisé` mentionne des faits opérationnels et vérifiables, par exemple :

- références ou fichiers chargés ;
- état GitHub, branche ou Pull Request vérifiés ;
- contrôles ou tests terminés et leur résultat ;
- fichiers créés ou corrigés ;
- résultat intermédiaire utile à Damien.

Le champ `En cours` indique l’action actuellement exécutée. Il ne décrit pas le raisonnement interne.

Le champ `Reste à faire` regroupe uniquement les étapes encore nécessaires au résultat demandé, à la livraison ou au meilleur résultat vérifiable possible.

Ne jamais afficher :

- chaîne de pensée, raisonnement privé ou notes internes ;
- secret, jeton, mot de passe ou donnée sensible ;
- détail exhaustif de chaque appel d’outil ;
- commandes ou journaux bruts sans utilité pour la décision ;
- affirmation non vérifiée présentée comme un résultat acquis.

## 4. Fréquence

Envoyer une mise à jour :

- au démarrage d’une tâche qui dépassera vraisemblablement quelques secondes ;
- après un groupe significatif d’opérations ou lorsqu’un résultat utile est obtenu ;
- lorsque l’estimation change sensiblement ;
- lorsqu’un blocage ou une anomalie modifie la trajectoire ;
- avant une attente supplémentaire perceptible.

Éviter les mises à jour répétitives. Regrouper les opérations proches plutôt que commenter chaque lecture ou chaque appel d’outil.

## 5. Estimation du temps restant

L’estimation reste honnête, révisable et non contractuelle. Utiliser selon le cas :

- `moins de 30 secondes` ;
- `environ une minute` ;
- `2 à 3 minutes` ;
- une autre fourchette réaliste.

Si un blocage, une vérification supplémentaire ou une opération imprévue modifie la durée, actualiser l’estimation dans la mise à jour suivante et expliquer brièvement le changement dans `Point d’attention`.

Ne jamais conserver artificiellement une estimation devenue manifestement fausse ni la présenter comme une promesse ferme.

## 6. Amorçage ProjectOS

Pendant l’amorçage d’une nouvelle conversation, le même format s’applique. Les détails restent synthétiques : groupes de références chargés, projet résolu, état vivant vérifié et anomalies détectées.

Exemple :

```text
Avancement
- Réalisé : BOOTSTRAP, index et socle obligatoire chargés.
- En cours : résolution du projet et vérification de l’état GitHub.
- Reste à faire : appliquer le régime de mémoire et préparer l’état d’amorçage.
- Temps restant estimé : environ 30 secondes.
```

La première réponse d’amorçage reste conforme à `BOOTSTRAP.md` et se termine par le régime de mémoire applicable.

## 7. Réponses décisionnelles exactes

Les réponses dont la formulation exacte est imposée restent isolées et ne reçoivent aucune ligne de progression ajoutée. Cela concerne notamment :

- `Enregistrer la conversation ?`
- `Cette demande comporte des actions indépendantes. Les paralléliser ?`

Après la réponse de Damien, les mises à jour de progression reprennent au format canonique.

## 8. Tâches très courtes

Aucune mise à jour intermédiaire n’est nécessaire lorsque la réponse peut être produite immédiatement sans attente perceptible ni opération multiple.

## 9. Fin de tâche

La réponse finale synthétise :

- le résultat obtenu ;
- les actions principales réalisées ;
- les preuves et tests ;
- les limites ou étapes encore nécessaires ;
- l’état exact de livraison lorsqu’il s’applique.

Elle ne répète pas mécaniquement tous les messages d’avancement.

## 10. Critère de conformité

Une communication de progression est conforme lorsqu’elle est factuelle, utile, suffisamment détaillée pour piloter la tâche, accompagnée d’une estimation réaliste et dépourvue de raisonnement privé ou de bruit technique inutile.
