# Équilibre — SESSION-30-C-PREP

## Versions stables Replit et préservation des données

- Statut : préparation acceptée, sans implémentation
- Base auditée : `dalquier/App-perso@5140570c7796b4f8a5a32f318666e047087db47c`
- Dépendances intégrées : SESSION-30-A, PR #125 ; SESSION-30-B, PR #129
- Décision associée : ADR-007
- Périmètre : stockage, migrations, promotion stable et découpage UX ; aucun changement applicatif dans ce document

## 1. Résultat attendu

À partir de SESSION-30-C, chaque étape doit laisser trois choses vraies :

1. la version publiée d'Équilibre reste utilisable pendant la construction de la suivante ;
2. la nouvelle version ne remplace la stable qu'après tests et preuve sur son SHA exact ;
3. les données locales déjà créées sont conservées, exportables et vérifiées pendant toute migration.

Le statut de sortie commun est :

> `STABLE IN REPLIT — DATA PRESERVED`

Il ne peut être déclaré que sur une origine publiée stable et après les gates de ce document.

## 2. État vivant vérifié

Le code courant fournit :

- un lancement racine unique `./start-equilibre.sh` ;
- un build Vite puis un serveur Node sur `0.0.0.0` et `$PORT` ;
- un direct-run smoke CI ;
- un stockage `localStorage` v4 sous la clé `equilibre.local.v1` ;
- migrations v1, v2 et v3 vers v4 avec sauvegardes brutes non écrasées ;
- `storageRevision` monotone et rejet des écritures obsolètes ;
- blocage sur corruption ou version inconnue ;
- effacement des données et backups avec protection anti-résurrection ;
- conversations, `protocolRuns`, `sessionRecords` et `memoryEntries` dans un état local unique ;
- un moteur long SESSION-30-B pur, testé, mais non branché au stockage ni à l'UI.

La base est saine. Sa limite est structurelle : un transcript long ferait grossir et réécrire le JSON complet. La v4 reste donc la bonne version stable actuelle, mais pas la cible de stockage des séances longues.

## 3. Deux surfaces Replit distinctes

| Surface | Usage | Données réelles | Stabilité de l'origine |
|---|---|---:|---|
| Preview `.replit.dev` | développement et smoke | non | temporaire ; l'URL peut changer |
| version publiée `.replit.app` ou domaine dédié | usage personnel stable | oui | exigée stable entre les releases |

La Preview native reste nécessaire pour le Runtime Preflight. Elle ne devient pas pour autant l'emplacement durable des données utilisateur. La documentation Replit indique que les URL de développement sont temporaires et que republier met à jour l'application publiée à la même URL.

Une seule app Replit canonique est conservée. Une nouvelle app, un fork ou un changement de domaine n'est pas une mise à jour ordinaire : c'est un changement d'origine nécessitant export depuis l'ancienne URL puis import et vérification dans la nouvelle.

## 4. Contrat storage-v5

### 4.1 Source de vérité

- avant migration : état v4 valide ;
- pendant migration : v4 reste autoritaire ;
- après validation et commit de migration : v5 devient autoritaire ;
- jamais deux writers actifs.

### 4.2 Repository

Le domaine consomme une interface asynchrone, sans connaître IndexedDB :

```text
LocalDataRepository
  open()
  readSnapshot()
  transact(expectedRevision, mutation)
  exportPortable()
  inspectInventory()
  clearConfirmed()
```

Les détails définitifs de signature appartiennent à C1. Les mutations restent atomiques et utilisent une révision attendue pour conserver la protection actuelle contre les writers obsolètes.

### 4.3 Collections

La persistance v5 sépare les objets volumineux et fréquemment modifiés :

| Collection logique | Identité/provenance à préserver |
|---|---|
| metadata/settings | schemaVersion, storageRevision, release writer |
| conversations | id, statut, mode, dates, message order |
| messages | id, conversationId, statut, provenance, contenu original |
| protocolRuns | id, runKind, protocole/version/digest, état, révision |
| longSessionTurns | id, runId, phaseId, rôle, statut, modalité |
| sessionRecords | id, sourceSessionId, références et digest |
| memoryEntries | id, statut, provenance, corrections |

Le repository réhydrate les contrats actuels. Il ne crée pas une seconde représentation métier.

## 5. Migration v4 vers v5

Ordre obligatoire :

1. ouvrir la v4 en lecture et vérifier version, JSON, révision et collections ;
2. produire un inventaire sans contenu dans les logs : nombres, IDs, relations et révision ;
3. conserver le JSON v4 brut comme snapshot local pré-migration sans écraser un snapshot existant ;
4. créer/mettre à niveau IndexedDB dans une transaction de migration ;
5. importer les collections en conservant IDs, dates, provenance, statuts et contenus ;
6. relire la v5 et comparer l'inventaire, les relations et les digests attendus ;
7. seulement après égalité, écrire le checkpoint v5 et le marqueur de compatibilité ;
8. recharger via le repository v5 ;
9. conserver le snapshot v4 jusqu'au checkpoint utilisateur/release prévu ;
10. au moindre échec, annuler la transaction, conserver v4 autoritaire et bloquer toute écriture ambiguë.

La migration est idempotente : une réouverture après succès ne réimporte rien ; une réouverture après interruption reprend depuis l'état vérifiable, sans concaténer ni dupliquer.

## 6. Compatibilité et rollback

Chaque release persistante déclare :

- `releaseId` ou SHA ;
- `storageSchema` écrit ;
- `minReadableSchema` ;
- `maxWritableSchema`.

Avant C1, C0 apprend au writer v4 à détecter le marqueur v5 et à bloquer les écritures. Cela protège contre un ancien onglet ou un service worker encore actif lors du basculement.

| Situation | Comportement |
|---|---|
| C0/v4 avant migration | lecture/écriture v4 normales |
| C1/v5, migration non validée | v4 reste autoritaire |
| C1/v5 validée | writer v5 seul |
| ancien runtime C0 après marqueur v5 | lecture de récupération éventuelle, écriture bloquée |
| défaut après activation v5 | hotfix ou rollback vers un release compatible v5 |
| binaire ancien ignorant v5 | déploiement interdit |

Un rollback de code ne doit jamais être confondu avec un rollback destructif de données.

## 7. Sauvegarde, export et restauration

Deux protections complémentaires sont requises :

### Snapshot local automatique

- créé avant migration ;
- exact et non modifié ;
- non transmis ;
- utilisé seulement par le flux de récupération validé.

### Export portable explicite

- déclenché par l'utilisateur ;
- format versionné avec manifeste, inventaire et empreinte d'intégrité ;
- aucune donnée envoyée au backend ;
- avertissement clair : le fichier contient des données privées et ne doit jamais être ajouté à GitHub ;
- restauration d'abord parsée et validée dans une zone temporaire ;
- aucune fusion implicite ; remplacement seulement après confirmation et transaction réussie.

Le chiffrement et l'intégration Pyto peuvent renforcer ce format dans un Build dédié. Ils ne doivent pas être simulés par une promesse non implémentée.

## 8. Découpage C0–C4

Chaque ligne est une version stable autonome. La suivante ne commence pas avant la fusion, les checks et la validation de la précédente.

| Incrément | Contenu borné | Données | Sortie stable estimée |
|---|---|---|---:|
| **C0 — Sécurité des données** | identité release, inventaire, export/restauration v4, verrou d'écriture futur v5, tests de non-perte | aucune migration | 2–3 jours |
| **C1 — Storage-v5** | repository IndexedDB, migration v4→v5, transaction, checkpoint, compatibilité service worker | conservation prouvée | 3–5 jours |
| **C2 — Long-session persistence** | persistance/reprise S30-02, temps actif, pause, fermeture/foreground, aucun écran final public | nouveaux drafts longs en v5 | 2–4 jours |
| **C3 — UX iPhone structurée** | catalogue/entrée explicite, sept phases, composer, pause/reprise, fin anticipée, synthèse | réutilise C2 | 4–6 jours |
| **C4 — Stable release hardening** | offline, PWA update, quota/erreurs, Dynamic Type, VoiceOver, recette iPhone et promotion | aucune perte au changement de release | 2–4 jours |

Les estimations sont des jours de construction et validation, hors attente de revue humaine ou indisponibilité d'un navigateur/iPhone.

SESSION-30-D reste séparé : `SessionRecord`, historique enrichi, action et proposition mémoire. Le provider IA, le semi-structuré et la voix restent hors de C0–C4.

## 9. Gate de promotion d'une version stable

### GitHub

- PR relue et périmètre borné ;
- SHA candidat exact connu ;
- CI obligatoire verte sur ce SHA ;
- tests de migrations depuis toutes les versions prises en charge ;
- aucun secret ni donnée réelle dans le diff ;
- merge dans `main` seulement après décision explicite.

### Données

- export portable réussi avant une migration de schéma ;
- inventaire avant/après identique pour les objets existants ;
- import/restauration round-trip testé avec fixtures fictives ;
- interruption de migration testée ;
- aucune duplication, résurrection ou relation orpheline ;
- quota/échec de transaction laisse l'ancienne version autoritaire.

### Runtime

- direct-run `./start-equilibre.sh` vert ;
- build production et HTTP 200 ;
- Replit Runtime Preflight `READY` ;
- Preview native utilisée pour la QA technique ;
- version publiée mise à jour à la même origine stable ;
- identité release visible/vérifiable ;
- service worker et cache compatibles avec le nouveau writer.

### iPhone

- ouverture de la version stable existante et vérification des données ;
- mise à jour sur la même URL ;
- réouverture après fermeture forcée ;
- données et draft retrouvés ;
- test foreground/background, offline et grande police selon le lot ;
- en C3/C4, pause/reprise d'une séance fictive sans doublon.

Si un seul contrôle de données échoue, l'ancienne version reste stable et la candidate n'est pas promue.

## 10. Procédure simple de release

1. continuer à utiliser la version publiée courante ;
2. construire la candidate sur branche isolée avec fixtures fictives ;
3. faire passer tests et PR ;
4. fusionner uniquement la candidate validée ;
5. produire l'export de sécurité depuis la version stable si le schéma change ;
6. publier le nouveau SHA `main` sur la même app et la même URL ;
7. vérifier migration, données et recette courte ;
8. déclarer `STABLE IN REPLIT — DATA PRESERVED` ou revenir au release compatible précédent.

Le travail de développement ne demande donc jamais de supprimer l'app stable, de créer plusieurs dossiers Replit ou de manipuler Git dans le Shell Replit.

## 11. Go / no-go de SESSION-30-C

### GO pour C0

- ADR-007 accepté ;
- origine Replit stable choisie pour l'usage réel ;
- version v4 actuelle vérifiée et conservée ;
- format d'export et inventaire précisés dans la spécification C0.

### NO-GO pour C1

- aucun export/restauration v4 vérifié ;
- aucun verrou d'écriture v5 dans C0 ;
- migration non transactionnelle ;
- stratégie fondée sur deux writers permanents.

### NO-GO pour C3

- persistance/reprise C2 non validée ;
- changement d'origine Replit non traité ;
- storage-v5 ou service worker encore instable ;
- UI qui recrée les règles du moteur au lieu de l'appeler.

## 12. Prochaine action

Construire **C0 — Sécurité des données** comme premier incrément applicatif. C0 ne rend pas encore SESSION-30 visible ; il sécurise toutes les montées de version suivantes.

## 13. Références runtime vérifiées

- [Replit — Development URLs](https://docs.replit.com/core-concepts/project-editor/app-setup/development-urls) : les URL `.replit.dev` sont temporaires et réservées au développement ;
- [Replit — Publish your app](https://docs.replit.com/build/publish-your-app) : republier met à jour l'application à la même URL ;
- [Replit — Custom Domains](https://docs.replit.com/features/publishing/custom-domains) : une origine dédiée peut être attachée à une application publiée.
