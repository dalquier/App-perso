# DeveloperOS — Roadmap canonique

- Dernière mise à jour : 2026-08-07
- Source de vérité : `dalquier/App-perso`, branche `main`
- Base vérifiée lors de GOV-02 : `9ecc9d021f5dc365adbcb10286f26e27eccd2b50`
- Déploiement PWA cible : `https://dalquier.github.io/App-perso/developer-os/`

Cette roadmap décrit l’ordre de livraison et l’état d’intégration. Les spécifications détaillées restent dans les ADR et `docs/`. Un travail n’est `intégré` que lorsqu’il est fusionné et vérifié dans `main`.

## 1. Décisions acquises

- DeveloperOS reste une PWA TypeScript mobile-first, local-first et installable.
- Le dépôt canonique est `dalquier/App-perso` ; le code applicatif est sous `apps/developer-os/`.
- IndexedDB est en version 3 avec les stores `projects`, `codexConversations` et `conversation-runs`.
- Conversation Orchestrator possède exactement deux canaux : `chatgpt_plus_manual` et `openai_api`; le mode hybride est dérivé de leur combinaison.
- Le canal ChatGPT Plus reste manuel ; aucune extraction automatisée de ChatGPT n’est autorisée.
- La PWA est publiée par GitHub Pages. Replit n’est plus une dépendance cible de déploiement DeveloperOS.
- Le backend `CO-BUILD-02` constitue un sous-système serveur séparé de l’hébergement statique GitHub Pages.

## 2. Travaux intégrés

| Élément | État | Preuve principale |
|---|---|---|
| BUILD-01 — Project Core | intégré | application `apps/developer-os/` et historique BUILD-01 |
| Conversations Codex | intégré | PR #58 |
| Correction Clipboard | intégré | PR #69 |
| CO-BUILD-00 — contrats et fondations | intégré | PR #60 |
| CO-BUILD-01 — ChatGPT Plus manuel et persistance locale | intégré | PR #70 ; commit d’intégration `51178d642b6dcc2099a4e378f79f3b133f1bd3b1` |
| IndexedDB v3 partagé | intégré | `DB_VERSION = 3`, trois stores canoniques |
| CI-V2 | intégré | PR #78 |
| BUILD-02R V3 — reprise projet et références | intégré | PR #86 |
| PAGES-01 — GitHub Pages | intégré | PR #89 |
| PAGES-FIX — artefact sous `/developer-os/` | intégré | PR #92 |

## 3. Travaux ouverts

### CO-BUILD-02 — Backend et canal OpenAI API

Statut : **en cours**.

- Incrément A publié en Draft PR #83.
- Head vérifié de la PR lors de GOV-02 : `626e6d4396208f7a4dbf7d9c2e99373d0f8fb403`.
- L’incrément A prépare la configuration serveur, les limites, les contrats d’exécution, un provider fictif déterministe et les tests serveur.
- L’incrément A n’ajoute pas encore de serveur HTTP, d’authentification, de stockage serveur réel, de scheduler, de SDK OpenAI effectif ni d’UI API.
- Tant que #83 n’est pas intégrée, aucun de ces éléments n’appartient à `main`.

### CO-QA-02A

Statut : **en cours déclaré, non intégré**.

- GOV-02 ne trouve ni fichier canonique ni Pull Request portant exactement l’identifiant `CO-QA-02A`.
- Ce travail doit donc être traité comme une validation opérationnelle en cours, pas comme une livraison GitHub acquise.
- Son résultat doit être consigné avant d’engager l’incrément suivant de CO-BUILD-02 lorsqu’il constitue un gate d’acceptation.

## 4. Séquencement Conversation Orchestrator

Ordre canonique :

1. `CO-BUILD-00` — contrats et fondations — **terminé**.
2. `CO-BUILD-01` — canal ChatGPT Plus manuel et persistance locale — **terminé**.
3. QA de CO-BUILD-01 — recette spécifique du canal manuel ; toute preuve durable doit être conservée séparément du code.
4. `CO-BUILD-02` — backend et canal OpenAI API — **en cours**, livré par incréments bornés.
5. Après chaque incrément matériel de `CO-BUILD-02`, exécuter le QA correspondant avant de poursuivre lorsqu’il valide une hypothèse ou une capacité nécessaire au lot suivant. `CO-QA-02A` est actuellement ce gate pour l’Incrément A.
6. Déclarer `CO-BUILD-02` terminé seulement lorsque le canal API prévu par SPEC-00 est réellement utilisable avec authentification, secret côté serveur, exécution OpenAI, reprise, stockage privé/rétention et validations applicables.
7. `CO-BUILD-03` — hybride et synthèse maître — **futur**. Il ne commence pas avant la clôture de CO-BUILD-02 et de ses QA bloquants.
8. Effectuer ensuite une recette finale Conversation Orchestrator couvrant au minimum les deux canaux, le mode hybride, la synthèse maître, les reprises, la sécurité des secrets, l’iPhone et l’intégration avec le déploiement réel.

## 5. CO-BUILD-03 — périmètre futur

CO-BUILD-03 reste hors du travail courant. Son périmètre attendu demeure :

- combinaison des canaux manuel et API dans un même run ;
- consolidation des résultats ;
- génération de `master-input.md` ;
- lancement de la synthèse maître par le canal choisi ;
- gestion explicite des résultats partiels.

Aucune implémentation CO-BUILD-03 ne doit être anticipée dans CO-BUILD-02 sauf interface ou contrat déjà figé et strictement nécessaire au lot courant.

## 6. QA et preuves

Les preuves sont distinctes :

- **CI GitHub** : lint, TypeScript, tests, build, E2E et tests serveur lorsque le périmètre les introduit ;
- **QA d’incrément** : valide le contrat fonctionnel ou technique du lot avant le suivant ;
- **smoke test GitHub Pages** : vérifie la disponibilité réelle du client publié ;
- **recette iPhone** : vérifie les parcours manuels, PWA, clavier, retour, persistance et reprise ;
- **QA backend** : vérifie séparément authentification, secrets, réseau, persistance serveur, rétention et erreurs.

Un workflow ou une PR verte ne remplace pas une recette physique lorsque celle-ci fait partie du critère d’acceptation.

## 7. Infrastructure parallèle

- `CI-V2` est intégré et n’est pas un Build fonctionnel Conversation Orchestrator.
- `PAGES-01` et `PAGES-FIX` sont intégrés ; ils constituent l’infrastructure de publication du client, pas une étape de CO-BUILD-02 ou CO-BUILD-03.
- Le runtime serveur futur de CO-BUILD-02 doit être décidé séparément de GitHub Pages.

## 8. Prochaine action canonique

1. terminer `CO-QA-02A` et consigner son verdict ;
2. corriger ou compléter l’Incrément A si le QA révèle un défaut ;
3. seulement ensuite préparer l’incrément suivant de `CO-BUILD-02` ;
4. ne pas démarrer `CO-BUILD-03` avant clôture de CO-BUILD-02.
