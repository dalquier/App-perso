# ProjectOS — Nommage des discussions

## Objectif

Rendre les conversations ChatGPT et Codex immédiatement identifiables, retrouvables et associables à une branche, une Pull Request ou un fichier de transmission.

## Règle obligatoire

Le premier prompt d’une nouvelle discussion liée à un projet logiciel doit commencer par une ligne explicite :

```text
Nom de la discussion : <nom demandé>
```

L’agent doit reprendre ce nom dans sa première réponse et demander à l’interface de l’utiliser lorsqu’elle permet le renommage automatique. Si l’interface ne permet pas à l’agent de renommer la discussion, il doit indiquer clairement à Damien le nom exact à appliquer manuellement.

Le régime de mémoire dépend de l’outil :

- avec Codex, le consentement permanent du 5 août 2026 active automatiquement l’enregistrement ; l’identifiant de session est attribué dès l’amorçage et la première réponse se termine par `Mémoire Codex : enregistrement activé.` ;
- avec tout autre outil, la première réponse ProjectOS se termine par la question exacte `Enregistrer la conversation ?`, sans aucun texte après ; l’identifiant de session n’est attribué qu’après une réponse positive.

## Convention

Format recommandé :

```text
<Projet> — <Vague ou jalon> — <Axe ou mission> — <action>
```

Exemples :

```text
Équilibre — Vague 1 — Produit et UX — Spécification
Équilibre — Vague 1 — Mémoire et données — Spécification
Équilibre — Vague 1 — Moteur TCC — Spécification
Équilibre — Vague 1 — Architecture — Spécification
Équilibre — Vague 1 — Qualité et sécurité — Spécification
```

## Identifiant de session

Après activation de la mémoire, utiliser :

```text
SES-AAAAMMJJ-NNN
```

L’identifiant doit apparaître dans l’index, la synthèse et les métadonnées d’archive lorsqu’elles existent.

## Transmission

Le nom de la discussion et, après activation, l’identifiant de session doivent être reproduits dans :

- le fichier temporaire de transmission ;
- `IMPORT_METADATA.md` ou `IMPORT_METADATA.json` lorsqu’un raccourci iOS est utilisé ;
- la description de Pull Request lorsque pertinent ;
- le nom du bundle ou du dossier temporaire sous une forme compatible avec les noms de fichiers ;
- la synthèse et l’index conversationnels.

Le nom ne doit contenir ni secret ni donnée personnelle sensible.
