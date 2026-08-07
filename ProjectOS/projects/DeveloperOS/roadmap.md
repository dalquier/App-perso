# DeveloperOS — Roadmap canonique

- Dernière mise à jour : 2026-08-07
- Source de vérité : `dalquier/App-perso`, branche `main`
- Base vérifiée post CO-BUILD-02A : `b22fd5002c4ead8ef73a8927c89f81b9d8b4ff23`
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
| CO-BUILD-02 — Incrément A | intégré | PR #103 ; commit d’intégration `b22fd5002c4ead8ef73a8927c89f81b9d8b4ff23` |
| CO-QA-02A — gate Incrément A | terminé | défaut d’immutabilité imbriquée corrigé et testé dans PR #103 ; CI GitHub complète verte |

## 3. Travaux ouverts

### CO-BUILD-02 — Backend et canal OpenAI API

Statut : **en cours**.

- L’Incrément A est intégré dans `main` via PR #103.
- La PR historique #83 est fermée sans fusion et conservée uniquement pour traçabilité ; elle est supersédée par #103.
- L’Incrément A fournit la configuration serveur typée et bornée, les erreurs publiques assainies, les contrats `ExecutionProvider`, `ProviderRequest`, `ProviderResult`, `ProviderUsage`, un `FakeExecutionProvider` déterministe sans réseau et les tests serveur intégrés à la CI.
- L’Incrément A n’ajoute pas encore de serveur HTTP, d’authentification, de stockage serveur réel, de migrations PostgreSQL, de scheduler, de SDK OpenAI effectif ni d’UI API.
- L’Incrément B doit être défini depuis le `main` vivant et les contrats SPEC-00 / ADR-003 avant toute implémentation. Son périmètre ne doit pas être déduit implicitement des anciennes branches ou descriptions de PR.

### CO-QA-02A

Statut : **terminé**.

- Le QA a identifié un défaut fonctionnel bloquant : `ProviderResult` était gelé uniquement au premier niveau et laissait `usageObserved` mutable.
- PR #103 a reconstruit l’Incrément A depuis le `main` canonique, corrigé ce défaut et ajouté la preuve persistante correspondante.
- Le SHA candidat de #103 a obtenu ProjectOS Quality et DeveloperOS CI verts, y compris Server tests, build de production et Mobile E2E.
- Aucun gate CO-QA-02A restant ne bloque la préparation de l’Incrément B.

## 4. Séquencement Conversation Orchestrator

Ordre canonique :

1. `CO-BUILD-00` — contrats et fondations — **terminé**.
2. `CO-BUILD-01` — canal ChatGPT Plus manuel et persistance locale — **terminé**.
3. QA de CO-BUILD-01 — recette spécifique du canal manuel ; toute preuve durable doit être conservée séparément du code.
4. `CO-BUILD-02` — backend et canal OpenAI API — **en cours**, livré par incréments bornés.
5. `CO-BUILD-02` Incrément A + `CO-QA-02A` — **terminés** ; l’Incrément B est la prochaine unité à préparer.
6. Après chaque incrément matériel de `CO-BUILD-02`, exécuter le QA correspondant avant de poursuivre lorsqu’il valide une hypothèse ou une capacité nécessaire au lot suivant.
7. Déclarer `CO-BUILD-02` terminé seulement lorsque le canal API prévu par SPEC-00 est réellement utilisable avec authentification, secret côté serveur, exécution OpenAI, reprise, stockage privé/rétention et validations applicables.
8. `CO-BUILD-03` — hybride et synthèse maître — **futur**. Il ne commence pas avant la clôture de CO-BUILD-02 et de ses QA bloquants.
9. Effectuer ensuite une recette finale Conversation Orchestrator couvrant au minimum les deux canaux, le mode hybride, la synthèse maître, les reprises, la sécurité des secrets, l’iPhone et l’intégration avec le déploiement réel.

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

Un workflow ou une PR verte ne remplace pas une recette physique lorsque celle-ci fait partie du critère d’acceptation. De même, une CI verte sur un SHA devenu obsolète ne constitue pas la preuve d’intégration d’un SHA réconcilié ultérieurement.

## 7. Infrastructure parallèle

- `CI-V2` est intégré et n’est pas un Build fonctionnel Conversation Orchestrator.
- `PAGES-01` et `PAGES-FIX` sont intégrés ; ils constituent l’infrastructure de publication du client, pas une étape de CO-BUILD-02 ou CO-BUILD-03.
- Le runtime serveur futur de CO-BUILD-02 doit être décidé séparément de GitHub Pages.

## 8. Prochaine action canonique

1. préparer `CO-BUILD-02` Incrément B depuis le `main` vivant post PR #103 ;
2. relire SPEC-00, ADR-003, l’Incrément A intégré et le code serveur actuel ;
3. borner précisément l’Incrément B, ses fichiers autorisés, ses dépendances, son modèle de sécurité et son QA avant toute implémentation ;
4. implémenter l’Incrément B sur une branche dédiée, obtenir une CI complète sur le SHA candidat réel puis exécuter son QA ;
5. ne pas démarrer `CO-BUILD-03` avant clôture de CO-BUILD-02.
