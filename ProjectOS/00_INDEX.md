# ProjectOS — Index canonique

## Autorité

Ce dossier est la référence commune de tous les projets personnels. GitHub `dalquier/App-perso`, branche `main`, est la source de vérité.

## Point d’entrée

- `BOOTSTRAP.md` : chargeur unique de ProjectOS.
- `PROJECT_REGISTRY.md` : registre structuré des projets, alias et références canoniques.

## Noyau

- `core/KERNEL.md` : principes permanents et séquence de décision.
- `core/LIFECYCLE.md` : cycle de vie standard d’un projet et d’une modification.
- `core/DECISION_ENGINE.md` : règles de sélection des outils, de résolution des conflits et d’escalade.

## Standards transverses

- `standards/QUALITY_UX_SECURITY.md` : qualité, UX iPhone et sécurité.
- `standards/TOOLS_AND_STORAGE.md` : rôle des applications et stockages.
- `standards/CODE_WORK_ROUTING.md` : routage obligatoire des développements substantiels vers Codex et GitHub.
- `standards/CODING_STANDARDS.md` : règles communes de conception et de code.
- `standards/DOCUMENTATION.md` : exigences de documentation et traçabilité.
- `standards/TESTING.md` : stratégie de tests et preuves d’exécution.
- `standards/AGENT_HANDOFFS.md` : transmissions temporaires et livraisons récupérables des agents.
- `standards/CONVERSATION_NAMING.md` : convention obligatoire de nommage des discussions ChatGPT et Codex.

## Guides

- `guides/SHORTCUT_AGENT_HANDOFF.md` : flux iOS Raccourcis pour collecter et classer les livraisons d’agents.

## Prompts

- `prompts/MASTER_PROJECT_PROMPT.md` : version complète de secours du mode ProjectOS.
- `prompts/ACTION_PROMPTS.md` : commandes récurrentes.
- `prompts/CODING_PROMPTS.md` : prompts spécialisés pour développement, audit et correction.

## Projets

- `projects/README.md` : règles d’organisation des références propres aux projets.
- `projects/<projet>/PROJECT_MANIFEST.md` : contrat de pilotage du projet.
- `projects/<projet>/ADR/` : décisions d’architecture.
- `projects/<projet>/docs/` : documentation versionnée utile au pilotage.
- `projects/<projet>/roadmap.md` : trajectoire et jalons lorsque nécessaire.

Le registre central détermine quels projets disposent déjà d’un dossier ProjectOS et quelles références restent à confirmer ou à migrer.

## Modèles

- `templates/PROJECT_MANIFEST.md` : manifeste type.
- Les modèles ADR, roadmap et documents complémentaires peuvent être ajoutés sans modifier `BOOTSTRAP.md`, à condition d’être indexés ici.

## Archives

- `archives/` : références ProjectOS remplacées ou obsolètes, conservées uniquement pour traçabilité.
- Un document archivé ne doit jamais être chargé comme référence active sauf demande historique explicite.

## Ordre d’autorité

1. instruction explicite de Damien dans la conversation active ;
2. contraintes de sécurité et règles de plateforme ;
3. manifeste du projet concerné ;
4. ADR applicables ;
5. règles permanentes de ProjectOS ;
6. documentation versionnée ;
7. documentation collaborative explicitement référencée sur Google Drive ;
8. copie locale iCloud ;
9. historique conversationnel.

## Stockages

- GitHub : code, règles, manifests, ADR et documentation versionnée.
- Working Copy : copie Git locale sur iPhone.
- iCloud Drive : fichiers locaux, échanges Pyto et données non versionnées.
- Google Drive : documents collaboratifs, corpus et sauvegardes horodatées.

Une sauvegarde Drive n’est jamais une source de vérité.
