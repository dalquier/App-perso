# ProjectOS — Registre des projets

Ce registre permet d’identifier les projets, leurs alias et leurs références canoniques. Toute information non vérifiée est explicitement marquée `à confirmer`.

## Règles

- Un projet doit avoir un identifiant stable.
- Les alias servent uniquement à la résolution des demandes.
- Le dépôt, la branche par défaut et le dossier canonique doivent être vérifiés avant toute modification.
- Le manifeste du projet complète ce registre sans le contredire.
- Toute migration doit mettre à jour ce fichier et le manifeste associé.
- Tous les projets logiciels appliquent `standards/TOOLCHAIN_POLICY.md` sauf exception explicitement documentée.

## Workflow standard commun

1. ChatGPT clarifie, conçoit, spécifie et révise.
2. Codex réalise les Builds et changements substantiels sur une branche GitHub dédiée.
3. GitHub reste la source de vérité et le lieu canonique de livraison.
4. Replit Starter importe le dépôt pour l’exécution, les tests fonctionnels, l’hébergement et le déploiement, sauf exception projet explicitement documentée par ADR.
5. Pyto, Scriptable et Working Copy assurent les besoins iPhone et locaux selon leur périmètre.
6. L’agent IA Replit n’est utilisé qu’en exception justifiée pour une capacité propre à Replit.

## Projets connus

| ID | Nom | Alias | Statut ProjectOS | Dépôt et code canoniques | Références |
|---|---|---|---|---|---|
| `projectos` | ProjectOS | App perso, App-perso | actif | `dalquier/App-perso`, dossier `ProjectOS/` | `ProjectOS/` |
| `developeros` | DeveloperOS | Developer OS, gestionnaire de projets, Project Manager Pyto, PWA DeveloperOS | actif — CO-BUILD-02 en cours | dépôt `dalquier/App-perso`; code `apps/developer-os/` | `ProjectOS/projects/DeveloperOS/` ; exception déploiement : ADR-004 GitHub Pages |
| `equilibre` | Équilibre | Equilibre, compagnon TCC, TCC Budy, TCC Buddy, TCC_Budy | BUILD-01/02/03 intégrés — V4 / BUILD-04 construite sur branche, QA iPhone requise avant fusion | dépôt `dalquier/App-perso`; code `apps/equilibre/` | `ProjectOS/projects/Equilibre/` |
| `projectos-backup` | ProjectOS Backup | Projet 2, sauvegarde ProjectOS, backup de code | BUILD-01 construit — recette Pyto requise | dépôt `dalquier/App-perso`; code `apps/projectos-backup/` | `ProjectOS/projects/ProjectOSBackup/` |
| `assistantia` | AssistantIA | Assistant IA | à migrer/compléter | à confirmer avant modification | à créer sous `ProjectOS/projects/AssistantIA/` |
| `pyto-replit-test` | PytoReplitTest | test Pyto Replit | expérimentation temporaire — à supprimer après validation | dépôt `dalquier/App-perso`; code `apps/pyto-replit-test/` | `ProjectOS/projects/PytoReplitTest/` |

## Résolution

1. Rechercher une correspondance exacte sur l’ID, le nom ou un alias.
2. Charger le manifeste si le dossier ProjectOS existe.
3. Vérifier le dépôt, le dossier applicatif et la branche dans GitHub.
4. Si la référence canonique manque, ne pas l’inventer : travailler en lecture seule ou signaler l’hypothèse.
5. Après vérification, mettre à jour ce registre dans une Pull Request.

## Ajout d’un projet

Un nouveau projet requiert au minimum :
- une ligne dans ce registre ;
- un dossier `ProjectOS/projects/<Nom>/` ;
- un `PROJECT_MANIFEST.md` ;
- un dépôt ou dossier applicatif canonique vérifié ;
- un statut et un prochain jalon.
