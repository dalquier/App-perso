# DeveloperOS — DATA-HUB-00 — Notes d’intégration

- Statut : candidat de revue
- Contrat maître : `DATA_HUB_CONTRACT.md`
- ADR : `../ADR/ADR-012-DATA-HUB-CANONICAL-POSTGRESQL.md`

## Clauses vivantes qui devront évoluer à l’intégration

Les documents actuels décrivent encore IndexedDB v3 comme persistance principale et CO-BUILD-02 comme backend spécialisé Conversation Orchestrator. Après validation de DATA-HUB-00, les références canoniques DeveloperOS devront être alignées sans ambiguïté :

1. `PROJECT_MANIFEST.md`
   - conserver IndexedDB v3 comme état actuel jusqu’à migration ;
   - déclarer PostgreSQL comme datastore canonique cible ;
   - déclarer IndexedDB comme future réplique locale ;
   - déclarer un backend DeveloperOS unique partagé avec Conversation Orchestrator ;
   - documenter `DeveloperOS Validation` comme runtime Replit Stable non canonique si le workflow de validation Replit est maintenu.

2. `roadmap.md`
   - insérer `DATA-HUB-00` avant toute persistance CO-BUILD-02B ;
   - séquencer `DATA-HUB-01 → DATA-HUB-02 → DATA-HUB-03 → cockpit Aujourd’hui` ;
   - requalifier PR #111 comme matière première HTTP à réconcilier après DATA-HUB-00 ;
   - conserver CO-BUILD-03 bloqué jusqu’au backend commun et au stockage Runs distant.

3. `MASTER_BUILD_PROMPT.md`
   - remplacer la vision « backend CO séparé » par « backend DeveloperOS partagé » ;
   - charger ADR-012 et `DATA_HUB_CONTRACT.md` pour tout travail backend, sync, stockage ou orchestration ;
   - interdire explicitement tout second pool/migrateur PostgreSQL propre à CO.

4. ADR-003 Conversation Orchestrator
   - conserver la décision double canal ;
   - interpréter `repository abstrait ... stockage serveur privé` selon ADR-012 : les adapters serveur utilisent la plateforme Data Hub commune ;
   - aucune réécriture fonctionnelle de CO n’est requise dans DATA-HUB-00.

## Compatibilité API

Le namespace métier canonique DATA-HUB-00 est `/v1`.

Une PR HTTP existante utilisant `/api/v1` n’est pas fusionnée avant décision de compatibilité. Le principe est d’éviter deux conventions publiques concurrentes. Un alias temporaire n’est accepté que s’il est explicitement borné et testé.

## Replit Stable

Le runtime `DeveloperOS Validation` ne remplace ni GitHub Pages ni GitHub `main`.

La promotion Stable suit :

`PR relue → CI verte → fusion main → mise à jour/promotion Replit Stable → smoke test`.

Pendant un chantier parallèle, Replit continue de servir la dernière version Stable connue. Une fonctionnalité incomplète reste derrière feature flag ou n’est pas promue.

## Hors périmètre DATA-HUB-00

- provisionner Neon ;
- choisir définitivement Node vs Workers ;
- choisir ORM/driver/migrateur ;
- créer migrations SQL ;
- modifier IndexedDB ;
- migrer données réelles ;
- modifier PR #111 ;
- implémenter OpenAI réel ;
- implémenter CO-BUILD-03.
