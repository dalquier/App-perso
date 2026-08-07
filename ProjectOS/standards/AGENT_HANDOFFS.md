# ProjectOS — Transmissions temporaires des agents

## Objectif

Rendre toute analyse ou livraison substantielle compréhensible et récupérable sans dépendre de la conversation d’origine.

Le handoff accompagne la livraison GitHub. Il ne remplace la branche et la Pull Request que lorsqu’un incident empêche réellement la publication.

## Fichier temporaire obligatoire

Avant sa réponse finale, l’agent crée un compte rendu sous :

```text
.projectos-temp/agent-handoffs/<date-heure>-<agent>-<sujet>.md
```

Il contient au minimum :

- objectif et périmètre ;
- dépôt, branche de base et mode de livraison ;
- décisions et hypothèses ;
- actions réalisées ;
- fichiers créés ou modifiés ;
- tests exécutés et résultats ;
- limites, risques et points ouverts ;
- incidents détectés et leur état d’enregistrement dans le Ledger #87 ;
- prochaine action ;
- branche, commit et Pull Request lorsqu’ils existent.

Le fichier doit être autonome et ne contenir aucun secret ni donnée personnelle inutile.

## Incident capture pending

Appliquer `ProjectOS/standards/INCIDENT_LEARNING.md` à tout blocage matériel.

Lorsque l’environnement producteur ne peut pas écrire dans GitHub, le handoff contient pour chaque incident non encore enregistré :

```text
INCIDENT_CAPTURE_PENDING
incident_id: INC-...
signature: TYPE.SUBTYPE
severity: S1|S2|S3|S4
status: OPEN|MITIGATED|RESOLVED|ACCEPTED_LIMITATION
project: ...
tool: ...
stage: ...
occurred_at: ...
source: ...
symptom: ...
root_cause: ...
impact: ...
workaround: ...
projectos_coverage: NONE|PARTIAL|FULL
candidate_projectos_change: ...
```

Le coordinateur déduplique ensuite la signature et ajoute l’occurrence au `ProjectOS — Incident Ledger` #87. La suppression du handoff n’est autorisée qu’après transfert de tout incident pending utile.

## Modes de livraison

### Publication native Codex

Lorsque l’environnement Codex est relié au dépôt GitHub :

1. l’agent applique `ProjectOS/standards/CODEX_NATIVE_PUBLISHING.md` ;
2. il travaille dans le sandbox fourni ;
3. il produit les fichiers, les tests, le handoff et un diff propre ;
4. il ne bloque pas sur l’absence de remote, d’upstream ou d’identifiants Git dans le terminal ;
5. Damien publie ensuite la branche et la Pull Request par le menu GitHub de l’interface Codex ;
6. la branche et la Pull Request sont vérifiées dans GitHub ;
7. aucune fusion n’est effectuée sans instruction explicite.

Une branche locale `work` et une branche GitHub technique préfixée par `codex/` sont acceptables. Le nom logique demandé dans le prompt reste indiqué dans le handoff.

### Git ou GitHub CLI

Lorsque le terminal est réellement authentifié, l’agent peut pousser une branche dédiée, ouvrir une Pull Request, puis vérifier la livraison dans GitHub.

### Handoff restreint

Si la publication native ou CLI échoue après construction, l’agent produit une livraison récupérable sous :

```text
.projectos-temp/delivery-bundles/<date-heure>-<agent>-<sujet>/
```

Ordre de préférence :

1. `Copier git apply` ou patch Git complet ;
2. archive ZIP avec fichiers et `APPLY_INSTRUCTIONS.md` ;
3. bundle Git ;
4. contenu complet des fichiers, uniquement en dernier recours.

Un chemin local inaccessible ne constitue jamais une transmission.

## Échec de publication native

Si Codex a déjà produit un diff :

- ne pas recommencer le Build ;
- conserver la tâche et le diff ;
- copier le patch ou la commande `git apply` ;
- appliquer la livraison sur une branche dédiée dans Working Copy, ChatGPT ou un autre environnement autorisé ;
- ouvrir la Pull Request ;
- qualifier l’événement d’incident de publication et l’enregistrer selon `INCIDENT_LEARNING.md`.

## Reprise par le coordinateur

Le coordinateur lit le handoff, vérifie le diff et les tests, contrôle la branche et la Pull Request, transfère les décisions durables dans les références canoniques, transfère les incidents `INCIDENT_CAPTURE_PENDING` dans le Ledger #87, puis supprime les éléments temporaires avant fusion.

## Sécurité

- Aucun secret, jeton ou identifiant sensible dans le prompt, le dépôt, le Ledger ou le handoff.
- Aucun fichier temporaire ne doit être fusionné dans `main`.
- La connexion GitHub native de Codex est privilégiée.
- GitHub reste la source de vérité.

## États de livraison

- `construit` : diff et preuves de tests disponibles ;
- `publié` : branche et Pull Request visibles dans GitHub ;
- `livré` : Pull Request relue et conforme ;
- `intégré` : fusion explicitement décidée ;
- `transmis, publication en attente` : artefact récupérable fourni sans PR.
