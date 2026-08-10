# ADR-012 — Data Hub PostgreSQL canonique et réplication local-first

- Statut : proposé pour validation
- Date : 2026-08-09
- Lot : `DATA-HUB-00`
- Dépôt canonique : `dalquier/App-perso`

## Contexte

DeveloperOS est aujourd’hui une PWA local-first dont les données applicatives sont conservées dans IndexedDB v3 (`projects`, `codexConversations`, `conversation-runs`). Sur iPhone, plusieurs contextes d’exécution peuvent conserver des états locaux divergents. IndexedDB reste indispensable pour l’offline, la latence et la résilience, mais ne peut plus constituer la vérité globale d’un écosystème multi-client.

En parallèle, `CO-BUILD-02` prépare un backend privé pour Conversation Orchestrator. Construire séparément un backend de synchronisation et un backend Conversation Orchestrator créerait deux infrastructures de données concurrentes destinées à être réunifiées ultérieurement.

## Décision

1. **PostgreSQL est le datastore canonique partagé de DeveloperOS.**
2. **Neon est le fournisseur PostgreSQL initial**, mais aucun contrat métier, API, repository ou schéma ne dépend d’une API propriétaire Neon.
3. **IndexedDB reste la persistance locale/offline**, mais devient une réplique opérationnelle du canon distant dès activation de la synchronisation.
4. **DeveloperOS possède un backend commun unique.** Data Hub, Projects, Conversations, Runs et Conversation Orchestrator partagent la même fondation HTTP, auth, données, migrations, audit et observabilité.
5. La PWA ne se connecte jamais directement à PostgreSQL, Neon, Supabase ou tout autre fournisseur de base. Elle parle uniquement à l’API DeveloperOS versionnée.
6. Le namespace réseau canonique des capacités métier est **`/v1/...`**. La liveness technique peut rester hors version métier sous `/healthz`.
7. Le runtime serveur n’est pas figé par cette ADR. **Node est une cible sûre ; Cloudflare Workers + Hyperdrive reste un candidat soumis à un preflight de compatibilité.** Changer de runtime ne doit pas modifier les contrats métier, sync ou PostgreSQL.
8. L’identité globale repose sur des identifiants stables générables indépendamment du fournisseur PostgreSQL. UUIDv7 est autorisé ; aucune fonction PostgreSQL spécifique n’est une exigence de contrat.
9. Toute entité synchronisable possède au minimum un identifiant stable, un propriétaire/workspace, une `revision` attribuée par le serveur, des timestamps serveur et un tombstone de suppression.
10. La synchronisation repose sur :
    - une outbox locale transactionnelle ;
    - un `mutation_id` idempotent ;
    - un `base_revision` fourni par le client ;
    - une `revision` serveur ;
    - un journal de changements à séquence monotone ;
    - un cursor serveur pour le pull incrémental.
11. **Les timestamps clients ne servent jamais à arbitrer la causalité.** Ils peuvent être conservés uniquement pour diagnostic.
12. Un retry du même `mutation_id` ne rejoue pas la mutation ; il retourne le résultat canonique déjà enregistré.
13. Une suppression synchronisée crée d’abord un tombstone. La purge physique intervient après une politique de rétention explicite.
14. Une fusion automatique n’est autorisée que lorsqu’une règle déterministe démontre qu’elle est sûre. Un vrai conflit est matérialisé et résolu explicitement ; aucun écrasement silencieux n’est permis.
15. Les tentatives Conversation Orchestrator déjà créées restent immuables. Une nouvelle exécution produit une nouvelle tentative au lieu d’écraser l’ancienne.
16. La migration des silos IndexedDB existants suit obligatoirement : **snapshot → staging → inventaire → déduplication/conflits → promotion canonique → réhydratation**.
17. Aucun silo local existant n’est supprimé avant preuve de convergence et conservation d’un snapshot récupérable.
18. `user_id` / `owner_id` et `workspace_id` existent dès V1 même si l’usage initial est mono-utilisateur et mono-workspace.
19. Le mécanisme précis d’authentification (cookie HttpOnly same-site ou token court) est décidé avec la topologie réelle des domaines ; l’API reste l’autorité d’accès dans tous les cas.
20. La clé OpenAI, `DATABASE_URL`, les credentials de session et les secrets restent exclusivement côté serveur.
21. GitHub reste la source de vérité du code, des ADR, schémas et contrats. **GitHub n’est pas le datastore runtime.**
22. GitHub Pages reste le déploiement canonique de la PWA. Replit peut fournir un **runtime Stable de validation** aligné sur un SHA `main` validé, sans devenir source de vérité ni outil de développement IA.

## Frontières

### Domaine / application

Les interfaces métier restent indépendantes de l’infrastructure :

- `ProjectRepository`
- `RunRepository`
- `ConversationRepository`
- `ExecutionProvider`

### Client local

- repositories IndexedDB ;
- `SyncEngine` ;
- `LocalSyncStore` ;
- `RemoteDataSource` ;
- outbox ;
- sync state ;
- cache de conflits.

### Backend commun

- HTTP / `/v1` ;
- auth/session ;
- PostgreSQL / migrations ;
- `MutationRepository` ;
- `ChangeLogRepository` ;
- `ConflictRepository` ;
- adapters métier Projects / Conversations / Runs ;
- Conversation Orchestrator / OpenAI ;
- audit et observabilité.

## Conséquences

### Positives

- une vérité durable et partagée ;
- expérience locale immédiate et offline conservée ;
- disparition progressive du split-brain Safari/PWA ;
- backend unique pour Data Hub et Conversation Orchestrator ;
- portabilité PostgreSQL ;
- migration de fournisseur ou runtime sans réécriture du domaine ;
- possibilité future multi-client et multi-utilisateur sans la construire maintenant.

### Coûts / risques

- protocole de synchronisation distribué à tester sérieusement ;
- migration initiale des silos locaux critique ;
- conflits métier à traiter explicitement ;
- besoin d’une stratégie de backup hors du fournisseur PostgreSQL ;
- compatibilité client N-1 nécessaire à cause des caches PWA/service worker.

## Décisions volontairement différées

Ne sont pas figés dans DATA-HUB-00 :

- Workers + Hyperdrive vs Node ;
- driver/ORM PostgreSQL exact ;
- outil de migrations exact ;
- cookie HttpOnly vs token court selon la topologie ;
- polling vs SSE/WebSocket ;
- technologie de queue ;
- fournisseur de notifications ;
- RLS comme défense en profondeur ;
- détails de la future automatisation de fusion.

## Gates d’implémentation

Aucune implémentation PostgreSQL métier, migration, Sync API réelle ou IndexedDB v4 ne commence avant intégration des contrats DATA-HUB-00.

L’ordre de réalisation est :

`DATA-HUB-00 → backend commun → canon PostgreSQL Projects → IndexedDB v4/outbox → push/pull → migration split-brain → cockpit Aujourd’hui`.

Conversation Orchestrator utilise ensuite cette même fondation ; aucun second backend PostgreSQL n’est créé.
