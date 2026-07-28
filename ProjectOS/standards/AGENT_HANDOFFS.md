# ProjectOS — Transmissions temporaires des agents

## Objectif

Permettre à ChatGPT, Codex ou tout autre agent intervenant sur un projet logiciel de rendre son résultat vérifiable et récupérable par un autre agent sans dépendre de l’accès à la conversation d’origine.

Le handoff ne remplace pas la livraison GitHub normale d’un travail substantiel.

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
- le résultat du précontrôle Codex ;
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

## Précondition avant développement substantiel

Avant toute production de code substantielle, appliquer le précontrôle défini dans `CODE_WORK_ROUTING.md`.

Si l’accès au dépôt canonique, à la branche distante, à Internet lorsque nécessaire ou au mécanisme de création de Pull Request est absent, l’agent s’arrête avant d’écrire du code. Il classe la tâche `bloquée avant exécution` et indique le paramétrage à corriger.

Le mode de repli ne doit jamais servir à contourner un échec connu avant le démarrage.

## Mode normal — accès GitHub disponible

Lorsque l’agent dispose d’un accès GitHub vivant et autorisé en écriture :

1. il travaille sur une branche distante dédiée ;
2. il crée les fichiers complets dans leur arborescence canonique ;
3. il crée le fichier temporaire de transmission ;
4. il pousse la branche et ouvre une Pull Request vers la branche canonique ;
5. il indique la branche, le commit distant, la Pull Request et le chemin du fichier temporaire ;
6. il ne fusionne pas sans instruction explicite.

Un ZIP peut être ajouté sur une branche temporaire pour simplifier le téléchargement, mais ne remplace pas les fichiers du projet.

## Mode de repli — incident imprévisible après précontrôle réussi

Le mode `handoff-restreint` est autorisé uniquement lorsqu’une panne imprévisible survient après un précontrôle réussi, ou lorsque Damien le demande explicitement.

Exemples : expiration de jeton pendant la tâche, panne temporaire du service GitHub, rupture réseau après le début de l’exécution ou erreur de publication indépendante du paramétrage initial.

L’agent doit alors :

1. arrêter les modifications supplémentaires non indispensables ;
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
7. transmettre réellement les éléments au destinataire par un mécanisme vérifiable ;
8. vérifier que la pièce jointe, le lien ou le contenu est réellement visible avant d’affirmer sa transmission ;
9. ne jamais considérer un chemin local inaccessible comme une transmission achevée ;
10. distinguer clairement `construit localement, non livré` de `livré dans GitHub`.

Une affirmation de pièce jointe non visible est un échec de transmission et doit être corrigée avant la réponse finale.

## Passage par Raccourcis iOS

Lorsque la livraison est réellement accessible par la feuille de partage de l’iPhone, le mode recommandé est :

1. partager le ZIP, patch, bundle ou texte vers le raccourci `ProjectOS — Importer une livraison` ;
2. enregistrer l’entrée dans `iCloud Drive/ProjectOS/Inbox/<projet>/<horodatage>/` ;
3. conserver le nom de discussion, l’axe, la branche cible et l’URL de la conversation dans un fichier `IMPORT_METADATA.json` ou `IMPORT_METADATA.md` ;
4. ouvrir le dossier enregistré dans Fichiers ou Working Copy ;
5. notifier que la livraison est prête à être vérifiée ;
6. après intégration confirmée, déplacer ou supprimer le dossier temporaire.

Raccourcis facilite le transfert et le classement, mais ne remplace pas automatiquement l’application d’un patch Git ni l’ouverture d’une Pull Request.

## Reprise par l’agent coordinateur

L’agent coordinateur doit lire le compte rendu, vérifier la livraison, la comparer à la branche canonique vivante, l’appliquer sur une branche dédiée, exécuter les contrôles, ouvrir ou mettre à jour la Pull Request, transférer les décisions durables vers les documents canoniques, puis supprimer les éléments temporaires.

## Sécurité et cycle de vie

Aucun fichier temporaire ou bundle ne doit être fusionné dans la branche canonique. Aucun secret, jeton, identifiant sensible, donnée médicale détaillée, donnée personnelle brute ou contenu confidentiel inutile ne doit y figurer.

L’accès Internet de l’agent doit être activé seulement lorsque nécessaire. Les secrets restent dans les gestionnaires de secrets des plateformes et ne sont jamais inscrits dans les prompts, le dépôt ou les bundles.

## Critère de conformité

Une tâche substantielle est livrée uniquement lorsque sa branche distante, son commit, ses fichiers et sa Pull Request sont vérifiables.

Un handoff restreint est transmis uniquement lorsque l’artefact est réellement accessible et que sa reprise autonome est possible. Sinon l’état reste `construit localement, non livré`.
