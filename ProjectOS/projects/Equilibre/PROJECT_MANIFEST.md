# Équilibre — Project Manifest

## Identité

- ID stable : `equilibre`
- Nom produit : Équilibre
- Alias historiques : TCC Budy, TCC Buddy, TCC_Budy, compagnon TCC
- Statut : BUILD-01, BUILD-02, BUILD-03 et BUILD-04 intégrés dans `main` ; convergence conversationnelle définie ; aucun BUILD-05 commencé
- Propriétaire : Damien

## Vision

Équilibre est un compagnon personnel d’auto-accompagnement assisté par IA, structuré par des méthodes psychologiques de faible risque issues notamment des TCC. Il soutient les situations quotidiennes, les échanges rapides et les séances approfondies, avec une posture chaleureuse, précise et parfois ferme, sans se présenter comme un thérapeute humain ou numérique, diagnostiquer ou remplacer un professionnel de santé.

## Principes structurants

- personal-first, anonymisable et généralisable ensuite ;
- séparation stricte entre produit, protocoles et données personnelles ;
- aucune donnée personnelle réelle dans GitHub, les tests ou les journaux ;
- local-first : l’application reste propriétaire de l’état conversationnel et de la mémoire durable ;
- mémoire explicable, corrigeable, désactivable, supprimable et jamais créée directement par le LLM ;
- rôle clinique, safety et transitions métier indépendants du modèle IA ;
- aucune sortie LLM ne produit directement un effet métier ;
- PWA iPhone comme interface cible ;
- Replit Starter comme environnement cloud et de déploiement par défaut, régi par `docs/REPLIT_RUNTIME_CONTRACT.md` ;
- backend Équilibre same-origin comme passerelle d’inférence sécurisée, sans persistance métier utilisateur dans le premier cycle IA ;
- Pyto comme compagnon local iPhone pour fichiers, sauvegardes, exports et utilitaires ;
- OpenAI API uniquement comme composant de l’application, clé permanente uniquement côté serveur ;
- texte accepté comme état conversationnel canonique ; audio comme modalité de transport ;
- sécurité psychologique, autonomie utilisateur et confidentialité intégrées dès la conception ;
- comportement IA prouvé par des evals versionnées appartenant à Équilibre.

## Références canoniques

- Dépôt unique et source de vérité : `dalquier/App-perso`, branche `main`.
- Gouvernance, manifeste, ADR et spécifications : `ProjectOS/projects/Equilibre/`.
- Script maître : `ProjectOS/projects/Equilibre/MASTER_BUILD_PROMPT.md`.
- Convergence conversation IA : `ProjectOS/projects/Equilibre/docs/CONVERSATION_AI_CONVERGENCE.md`.
- Gouvernance conversationnelle : `ProjectOS/projects/Equilibre/ADR/ADR-006-conversational-ai-governance.md`.
- Référence SESSION-30 : `ProjectOS/projects/Equilibre/docs/SESSION_30_REFERENCE.md`.
- Contrat runtime Replit : `ProjectOS/projects/Equilibre/docs/REPLIT_RUNTIME_CONTRACT.md`.
- Code applicatif : `apps/equilibre/`.
- Prototype historique en lecture seule : `dalquier/Scriptable`, dossiers `TCC_Budy` et instantanés horodatés associés.
- Branche de reprise documentaire historique : `equilibre/recovery-master-build-clean`.

## Périmètre produit actuel et prochain cycle

### Socle intégré

- échange rapide écrit ;
- conversations locales persistantes et reprise ;
- mémoire personnelle explicitement proposée/confirmable/corrigeable/supprimable ;
- deux protocoles TCC courts versionnés ;
- stockage v4 avec migrations et protections anti-résurrection ;
- PWA installable sur iPhone ;
- garde-fous pour situations sensibles ;
- runtime Replit reproductible depuis GitHub ;
- mode local dégradé.

### Cycle conversationnel suivant

- `ClinicalRolePolicy` versionnée ;
- backend same-origin sécurisé ;
- contexte mémoire local déterministe et minimal ;
- provider OpenAI réel via Responses API ;
- streaming et interruption bout en bout ;
- harness d’evals comportementales ;
- séances longues structurées puis semi-structurées ;
- voix progressive après stabilité du moteur texte.

## Hors périmètre ou explicitement différé

- diagnostic médical ou psychiatrique ;
- remplacement d’un thérapeute ;
- psychothérapie autonome ;
- décision ou prescription de traitement ;
- multi-utilisateur actif ;
- synchronisation cloud sensible non cadrée ;
- base serveur de conversations/mémoires dans le premier cycle IA ;
- embeddings/vector DB sans preuve de besoin ;
- tool calling donnant des effets métier dans le premier cycle IA ;
- speech-to-speech direct comme moteur conversationnel ;
- voix temps réel avant Voice Gate ;
- application native Swift ;
- intégration à DeveloperOS.

## Architecture de convergence

Référence : `docs/CONVERSATION_AI_CONVERGENCE.md`.

Frontières principales :

1. l’état utilisateur durable reste local ;
2. `ClientContextSelector` minimise conversation, mémoire et état de séance avant réseau ;
3. le backend same-origin traite ce contexte comme non fiable, applique auth/Origin/limites/safety et injecte les politiques autoritaires ;
4. le provider OpenAI génère sans posséder l’état ni les effets métier ;
5. l’application valide et persiste ce qui est autorisé ;
6. les evals mesurent le comportement du système complet.

Toute évolution touchant build, serveur, port, service worker, PWA, racine monorepo ou configuration Replit doit relire `docs/REPLIT_RUNTIME_CONTRACT.md`, exécuter le `REPLIT RUNTIME PREFLIGHT` et conserver le Direct Run Smoke.

Toute PR vers `main` applique `ProjectOS/standards/GITHUB_MERGE_COORDINATION.md` : Resource Locks, Freshness Gate global, CI sur le SHA exact et fusion séquentielle explicitement autorisée.

## État des jalons

- BUILD-01 : intégré, socle PWA et séance historique de compatibilité.
- BUILD-02 : intégré, conversations persistantes locales ; recette iPhone historique validée.
- BUILD-03 : intégré par la PR #53 ; séances structurées et mémoire locale explicitement proposée, confirmable, corrigeable et supprimable.
- BUILD-04 : intégré ; deux protocoles versionnés, stockage v4, gates de sécurité transverses, cache `equilibre-shell-v6`, Run Replit versionné, serveur statique Node dédié, Direct Run Smoke CI et polish UX compact.
- SESSION-30-01 : référence analytique versionnée ; implémentation non commencée.
- CONVERGENCE-05 : architecture conversationnelle consolidée ; implémentation BUILD-05 non commencée.

## Baseline qualité V4

`V4-QA-AUTO-01` a obtenu :

- 181/181 tests automatisés PASS ;
- build production PASS ;
- direct-run canonique PASS ;
- HTTP 200 PASS ;
- protocoles, stockage, mémoire, safety, conversations et confidentialité PASS ;
- aucun défaut produit MAJOR reproduit.

La preuve navigateur réelle est partielle en raison de l’indisponibilité de Chromium dans le sandbox Codex. Les tests physiques résiduels sont limités à PWA/standalone, clavier/safe areas, offline réel/service worker, reprise physique/anti-résurrection et VoiceOver minimal, rattachés au SHA réellement exécuté.

## Prochain jalon

Après intégration explicite de CONVERGENCE-05, préparer puis implémenter **BUILD-05A — Governance & Contracts** avant toute dépendance OpenAI réelle.

BUILD-05A doit figer au minimum :

- `ClinicalRolePolicy 1.0` ;
- contrats `UserTurn`/`Turn` modality-ready ;
- contrats `ClientContextSelector`, `ServerContextAssembler` et `ContextPackage` ;
- séparation confirmation/cycle de vie de la mémoire ;
- règles de safety pour les appels distants ;
- décisions de stockage nécessaires à la mémoire enrichie et aux séances longues.

Les incréments backend, mémoire et evals ne sont parallélisables qu’après ces contrats et après vérification des Resource Locks.

## Definition of Done du cycle de reprise

- audit GitHub et Drive effectué ;
- prototype historique localisé et classé comme source de migration ;
- script maître reconstruit ;
- monorepo et chemin applicatif décidés ;
- BUILD-01 à BUILD-04 intégrés ;
- Runtime Contract Replit versionné ;
- référence SESSION-30 versionnée ;
- convergence conversationnelle versionnée ;
- aucune donnée personnelle réelle ajoutée.

## Risques ouverts

- dépôt `dalquier/App-perso` public : interdiction stricte de versionner données réelles, secrets, historiques ou exports ;
- exigences réglementaires à préciser avant toute diffusion à des tiers ;
- chiffrement et synchronisation sensible restent à cadrer avant stockage distant de données personnelles ;
- recette physique V4 résiduelle à rattacher au SHA exécuté ;
- choix exact du modèle OpenAI à faire par eval, pas par intuition ;
- politique OpenAI de rétention/ZDR à présenter sans promesse non prouvée ;
- modèle temporel/sensibilité/reconfirmation de la mémoire à figer ;
- stratégie storage v4/v5/IndexedDB à trancher avant longs transcripts ;
- safety et evals renforcées requises avant domaines RPS/rechute et avant voix temps réel ;
- migration sélective du prototype Pyto à réaliser seulement lorsqu’elle apporte une fonction encore utile.
