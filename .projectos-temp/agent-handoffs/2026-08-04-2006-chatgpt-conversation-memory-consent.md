# Handoff — ProjectOS conversation memory consent

- Date : 2026-08-04 20:06 Europe/Paris
- Agent : ChatGPT
- Projet : ProjectOS
- Branche : `projectos/conversation-memory-consent`
- Mode de livraison : `github-natif`

## Objectif

Remplacer la PR 15 non fusionnée par une implémentation reconstruite depuis l’état vivant actuel de `main`, incluant un consentement explicite en fin de première réponse ProjectOS.

## État vérifié

- PR 15 fermée et non fusionnée.
- `main` relu après modifications parallèles.
- Nouveau standard `CODEX_NATIVE_PUBLISHING.md` pris en compte.
- Registre actualisé : DeveloperOS et Équilibre sont désormais canoniques dans `dalquier/App-perso` sous `apps/`.

## Résultat

- création de `standards/CONVERSATION_MEMORY.md` ;
- mise à jour de `BOOTSTRAP.md`, `00_INDEX.md`, `DOCUMENTATION.md`, `CONVERSATION_NAMING.md` et `ACTION_PROMPTS.md` ;
- création de trois modèles ;
- initialisation des espaces mémoire de DeveloperOS et Équilibre.

## Règle UX principale

La première réponse ProjectOS se termine exactement par :

`Enregistrer la conversation ?`

- `oui` active la mémoire et attribue un ID de session ;
- `non` poursuit sans aucun artefact de mémoire ;
- aucun artefact permanent n’est créé avant la réponse.

## Contrôles

- aucun code applicatif modifié ;
- aucune donnée sensible ajoutée ;
- aucune ancienne conversation inventée ;
- branche dédiée depuis `main`.

## Avant fusion

- relire la PR ;
- transférer les informations utiles dans la documentation canonique ;
- supprimer ce handoff temporaire ;
- ne pas fusionner sans instruction explicite.
