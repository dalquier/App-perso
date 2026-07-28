# ProjectOS — Transmissions temporaires des agents

## Objectif

Permettre à ChatGPT, Codex ou tout autre agent intervenant sur un projet logiciel de rendre son résultat vérifiable et récupérable par un autre agent sans dépendre de l’accès à la conversation d’origine.

Le handoff ne remplace pas la livraison GitHub canonique. Il constitue soit une trace temporaire accompagnant une Pull Request, soit un mécanisme de transfert lorsque l’environnement de l’agent ne peut pas publier directement.

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
- le résultat du précontrôle des capacités de publication ;
- les décisions et hypothèses ;
- les actions réalisées ;
- les fichiers créés ou modifiés ;
- les tests ou contrôles exécutés ;
- les résultats obtenus ;
- les limites, risques et points ouverts ;
- la prochaine action recommandée ;
- la branche, les commits et la Pull Request lorsqu’ils existent ;
- le mode de livraison utilisé : `github-natif`, `github-cli` ou `handoff-restreint`.

Le compte rendu doit être autonome : un autre agent doit pouvoir le comprendre sans accéder à la conversation source.

## Précontrôle des capacités de publication

Avant toute production substantielle, l’agent distingue trois capacités différentes :

1. **lecture distante** : consultation du dépôt, de `origin/main`, des fichiers et des références vivantes ;
2. **écriture Git par credentials locaux** : `git push`, GitHub CLI ou jeton disponible dans le terminal ;
3. **publication native de la plateforme** : bouton ou intégration Codex permettant de publier une branche ou d’ouvrir une Pull Request sans exposer de credentials Git dans le terminal.

Un `git push --dry-run` refusé faute de credentials ne prouve pas que la publication native Codex est indisponible. Inversement, la lecture seule de GitHub ne prouve pas qu’une branche pourra être publiée.

L’agent doit tester ou confirmer le mécanisme réellement prévu pour livrer :

- publication native de la plateforme en priorité lorsqu’elle existe ;
- sinon Git/CLI avec credentials ;
- sinon `handoff-restreint`.

Si aucune méthode de transmission n’est disponible, la tâche est classée `bloquée avant exécution`. Si un handoff récupérable est possible, l’agent peut poursuivre en mode restreint, à condition de l’annoncer avant les modifications et de ne jamais présenter le résultat comme déjà livré dans GitHub.

## Mode normal A — publication native Codex ou plateforme

Lorsque l’environnement fournit une intégration GitHub native :

1. l’agent vérifie le dépôt canonique et la base distante vivante ;
2. il travaille sur une branche dédiée dans l’espace de travail ;
3. il crée les fichiers complets dans leur arborescence canonique ;
4. il crée le fichier temporaire de transmission ;
5. il utilise le mécanisme natif de publication ou de création de Pull Request ;
6. il vérifie ensuite dans GitHub que la branche, le commit et la Pull Request existent réellement ;
7. il indique la branche, le commit distant, la Pull Request et le chemin du fichier temporaire ;
8. il ne fusionne pas sans instruction explicite.

L’absence de credentials dans le terminal n’est pas une anomalie si la publication native fonctionne.

## Mode normal B — Git ou GitHub CLI autorisé en écriture

Lorsque l’agent dispose de credentials GitHub utilisables dans le terminal :

1. il travaille sur une branche distante dédiée ;
2. il crée les fichiers complets dans leur arborescence canonique ;
3. il crée le fichier temporaire de transmission ;
4. il pousse la branche et ouvre une Pull Request vers la branche canonique ;
5. il vérifie la présence distante de la branche et de la Pull Request ;
6. il indique la branche, le commit distant, la Pull Request et le chemin du fichier temporaire ;
7. il ne fusionne pas sans instruction explicite.

## Mode de repli — environnement en lecture seule ou publication impossible

Le mode `handoff-restreint` est autorisé lorsque :

- l’environnement peut lire le dépôt mais ne possède pas de credentials d’écriture ;
- la publication native Codex ou plateforme est absente ou échoue ;
- une panne survient après le début du travail ;
- Damien le demande explicitement.

Ce mode doit être annoncé dès que la limitation est connue. Il ne sert pas à masquer un échec : son objectif est de produire une livraison récupérable et vérifiable par l’agent coordinateur.

L’agent doit alors :

1. travailler à partir de la référence distante la plus récente qu’il peut vérifier ;
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

6. inclure `APPLY_INSTRUCTIONS.md` avec la base vérifiée, la branche cible, la liste des fichiers, la procédure d’application, les contrôles et le retour arrière ;
7. transmettre réellement les éléments au destinataire par un mécanisme vérifiable ;
8. vérifier que la pièce jointe, le lien ou le contenu est réellement visible avant d’affirmer sa transmission ;
9. ne jamais considérer un chemin local inaccessible comme une transmission achevée ;
10. distinguer clairement `construit localement, non publié` de `livré dans GitHub`.

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

Les secrets restent dans les gestionnaires de secrets des plateformes et ne sont jamais inscrits dans les prompts, le dépôt ou les bundles.

## Critère de conformité

Une livraison GitHub est achevée uniquement lorsque sa branche distante, son commit, ses fichiers et sa Pull Request sont vérifiables.

Un handoff restreint est transmis uniquement lorsque l’artefact est réellement accessible et que sa reprise autonome est possible. Sinon l’état reste `construit localement, non publié`.
