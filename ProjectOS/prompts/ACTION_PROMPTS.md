# Prompts d’action ProjectOS

## Activation canonique

```text
Active ProjectOS depuis `dalquier/App-perso`, charge la dernière version de `ProjectOS/BOOTSTRAP.md`, exécute les références qu’il désigne, puis traite ma demande.
```

L’alias « selon le prompt maître » se résout vers `BOOTSTRAP.md`.

Au démarrage :

- Codex active automatiquement l’archive et termine par `Mémoire Codex : enregistrement activé.` ;
- ChatGPT et les autres outils terminent par `Enregistrer la conversation ?`.

## Reprendre un projet

```text
Recharge ProjectOS depuis dalquier/App-perso, branche main. Relis la dernière version de ProjectOS/BOOTSTRAP.md, recharge toutes les références qu’il désigne et remplace les anciennes règles par les règles vivantes. Conserve le contexte et le choix de mémoire de cette conversation.
```

## Modifier du code

```text
Traite ce changement selon ProjectOS. Travaille sur une branche dédiée, inspecte les références et le code, implémente le plus petit changement cohérent, teste, documente et ouvre une Pull Request.
```

## Auditer

```text
Réalise un audit ProjectOS sans modification : architecture, qualité, sécurité, UX iPhone, données, dépendances, tests, documentation, CI et déploiement. Classe les constats par criticité.
```

## Clôturer une session enregistrée

```text
Clôture la session ProjectOS. Vérifie l’archive Drive et son manifeste, mets à jour la synthèse et l’index GitHub, actualise la chronologie si nécessaire, transfère les décisions durables et signale tout élément manquant.
```

## Retrouver une conversation

```text
Retrouve la conversation ProjectOS correspondant à <description>. Recherche l’index et les synthèses GitHub, vérifie le manifeste Drive de la session sélectionnée, puis restitue la transcription et les pièces jointes demandées.
```
