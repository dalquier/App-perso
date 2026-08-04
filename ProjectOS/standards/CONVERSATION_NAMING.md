# ProjectOS — Nommage des discussions

## Objectif

Rendre les conversations ChatGPT et Codex immédiatement identifiables, retrouvables et associables à une branche, une Pull Request ou un fichier de transmission.

## Règle obligatoire

Le premier prompt d’une nouvelle discussion liée à un projet logiciel doit commencer par une ligne explicite :

```text
Nom de la discussion : <nom demandé>
```

L’agent doit reprendre ce nom dans sa première réponse et demander à l’interface de l’utiliser lorsqu’elle permet le renommage automatique. Si l’interface ne permet pas à l’agent de renommer la discussion, il doit indiquer clairement à Damien le nom exact à appliquer manuellement.

La première réponse ProjectOS doit ensuite se terminer par la question exacte :

```text
Enregistrer la conversation ?
```

Aucun texte ne doit suivre cette question. L’identifiant de session n’est attribué qu’après une réponse positive.

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

Après consentement, utiliser :

```text
SES-AAAAMMJJ-NNN
```

L’identifiant doit apparaître dans l’index, la synthèse et les métadonnées d’archive lorsqu’elles existent.

## Transmission

Le nom de la discussion et, après consentement, l’identifiant de session doivent être reproduits dans :

- le fichier temporaire de transmission ;
- `IMPORT_METADATA.md` ou `IMPORT_METADATA.json` lorsqu’un raccourci iOS est utilisé ;
- la description de Pull Request lorsque pertinent ;
- le nom du bundle ou du dossier temporaire sous une forme compatible avec les noms de fichiers ;
- la synthèse et l’index conversationnels.

Le nom ne doit contenir ni secret ni donnée personnelle sensible.
