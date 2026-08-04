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
2. Codex réalise les Builds substantiels sur une branche GitHub dédiée.
3. GitHub reste la source de vérité et le lieu canonique de livraison.
4. Replit Starter importe le dépôt pour l’exécution, les tests fonctionnels et le déploiement.
5. Pyto, Scriptable et Working Copy assurent les besoins iPhone et locaux selon leur périmètre.

## Projets connus

| ID | Nom | Alias | Statut ProjectOS | Dépôt et code canoniques | Références |
|---|---|---|---|---|---|
| `projectos` | ProjectOS | App perso, App-perso | actif | `dalquier/App-perso` | `ProjectOS/` |
| `developeros` | DeveloperOS | Developer OS | à migrer/compléter | à confirmer avant modification | à créer sous `ProjectOS/projects/DeveloperOS/` |
| `equilibre` | Équilibre | Equilibre, compagnon TCC, TCC Budy, TCC Buddy, TCC_Budy | reprise définie — BUILD-01 à lancer | dépôt : `dalquier/App-perso`; gouvernance : `ProjectOS/projects/Equilibre/`; application : `apps/equilibre/` | `ProjectOS/projects/Equilibre/` |
| `assistantia` | AssistantIA | Assistant IA | à migrer/compléter | à confirmer avant modification | à créer sous `ProjectOS/projects/AssistantIA/` |

## Résolution

1. Rechercher une correspondance exacte sur l’ID, le nom ou un alias.
2. Charger le manifeste si le dossier ProjectOS existe.
3. Vérifier le dépôt, la branche et le chemin applicatif dans GitHub.
4. Si la référence canonique manque, travailler en lecture seule ou signaler l’hypothèse.
5. Après vérification, mettre à jour ce registre dans une Pull Request.

## Ajout d’un projet

Un nouveau projet requiert au minimum :
- une ligne dans ce registre ;
- un dossier `ProjectOS/projects/<Nom>/` ;
- un `PROJECT_MANIFEST.md` ;
- un dépôt ou chemin applicatif canonique vérifié ;
- un statut et un prochain jalon.
