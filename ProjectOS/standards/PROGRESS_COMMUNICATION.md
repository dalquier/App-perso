# ProjectOS — Communication de progression

## 1. Objectif

Maintenir Damien informé pendant les tâches qui nécessitent une attente perceptible, plusieurs opérations ou l’utilisation d’outils, sans exposer les raisonnements internes ni produire un journal technique illisible.

Chaque mise à jour doit permettre de comprendre rapidement :

- ce qui a réellement été terminé ou vérifié ;
- ce qui est en cours ou reste immédiatement à faire ;
- combien de temps la suite devrait encore prendre.

## 2. Format canonique

Les messages intermédiaires utilisent ce format compact :

```text
Réalisé : <un à trois éléments terminés ou résultats vérifiés>.
En cours : <action actuelle ou prochaine étape concrète>.
Temps restant estimé : <durée>.
```

Les trois lignes peuvent être regroupées en un court paragraphe lorsque la lisibilité reste meilleure.

## 3. Niveau de détail attendu

Le champ `Réalisé` mentionne des faits opérationnels et vérifiables, par exemple :

- références ou fichiers chargés ;
- état GitHub, branche ou Pull Request vérifiés ;
- contrôles ou tests terminés ;
- fichiers créés ou corrigés ;
- résultat intermédiaire utile à Damien.

Le champ `En cours` indique l’action actuellement exécutée ou la prochaine étape immédiate. Il ne décrit pas le raisonnement interne.

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
- avant une attente supplémentaire perceptible.

Éviter les mises à jour répétitives. Regrouper les opérations proches plutôt que commenter chaque lecture ou chaque appel d’outil.

## 5. Estimation du temps restant

L’estimation reste honnête et révisable. Utiliser selon le cas :

- `moins de 30 secondes` ;
- `environ une minute` ;
- `2 à 3 minutes` ;
- une autre fourchette réaliste.

Si un blocage, une vérification supplémentaire ou une opération imprévue modifie la durée, actualiser l’estimation dans la mise à jour suivante et expliquer le changement dans `Réalisé` ou `En cours` sans dramatiser.

Ne jamais présenter une estimation comme une promesse ferme.

## 6. Amorçage ProjectOS

Pendant l’amorçage d’une nouvelle conversation, le même format s’applique. Les détails restent synthétiques : groupes de références chargés, projet résolu, état vivant vérifié et anomalies détectées.

Exemple :

```text
Réalisé : BOOTSTRAP, index et socle obligatoire chargés.
En cours : résolution du projet et vérification de l’état GitHub.
Temps restant estimé : environ 30 secondes.
```

La première réponse d’amorçage reste conforme à `BOOTSTRAP.md` et se termine par le régime de mémoire applicable.

## 7. Réponses décisionnelles exactes

Les réponses dont la formulation exacte est imposée restent isolées et ne reçoivent aucune ligne de progression ajoutée. Cela concerne notamment :

- `Enregistrer la conversation ?`
- `Cette demande comporte des actions indépendantes. Les paralléliser ?`

Après la réponse de Damien, les mises à jour de progression reprennent au format canonique.

## 8. Tâches très courtes

Aucune mise à jour intermédiaire n’est nécessaire lorsque la réponse peut être produite immédiatement sans attente perceptible ni opération multiple.

## 9. Critère de conformité

Une communication de progression est conforme lorsqu’elle est courte, factuelle, utile, actualisée, accompagnée d’une estimation réaliste et dépourvue de raisonnement privé ou de bruit technique inutile.
