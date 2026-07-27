# ProjectOS — Registre des projets

Ce registre permet d’identifier les projets, leurs alias et leurs références canoniques. Toute information non vérifiée est explicitement marquée `à confirmer`.

## Règles

- Un projet doit avoir un identifiant stable.
- Les alias servent uniquement à la résolution des demandes.
- Le dépôt, la branche par défaut et le dossier canonique doivent être vérifiés avant toute modification.
- Le manifeste du projet complète ce registre sans le contredire.
- Toute migration doit mettre à jour ce fichier et le manifeste associé.

## Projets connus

| ID | Nom | Alias | Statut ProjectOS | Dépôt canonique | Références |
|---|---|---|---|---|---|
| `projectos` | ProjectOS | App perso, App-perso | actif | `dalquier/App-perso` | `ProjectOS/` |
| `developeros` | DeveloperOS | Developer OS | à migrer/compléter | à confirmer avant modification | à créer sous `ProjectOS/projects/DeveloperOS/` |
| `equilibre` | Équilibre | Equilibre, compagnon TCC, TCC Budy, TCC Buddy, TCC_Budy | initialisation en cours | gouvernance : `dalquier/App-perso`; code applicatif : à confirmer avant BUILD-01 | `ProjectOS/projects/Equilibre/` |
| `assistantia` | AssistantIA | Assistant IA | à migrer/compléter | à confirmer avant modification | à créer sous `ProjectOS/projects/AssistantIA/` |

## Résolution

1. Rechercher une correspondance exacte sur l’ID, le nom ou un alias.
2. Charger le manifeste si le dossier ProjectOS existe.
3. Vérifier le dépôt et la branche dans GitHub.
4. Si la référence canonique manque, ne pas l’inventer : travailler en lecture seule ou signaler l’hypothèse.
5. Après vérification, mettre à jour ce registre dans une Pull Request.

## Ajout d’un projet

Un nouveau projet requiert au minimum :
- une ligne dans ce registre ;
- un dossier `projects/<Nom>/` ;
- un `PROJECT_MANIFEST.md` ;
- un dépôt ou dossier canonique vérifié ;
- un statut et un prochain jalon.
