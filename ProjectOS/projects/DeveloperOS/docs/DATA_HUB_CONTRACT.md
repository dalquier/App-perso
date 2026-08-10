# DeveloperOS — DATA-HUB-00 — Contrat Data Hub, sync et migration

- Statut : candidat DATA-HUB-00
- Date : 2026-08-09
- ADR de décision : `../ADR/ADR-012-DATA-HUB-CANONICAL-POSTGRESQL.md`
- Périmètre : contrats uniquement, aucune infrastructure réelle provisionnée

## 1. But

Ce document fige le contrat minimal permettant à DeveloperOS d’évoluer d’un ensemble de silos IndexedDB vers un système local-first répliqué, avec PostgreSQL canonique, sans créer un backend concurrent de Conversation Orchestrator.

Il ne crée ni base Neon, ni migration SQL, ni IndexedDB v4, ni route réseau réelle.

## 2. Architecture logique

```text
Client DeveloperOS
  UI
   │
   ▼
Repositories locaux
   ├─ entities IndexedDB
   ├─ sync-outbox
   ├─ sync-state
   └─ sync-conflicts
          │
          ▼
       SyncEngine
          │ HTTPS
          ▼
DeveloperOS Backend unique
   ├─ HTTP / auth / sécurité
   ├─ /v1/sync
   ├─ /v1/projects
   ├─ /v1/conversations
   ├─ /v1/runs
   ├─ Conversation Orchestrator
   ├─ audit / diagnostics
   └─ repositories PostgreSQL
          │
          ▼
PostgreSQL canonique
   ├─ entities métier
   ├─ mutation ledger
   ├─ change log
   ├─ conflicts
   ├─ auth/session selon topologie
   └─ audit metadata
```

GitHub conserve code, ADR, schémas et documentation. Les données runtime réelles ne sont jamais écrites dans GitHub.

## 3. Identités et métadonnées

### 3.1 Entité synchronisable

Toute entité synchronisable possède conceptuellement :

```text
id                   stable global ID
workspace_id         workspace propriétaire
owner_id             principal propriétaire
revision             entier serveur monotone par entité
created_at_server    timestamp serveur
updated_at_server    timestamp serveur
deleted_at_server    nullable ; tombstone lorsqu’il est renseigné
```

Les champs métier restent typés par module et ne sont pas remplacés par un blob générique lorsque des colonnes explicites sont préférables.

### 3.2 Client et runtime

```text
client_id            installation/logical client stable
runtime_id           contexte d’exécution optionnel et plus éphémère
```

Le concept est `client_id`, pas `device_id` : Safari et une PWA installée peuvent être deux clients logiques sur le même iPhone.

### 3.3 Mutation

```text
mutation_id          ID global unique et idempotent
client_id
runtime_id?          optionnel
entity_type
entity_id
base_revision
operation            create | update | delete
payload_or_patch
client_observed_at?  diagnostic uniquement
```

`client_observed_at` n’est jamais l’arbitre de causalité.

## 4. Révision et causalité

Le serveur attribue les révisions.

Pour une mutation :

1. le client fournit `base_revision` ;
2. le serveur lit la révision canonique ;
3. si elle correspond, la mutation peut être appliquée selon la policy métier ;
4. si elle diffère, le serveur examine les changements intermédiaires ;
5. il fusionne uniquement si une règle déterministe prouve l’absence de conflit ;
6. sinon il crée un conflit explicite.

`updated_at` ne remplace jamais `revision`.

## 5. Outbox locale

Une modification locale synchronisable doit être atomique :

```text
IndexedDB transaction
  write entity local state
  append sync-outbox mutation
commit
```

Une entrée d’outbox contient au minimum :

```text
mutation_id
entity_type
entity_id
base_revision
operation
payload_or_patch
created_at_local
attempt_count
next_retry_at
state
last_error_code?
```

La mutation locale et l’entrée d’outbox ne doivent jamais être écrites dans deux transactions indépendantes.

## 6. Idempotence et crash recovery

Le backend maintient un `mutation_ledger`.

Si le même `mutation_id` est reçu plusieurs fois, le serveur retourne le résultat enregistré au premier commit au lieu de rejouer l’effet métier.

Le protocole doit rester correct dans tous les cas suivants :

- crash avant envoi ;
- crash pendant envoi ;
- commit serveur réussi mais réponse perdue ;
- retry après redémarrage ;
- crash pendant application du pull ;
- retour réseau après une longue période offline.

## 7. Change log et cursor

Chaque changement canonique produit un événement de change log avec séquence monotone :

```text
change_seq
entity_type
entity_id
revision
operation
changed_fields
committed_at_server
```

Le cursor client représente la dernière séquence entièrement appliquée.

Le pull incrémental est fondé sur ce cursor, jamais sur une requête « updated after timestamp ».

## 8. API V1 conceptuelle

Namespace canonique : `/v1`.

### Sync

```text
POST /v1/sync/bootstrap
POST /v1/sync/push
GET  /v1/sync/pull?cursor=<cursor>&limit=<n>
GET  /v1/sync/status
```

### Domaines futurs

```text
/v1/projects/*
/v1/conversations/*
/v1/runs/*
/v1/openai/*
/v1/export/*
```

### Technique

```text
GET /healthz
```

Le bootstrap renvoie un snapshot canonique cohérent et un cursor associé. Le client ne combine pas arbitrairement un snapshot et un cursor issus de transactions différentes.

## 9. Conflits

### A — fusion sûre de champs disjoints

Exemple :

```text
rev 7 -> serveur modifie priority
rev 7 -> client modifie description
```

Si le journal prouve que les ensembles de champs sont disjoints et que la policy métier l’autorise, le serveur peut fusionner et créer une nouvelle révision.

### B — règle métier déterministe

Exemples possibles :

- collection append-only : union déterministe ;
- historique : append seulement ;
- champ calculé : recalcul serveur ;
- attempts Conversation Orchestrator : immuables ;
- tombstone : policy delete/update explicitement définie.

### C — vrai conflit

Si deux clients modifient le même champ depuis une base commune, le serveur ne choisit pas silencieusement.

Un conflit conserve au minimum :

```text
conflict_id
entity_type
entity_id
base_revision
canonical_current
incoming
changed_fields
source_client_id
created_at_server
status
```

Résolutions possibles :

- conserver canonique ;
- conserver incoming ;
- fusion manuelle explicite.

Toute résolution crée une nouvelle révision canonique et un nouvel événement de change log.

## 10. Suppressions et tombstones

La suppression synchronisée :

1. marque `deleted_at_server` ;
2. incrémente `revision` ;
3. publie un événement de change log ;
4. reste répliquée aux clients ;
5. n’est purgée physiquement qu’après rétention.

Un ancien client offline ne peut pas ressusciter silencieusement un objet supprimé.

Une procédure séparée « effacement définitif des données » peut purger plus tôt sous règles explicites.

## 11. Transaction serveur d’une mutation

La séquence logique suivante appartient à une même transaction PostgreSQL :

1. authentifier et autoriser ;
2. valider le contrat ;
3. rechercher `mutation_id` ;
4. lire/verrouiller l’entité canonique ;
5. comparer `base_revision` ;
6. résoudre automatiquement ou créer un conflit ;
7. appliquer la mutation ;
8. incrémenter `revision` ;
9. ajouter `change_log` ;
10. ajouter `mutation_ledger` ;
11. commit.

Toute transaction sérialisable susceptible d’échouer pour conflit doit avoir une politique de retry explicite côté backend.

## 12. IndexedDB v4 futur

DATA-HUB-00 ne modifie pas IndexedDB. Le futur schéma v4 doit préserver les stores v3 :

- `projects`
- `codexConversations`
- `conversation-runs`

et ajouter au minimum :

- `sync-outbox`
- `sync-state`
- `sync-conflicts`

`local-metadata` reste optionnel si nécessaire.

La migration v3 → v4 est non destructive et couverte par tests from-v3.

## 13. Migration split-brain

### Phase 1 — snapshots immuables

Chaque silo local exporte :

```text
source_instance_id
source_kind
exported_at
db_version
stores
hash
```

Aucune base n’est modifiée.

### Phase 2 — staging serveur

Les snapshots sont importés dans des tables/structures de staging, jamais directement dans les tables canoniques.

La provenance est conservée pour chaque objet.

### Phase 3 — inventaire

Chaque objet est classé :

1. ID unique ;
2. même ID + contenu identique ;
3. même ID + divergence ;
4. IDs différents + candidat doublon ;
5. objet invalide/quarantaine.

### Phase 4 — convergence

- doublons exacts : fusion automatique ;
- changements démontrablement disjoints : fusion automatique selon policy ;
- ambiguïtés métier : résolution explicite ;
- aucun objet n’est perdu parce que son timestamp est plus ancien.

### Phase 5 — promotion

La promotion de staging vers les tables canoniques est atomique ou reprise de manière idempotente.

Un rapport de migration conserve les comptes : analysés, identiques, fusionnés, conflictuels, invalides, perdus. Le critère d’acceptation est `perdus = 0`.

### Phase 6 — réhydratation

Chaque client :

1. conserve son snapshot source ;
2. initialise sa représentation synchronisée depuis le canon ;
3. applique le cursor bootstrap ;
4. vérifie les comptes/hashes pertinents ;
5. active la sync normale.

Les anciens silos ne cessent d’être des sources indépendantes qu’après cette preuve.

## 14. Auth et sécurité

DATA-HUB-00 fige les invariants, pas le mécanisme final :

- `owner_id` / `workspace_id` présents dès V1 ;
- toutes les routes privées authentifiées ;
- TLS ;
- CORS allowlist exacte ;
- aucune wildcard credentialed ;
- Origin/CSRF appliqués selon transport choisi ;
- sessions/tokens expirables et révocables ;
- secrets absents des URLs et logs ;
- logs sans payload métier sensible par défaut ;
- clé OpenAI et `DATABASE_URL` serveur-only ;
- RLS PostgreSQL possible comme défense en profondeur, jamais comme justification d’un accès PWA direct à la DB.

Le mécanisme cookie HttpOnly vs token court est décidé lorsque la topologie frontend/backend est figée et testée sur Safari iPhone.

## 15. Backups et restauration

Le fournisseur PostgreSQL ne constitue pas l’unique backup.

Cible de défense en profondeur :

1. restauration/historique du fournisseur PostgreSQL ;
2. export logique périodique hors fournisseur ;
3. export utilisateur manuel versionné.

Un stockage privé type R2 peut servir plus tard au backup logique chiffré.

## 16. Audit technique

Les logs/audits techniques peuvent conserver :

```text
timestamp
request_id
actor_id
workspace_id
client_id
operation
entity_type
entity_id
result
```

Ils ne recopient pas par défaut prompts, réponses OpenAI, credentials, cookies, tokens CSRF ou `DATABASE_URL`.

## 17. QA future

### Déterministe

- outbox state machine ;
- idempotence ;
- revision compare-and-set ;
- cursor ;
- tombstones ;
- conflict policies ;
- backoff/retry.

### Repositories

- IndexedDB v3→v4 ;
- PostgreSQL from-empty ;
- migrations N→N+1 ;
- change log ;
- mutation ledger.

### Multi-client

- A offline, B modifie, A revient ;
- mutations concurrentes ;
- duplicate retry ;
- delete/update ;
- stale revision ;
- crash après commit serveur avant réponse.

### Migration

- deux snapshots divergents ;
- collisions d’ID ;
- doublons exacts ;
- candidat doublon sémantique ;
- donnée invalide ;
- interruption/reprise.

### Sécurité

- auth ;
- ownership / IDOR ;
- CORS / Origin / CSRF ;
- injection ;
- rate limits ;
- redaction secrets/logs.

### E2E / iPhone réel

- Safari et PWA ;
- offline → online ;
- kill/relaunch ;
- réauth ;
- bootstrap après destruction d’IndexedDB ;
- import de snapshots de migration.

## 18. Découpage d’implémentation

### DATA-HUB-01 — canon PostgreSQL minimal

Migrations, tables de base, repositories PostgreSQL, mutation ledger, change log et tests avec clients fictifs. Pas de sync PWA réelle.

### DATA-HUB-02 — réplication locale

IndexedDB v4, outbox, sync state, RemoteDataSource, push/pull et reprise offline.

### DATA-HUB-03 — convergence des silos

Snapshots, staging, inventaire, conflits, promotion, réhydratation et rollback.

### DATA-HUB-04 — exploitation

Backups externes, restauration documentée, audit, métriques, rétention, export/suppression et alerting minimal.

## 19. Contrat de livraison Stable

Le code canonique reste GitHub `main` et la PWA canonique reste GitHub Pages.

Pendant la construction vNext, un runtime Replit `DeveloperOS Validation` peut servir de **Stable de validation** :

- il ne développe pas le code ;
- aucun Agent Replit n’est nécessaire ;
- il ne devient jamais source de vérité ;
- une évolution n’y est promue qu’après PR relue, CI verte et fusion dans `main` ;
- si une étape est en chantier, Replit continue de servir la dernière version stable ;
- les fonctionnalités incomplètes peuvent rester derrière feature flag jusqu’au gate du vertical slice.

Cette règle garantit une application utilisable pendant les développements parallèles.
