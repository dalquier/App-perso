# Équilibre — Roadmap

## Vague 0 — Fondation canonique

Objectif : unifier le projet, formaliser les décisions de base et préparer le travail parallèle.

Sortie : manifeste, ADR, contrat de parallélisation et registre mis à jour.

## Jalon A — Conception parallèle initiale

Cinq axes ont servi à figer la première architecture : produit/UX, mémoire/données, moteur TCC, architecture PWA/Replit/Pyto, qualité/sécurité/validation.

## Jalon B — Revue de convergence initiale

La convergence initiale a figé le parcours MVP, le modèle de données, l’architecture technique et les critères permettant d’engager BUILD-01.

## Jalon C — BUILD-01, socle PWA

Statut : **intégré**.

Le dossier applicatif canonique, le shell PWA, la persistance locale contrôlée, la séance guidée, les réglages et le garde-fou sensible sont présents dans `apps/equilibre/`.

## Jalon D — BUILD-02, conversation écrite

Statut : **intégré et validé**.

Le chat persistant, le streaming local, la reprise, les modes conversationnels, la migration versionnée, la confidentialité, l’interruption et l’isolation des générations ont été validés. Référence d’intégration historique : PR #29, commit `b115989fadd0f3e9f6b503c1b933df4d2b179827`.

## Jalon E — BUILD-03, séances et mémoire contrôlée

Statut : **intégré** par la PR #53.

Séances structurées, résumés, plans d'action et mémoire locale proposée/confirmée/corrigeable/supprimable sont présents dans `main`.

## Jalon F — V4 / BUILD-04, protocoles versionnés, stockage v4 et sécurité

Statut : **intégré dans `main`**.

BUILD-04 apporte :

- exactement deux protocoles actifs versionnés ;
- navigation principale à cinq destinations avec `Protocoles` ;
- stockage v4, migrations, révisions et garanties anti-résurrection ;
- gates de sécurité avant mutation ;
- mémoire durable uniquement explicite ;
- cache PWA `equilibre-shell-v6` ;
- lancement Replit versionné via `./start-equilibre.sh` ;
- build Vite de production et serveur statique Node dédié ;
- direct-run smoke CI et HTTP 200 ;
- polish UX compact.

### Baseline QA V4

`V4-QA-AUTO-01` :

- 181/181 tests automatisés PASS ;
- build production PASS ;
- direct-run PASS ;
- HTTP 200 PASS ;
- protocoles, stockage, mémoire, safety, conversations et confidentialité PASS ;
- aucun défaut produit MAJOR reproduit.

La preuve navigateur réelle est partielle en raison de l’indisponibilité de Chromium dans le sandbox Codex. Le reliquat physique est limité à PWA/standalone, clavier/safe areas, offline réel/service worker, reprise physique/anti-résurrection et VoiceOver minimal, à rattacher au SHA exécuté selon `docs/REPLIT_RUNTIME_CONTRACT.md`.

## Jalon G — CONVERGENCE-05, architecture conversationnelle

Référence : `ProjectOS/projects/Equilibre/docs/CONVERSATION_AI_CONVERGENCE.md`.

ADR : `ProjectOS/projects/Equilibre/ADR/ADR-006-conversational-ai-governance.md`.

Statut : **convergence définie ; aucun BUILD-05 commencé**.

Les analyses suivantes ont convergé :

- `CLINICAL-ROLE-01` ;
- `AI-BACKEND-01` ;
- `MEMORY-CONTEXT-01` ;
- `AI-EVAL-01` ;
- `SESSION-30-01` ;
- `VOICE-ARCH-01` ;
- `V4-QA-AUTO-01`.

### Invariants figés

- Équilibre reste propriétaire de l’état métier ;
- backend same-origin = passerelle d’inférence, pas base de conversations ;
- contexte en deux étages : minimisation locale puis assemblage autoritaire serveur ;
- `ClinicalRolePolicy` versionnée et indépendante du modèle ;
- safety multicouche et indépendante du provider ;
- LLM sans pouvoir métier direct ;
- mémoire durable explicitement contrôlée et sélectionnée localement ;
- pas d’embeddings dans le premier cycle ;
- Responses API avec `store:false`, `background:false`, `maxRetries:0` pour le premier provider réel ;
- texte accepté canonique ; audio = transport ;
- séances longues avec moteur spécialisé ;
- evals provider-agnostic appartenant à Équilibre ;
- modèle choisi par gate comportemental et coût.

### Gate de passage

Aucun nouvel incrément ne peut contourner ces invariants. Toute PR applique les Resource Locks et le Freshness/Merge Gate global ProjectOS.

## Jalon G1 — BUILD-05A, Governance & Contracts

**Prochain Build recommandé.**

Objectif : figer les contrats avant toute dépendance OpenAI réelle.

Inclure :

- `ClinicalRolePolicy 1.0` ;
- premières interfaces `DomainPolicy` ;
- `UserTurn`/`Turn` modality-ready ;
- `ContextPackage` ;
- contrat `ClientContextSelector` / `ServerContextAssembler` ;
- contrat mémoire confirmation/cycle de vie ;
- contrat safety des futurs appels distants ;
- décisions de stockage nécessaires à BUILD-05C et SESSION-30.

Pas d’appel OpenAI réel.

## Jalon G2 — BUILD-05B, Secure Backend Boundary

Inclure :

- serveur statique + `/api` same-origin ;
- health ;
- auth mono-utilisateur ;
- session HttpOnly/Secure/SameSite ;
- Origin/CSRF ;
- JSON borné ;
- rate limiting ;
- erreurs structurées ;
- logs metadata-only ;
- secrets runtime ;
- tests serveur.

Pas d’OpenAI réel.

## Jalon G3 — BUILD-05C, Deterministic Memory Context

Inclure :

- modèle mémoire enrichi et migration décidée ;
- lecture locale contrôlée ;
- sélection structurée + lexicale ;
- score déterministe ;
- fraîcheur, conflits, déduplication ;
- mémoire globale ON/OFF ;
- conversation sans mémoire ;
- explicabilité/reconfirmation ;
- tests de non-fuite, non-hallucination et non-résurrection.

Embeddings/vector DB/cloud memory : hors périmètre.

## Jalon G4 — BUILD-05D, OpenAI Provider & Streaming

Inclure :

- SDK OpenAI serveur ;
- Responses API ;
- `store:false` ;
- `background:false` ;
- `maxRetries:0` ;
- modèle configurable ;
- `ServerContextAssembler` ;
- `RemoteConversationProvider` ;
- streaming ;
- AbortSignal bout en bout ;
- erreurs/timeouts ;
- fallback local explicite ;
- tests mock et intégration.

Pas de tool calling métier.

## Jalon G5 — BUILD-05E, AI Eval Harness & Model Gate

Inclure :

- corpus fictif canonique ;
- rubriques et blockers ;
- runners déterministes/mock/API ;
- red-team critique ;
- baseline/champion ;
- calibration du juge éventuel ;
- holdout ;
- sélection du modèle le moins coûteux satisfaisant les gates.

CI ordinaire : zéro appel OpenAI. Les campagnes payantes restent ciblées et explicitement déclenchées.

## Jalon H — SESSION-30, séances conversationnelles d’environ 30 minutes

Référence normative : `ProjectOS/projects/Equilibre/docs/SESSION_30_REFERENCE.md`.

Verdict analytique : `READY FOR 30-MIN SESSION CONVERGENCE`.

### Décisions de base

- nouvelle famille `long-conversational` ;
- cible d’environ 30 minutes de temps actif ;
- sept phases communes : cadrage, objectif, exploration, travail central, mise en perspective, action éventuelle, synthèse ;
- modes `structured` puis `semi-structured` ;
- `ShortProtocolEngine` BUILD-04 préservé ;
- nouveau `LongSessionEngine` spécialisé ;
- même famille conceptuelle `ProtocolRun` ;
- séance longue distincte d’une Conversation libre ;
- pause persistante, reprise exacte et fin anticipée ;
- action facultative ;
- mémoire jamais automatique ;
- safety transverse ;
- architecture modality-ready.

### Premier protocole

`S30-02 — Résoudre un problème concret`, d’abord entièrement structuré, local et déterministe.

### Séquence

1. contrats `LongSessionDefinition` / `LongSessionRun` ;
2. moteur structuré déterministe ;
3. persistance et UX iPhone après décision stockage ;
4. sessionRecord/action/mémoire ;
5. dialogue semi-structuré **uniquement après BUILD-05E** ;
6. bibliothèque faible/moyen risque ;
7. travail/RPS puis prévention de rechute après revues safety/eval dédiées.

### Gates

Avant persistance longue, trancher explicitement :

- extension contrôlée du stockage actuel versus storage-v5/IndexedDB ;
- migration/rollback/anti-résurrection ;
- extension safety long-session.

## Jalon I — Voix progressive

La voix ne bloque pas la finalisation écrite.

Règle : **Audio is transport. Text is state.**

Ordre :

1. **dictée canonique** — capture → STT → texte éditable → envoi explicite ;
2. **TTS** — lecture optionnelle d’une réponse textuelle canonique ;
3. **conversation tour par tour** ;
4. **realtime** après Voice Gate spécifique.

Le premier Build vocal exclut speech-to-speech direct, audio durable, VAD métier et logique conversationnelle parallèle.

## Parallélisation future

Après BUILD-05A intégré et contrats figés, BUILD-05B et BUILD-05C peuvent être candidats à une parallélisation seulement si le contrôle des fichiers et des ressources logiques confirme leur indépendance.

Les fusions vers `main` restent toujours séquentielles et repassent par le Freshness Gate global après chaque intégration.

## Règle de passage

Chaque jalon nécessite :

- critères d’acceptation vérifiés ;
- risques documentés ;
- Resource Locks explicites ;
- livraison par Pull Request ;
- CI sur le SHA exact ;
- QA physique seulement lorsqu’elle apporte une preuve non automatisable ;
- autorisation explicite avant fusion.

Les futurs Builds ne doivent pas mélanger implicitement rôle, provider, mémoire, safety, stockage, moteur de séance et voix dans un incrément monolithique.
