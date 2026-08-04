# ProjectOS — Mémoire conversationnelle

## Objet

Préserver la continuité des projets sans transformer les conversations en source de vérité. La mémoire conversationnelle est un contexte secondaire, indexé et sélectif. Le manifeste, les ADR, le code, les tests et l’état vivant de GitHub restent prioritaires.

## Structure par projet

```text
memory/
├── CONVERSATION_INDEX.md
├── PROJECT_TIMELINE.md
└── SESSION_SUMMARIES/
```

- `CONVERSATION_INDEX.md` recense les sessions significatives, leurs statuts, synthèses, branches, Pull Requests et archives.
- `PROJECT_TIMELINE.md` conserve uniquement les événements structurants du projet.
- `SESSION_SUMMARIES/` contient des comptes rendus autonomes et concis.

## Chargement au démarrage

Après résolution du projet et chargement de son manifeste :

1. charger l’index et la chronologie lorsqu’ils existent ;
2. sélectionner seulement les synthèses pertinentes selon la demande, le jalon, l’axe, la branche, la Pull Request, les mots-clés et la période ;
3. vérifier les faits dans GitHub avant de s’appuyer sur une ancienne synthèse ;
4. signaler les contradictions, décisions remplacées ou informations non vérifiées.

Ne jamais charger systématiquement toutes les conversations ni toutes les archives brutes.

## Sessions à mémoriser

Créer une synthèse lorsqu’une session produit au moins un élément substantiel : décision, spécification, diagnostic, audit, modification, livraison, test, changement de trajectoire, clarification structurante ou prochaine action durable.

Les questions ponctuelles sans impact durable ne nécessitent pas de synthèse.

## Contenu minimal d’une synthèse

- identifiant de session ;
- date, outil et nom de discussion ;
- projet, objectif et périmètre ;
- état initial et références vérifiées ;
- décisions et hypothèses ;
- actions, fichiers, branches, commits et Pull Requests ;
- tests et résultats ;
- limites, contradictions et points ouverts ;
- prochaine action ;
- documents canoniques mis à jour ou à mettre à jour ;
- emplacement de l’archive brute lorsqu’elle existe.

## Transfert vers les références canoniques

Une synthèse ne remplace jamais :

- une ADR pour une décision durable ou difficile à inverser ;
- le manifeste pour l’état, les contraintes et le prochain jalon ;
- la roadmap pour la trajectoire ;
- la documentation pour les procédures et spécifications ;
- une branche et une Pull Request pour une livraison logicielle.

Avant clôture, transférer les informations durables vers ces références.

## Archivage brut

Répartition recommandée :

- iCloud Drive : boîte d’entrée mobile `ProjectOS/Conversation-Inbox/<projet>/<session-id>/` ;
- Google Drive : archive brute durable `ProjectOS-Archives/<projet>/conversations/<année>/<session-id>/` ;
- GitHub : index, chronologie et synthèses seulement.

L’absence d’archive brute ne bloque jamais la consolidation canonique.

## Sécurité

Ne jamais conserver dans la mémoire ou les archives : secrets, jetons, mots de passe, clés API, données médicales détaillées, données personnelles brutes ou contenu confidentiel inutile. Signaler et expurger les éléments sensibles avant archivage.

## Clôture de session

Avant la réponse définitive d’une session significative :

1. préparer ou mettre à jour la synthèse ;
2. mettre à jour l’index ;
3. mettre à jour la chronologie si un événement structurant est survenu ;
4. transférer les décisions durables vers les documents canoniques ;
5. indiquer l’état réel de l’archive brute ;
6. vérifier la branche, les commits et la Pull Request lorsqu’ils existent.

## Statuts recommandés

`active`, `terminée`, `interrompue`, `obsolète`, `à vérifier`, `archivée`.
