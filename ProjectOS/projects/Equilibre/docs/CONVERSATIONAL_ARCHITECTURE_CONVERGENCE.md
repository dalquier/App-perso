# Équilibre — Architecture conversationnelle consolidée

- Statut : canonique
- Date : 2026-08-09
- Base vérifiée : `dalquier/App-perso@d9b91b9531b77b2c8f04e713465d69beb06f9bac`
- Convergence : `CLINICAL-ROLE-01`, `AI-BACKEND-01`, `MEMORY-CONTEXT-01`, `SESSION-30-01`, `AI-EVAL-01`, `VOICE-ARCH-01`, `V4-QA-AUTO-01`
- ADR associée : `../ADR/ADR-006-CONVERSATIONAL-GOVERNANCE-AND-BOUNDARIES.md`

## 1. Résumé exécutif

Équilibre évolue comme un compagnon conversationnel d'auto-accompagnement inspiré des TCC. Il peut écouter, clarifier, mettre en perspective, travailler une ambivalence et aider à choisir une action, mais il ne devient ni thérapeute, ni dispositif de diagnostic, ni autorité clinique.

L'architecture consolidée conserve l'application comme seule autorité sur l'état, la sécurité, la mémoire, les protocoles et les effets métier. Le modèle génératif reste un fournisseur non souverain : ses entrées sont minimisées, ses sorties sont non fiables jusqu'à validation et il ne persiste rien directement.

La trajectoire retenue commence par un moteur de séance longue structuré, local et déterministe. Le dialogue semi-structuré, le backend OpenAI, les domaines renforcés et la voix arrivent par incréments distincts. La voix enveloppe le même moteur textuel canonique ; elle n'en crée jamais un second.

## 2. État vivant vérifié

À la base `d9b91b9` :

- BUILD-01 à BUILD-04 sont intégrés dans `main` ;
- la PR #122 stabilise le runtime Replit natif après BUILD-04 ;
- l'application canonique est `apps/equilibre/` ;
- le stockage local est en version 4 ;
- cinq destinations principales sont actives ;
- deux protocoles courts versionnés sont actifs ;
- conversations, streaming local, interruption, reprise et isolation sont présents ;
- mémoire proposée, confirmée, corrigée et supprimée explicitement ;
- gates de sécurité avant mutation ;
- service worker `equilibre-shell-v6` ;
- `181/181` tests automatisés et build production verts ;
- lancement racine `./start-equilibre.sh`, HTTP 200 et Preview iPhone vérifiés ;
- aucun fournisseur OpenAI réel, aucun backend conversationnel et aucune séance longue ne sont encore implémentés.

## 3. Tableau des sept rapports

| Rapport | Verdict reçu | Décision retenue |
|---|---|---|
| CLINICAL-ROLE-01 | Ready for clinical role convergence | Politique de rôle versionnée, indépendante du modèle et testable |
| AI-BACKEND-01 | Architecture IA prête pour convergence | Backend same-origin sans persistance utilisateur ; Responses API stateless côté produit |
| MEMORY-CONTEXT-01 | Memory context ready for convergence | Sélection locale déterministe de mémoires confirmées ; aucun embedding initial |
| SESSION-30-01 | Ready for 30-min session convergence | Moteur long spécialisé ; structuré avant semi-structuré |
| AI-EVAL-01 | AI eval plan ready for convergence | Harness local provider-agnostic ; tests déterministes, mock, modèle réel et red-team |
| VOICE-ARCH-01 | Voice architecture ready | Audio transitoire ; texte accepté comme état canonique |
| V4-QA-AUTO-01 | Automated QA fail sur preuve navigateur | Socle automatisé vert ; browser/offline/accessibilité réels restent des gates ciblés |

Le verdict V4 QA est un échec de preuve exhaustive dans l'environnement audité, pas un défaut produit reproduit. Les validations runtime et iPhone ultérieures réduisent le risque opérationnel sans transformer l'absence de browser automation en preuve automatisée.

## 4. Décisions communes

1. Équilibre reste un compagnon d'auto-accompagnement structuré.
2. Le local-first reste structurant.
3. La sécurité déterministe précède provider et mutation.
4. Le modèle ne possède ni rôle, ni séance, ni mémoire, ni effets métier.
5. Toute sortie modèle est non fiable jusqu'à validation.
6. Les messages originaux restent distincts des synthèses, hypothèses et mémoires.
7. Aucune mémoire durable n'est créée sans validation explicite.
8. Les protocoles courts BUILD-04 restent inchangés.
9. Les séances longues utilisent un moteur spécialisé.
10. Le mode structuré précède le mode semi-structuré.
11. Le backend n'est qu'une passerelle d'inférence sécurisée.
12. La voix reste une modalité autour du texte canonique.
13. Les évaluations comportementales appartiennent à Équilibre, pas au fournisseur.
14. Aucune donnée personnelle ou médicale réelle n'entre dans GitHub, les tests, exemples, captures ou logs.

## 5. Contradictions et arbitrages

### Contradictions documentaires

Le `MASTER_BUILD_PROMPT.md` décrivait encore BUILD-04 comme candidate, son cache comme `v5` et plusieurs décisions déjà tranchées comme ouvertes. Le code, le manifeste, la roadmap et les tests démontrent que BUILD-04 est intégré, que le stockage est v4 et que le cache actif est `equilibre-shell-v6`. Cette PR corrige cet état ancien.

Le manifeste et le registre indiquaient encore que le runtime Replit restait à stabiliser. La PR #122 et la recette au SHA `d9b91b9` ferment ce point. La publication publique Replit n'est pas un prérequis au développement.

### Contradictions entre rapports

- AI-BACKEND propose de structurer le backend avant les usages génératifs ; SESSION-30 propose de valider d'abord un moteur local. Arbitrage : `SESSION-30-A/B` peuvent précéder le backend car ils n'utilisent aucun LLM. Le backend est requis avant `SESSION-30-E`.
- MEMORY-CONTEXT propose un Build mémoire enrichi ; SESSION-30 requiert seulement les règles de mémoire existantes pour ses premiers contrats. Arbitrage : aucune évolution mémoire n'entre dans `SESSION-30-A/B`. Le Context Builder mémoire est construit séparément avant l'inférence personnalisée.
- AI-BACKEND réserve les Structured Outputs aux frontières utiles ; SESSION-30 les recommande pour le semi-structuré. Arbitrage : texte libre pour la réponse affichée, schémas stricts pour tout candidat de transition, anchor, mémoire ou effet.
- V4-QA exige une preuve browser réelle indisponible dans son environnement. Arbitrage : conserver l'automatisation déterministe comme gate permanent et réserver à l'iPhone réel les vérifications que l'automatisation ne prouve pas.

### Décisions différées

Le stockage v5/IndexedDB, le modèle OpenAI, les timeouts, ZDR, les embeddings et la voix temps réel peuvent être différés. Ils ne compromettent pas `SESSION-30-A`.

## 6. Architecture fonctionnelle consolidée

Équilibre comporte trois expériences distinctes :

| Expérience | Gouvernance | Résultat |
|---|---|---|
| Conversation libre | Dialogue sans trajectoire imposée | Échange et clarification |
| Protocole court | `ShortProtocolEngine` déterministe | Micro-tâche et `sessionRecord` éventuel |
| Séance longue | `LongSessionEngine` à phases | Synthèse, action facultative et `sessionRecord` |

Une conversation peut proposer explicitement de démarrer une séance. La séance conserve ses propres tours et peut référencer sa conversation d'origine. Aucun message n'est dupliqué automatiquement entre les deux espaces.

## 7. Architecture technique consolidée

```text
UI / UserTurn textuel
  → gate déterministe client
  → orchestrateur conversationnel
  → Context Builder minimal
  → LocalConversationProvider ou RemoteConversationProvider
  → backend same-origin sécurisé
  → provider OpenAI (store:false, background:false)
  → candidat de réponse
  → validation post-génération
  → présentation
  → mutation métier explicite autorisée
```

Le stockage v4 local reste la source de vérité des conversations, protocoles, `sessionRecords` et mémoires. Le backend ne crée aucune base conversationnelle et ne journalise aucun contenu utilisateur.

## 8. Responsabilités et frontières

| Composant | Possède | Ne possède jamais |
|---|---|---|
| UI | saisie, affichage, confirmations | règles cliniques autoritaires |
| Orchestrateur | séquence dialogue, provider, validation | persistance directe non validée |
| ClinicalRolePolicy | identité, posture, limites | données personnelles |
| Safety | décisions déterministes et états sensibles | diagnostic |
| Context Builder | vue temporaire et minimale | store complet brut |
| Memory Repository | mémoire durable validée | inférences LLM |
| Protocol Engines | phases, transitions, effets autorisés | doctrine clinique globale |
| Provider | génération interruptible | transitions, mémoire, session ou sécurité |
| Backend | auth, limites, safety serveur, transport | persistance conversationnelle |
| Stockage local | état canonique utilisateur | règles de gouvernance |
| Voice adapters | capture, STT, TTS, transport | logique métier |

## 9. Contrats et interfaces à figer

Les contrats cibles sont :

- `ClinicalRolePolicy` versionnée ;
- `SafetyDecision` déterministe ;
- `UserTurn { source, text }` avec texte normalisé canonique ;
- `ConversationProvider.generate({ conversation, signal })` ;
- `ContextPackage` borné et traçable ;
- `ValidatedMemoryReader.selectForContext()` en lecture seule ;
- `LongSessionDefinition` et `LongSessionRun` ;
- candidat modèle structuré sans effet direct ;
- événements de stream applicatifs `start`, `delta`, `complete`, `error` ;
- états `partial`, `interrupted`, `error` conservés côté domaine.

`SESSION-30-A` ne fige que les contrats de séance indispensables au moteur local. Les contrats provider et Context Builder restent dans leurs Builds dédiés.

## 10. Modèle de sécurité transversal

La sécurité s'applique en couches :

1. admissibilité du parcours ;
2. gate déterministe de l'entrée avant persistance et réseau ;
3. contrôle serveur avant provider distant ;
4. instructions de rôle et de sécurité données au modèle ;
5. validation de la sortie et des candidats structurés ;
6. gate distinct avant mutation métier ;
7. état UI sensible séparé du dialogue ordinaire.

Un contenu bloqué ne produit ni message persistant, ni titre, ni appel fournisseur, ni anchor, ni résumé, ni `sessionRecord`, ni mémoire. Une safety probabiliste ou la Moderation API peuvent compléter le dispositif, jamais remplacer les règles Équilibre.

## 11. Modèle de contexte et de mémoire

Le contexte transmis au modèle contient uniquement : rôle actif, sécurité utile, protocole ou phase active, petit sous-ensemble de mémoires confirmées et pertinentes, historique conversationnel borné et message courant.

Les mémoires sont filtrées localement. Sont exclues : propositions, entrées refusées, supprimées, obsolètes, expirées, désactivées et non pertinentes. La sélection initiale est structurée et lexicale, déterministe, explicable, limitée normalement à 0–3 mémoires et au maximum à 5.

Une mémoire confirmée reste une information antérieure, pas une vérité éternelle. La parole actuelle prime ; les contenus anciens ou contradictoires demandent reconfirmation. Une synthèse de travail ou de séance ne devient jamais automatiquement une mémoire.

## 12. Stratégie d'évaluation et de QA

La pyramide de preuve est :

1. tests déterministes de contrats, toujours bloquants ;
2. intégration avec provider mocké, toujours bloquante ;
3. évaluations comportementales sur modèle réel lors des changements pertinents ;
4. red-team sécurité avant release ;
5. parcours iPhone ciblés pour la réalité Safari/PWA.

Les dimensions critiques sont sécurité, limites de rôle, autonomie et mémoire. Une violation bloquante n'est jamais compensée par un bon score moyen. Les scénarios, rubriques, baselines et rapports restent provider-agnostic et versionnés dans Équilibre.

Le navigateur réel reste nécessaire pour service worker/offline effectif, géométrie, clavier, focus, VoiceOver, permissions et audio. Il n'est pas nécessaire de rejouer manuellement les invariants déjà couverts par les tests.

## 13. Trajectoire des séances longues

1. `SESSION-30-A` — contrats de domaine ;
2. `SESSION-30-B` — moteur local structuré et `S30-02` ;
3. `SESSION-30-C` — stockage et UX iPhone ;
4. `SESSION-30-D` — `SessionRecord`, action et mémoire ;
5. `SESSION-30-E` — dialogue semi-structuré après backend, rôle et evals ;
6. `SESSION-30-F` — bibliothèque faible/moyen risque ;
7. `SESSION-30-G` — RPS et rechute après revue renforcée ;
8. `SESSION-30-H` — voix.

Les sept phases communes, l'action facultative, la pause, la reprise et la clôture anticipée sont maintenues. Le moteur, pas le LLM, possède l'objectif, le temps, la phase et les transitions.

## 14. Trajectoire vocale

1. dictée : audio → STT → composer éditable → `UserTurn` texte ;
2. lecture : réponse textuelle validée → TTS ;
3. conversation vocale tour par tour ;
4. transport temps réel autour du même moteur.

L'audio brut est transitoire par défaut. Une transcription n'a aucun effet avant validation et gate textuel. Le speech-to-speech direct est différé tant qu'il ne peut pas prouver les mêmes frontières de rôle, sécurité, mémoire et orchestration.

## 15. Dépendances et ordre de construction

`SESSION-30-A/B` dépendent uniquement du socle BUILD-04, de la convergence et des contrats locaux. `SESSION-30-C` exige l'arbitrage stockage. Le backend sécurisé, Clinical Role exécutable, Context Builder et première couche AI-EVAL doivent être disponibles avant `SESSION-30-E`. La voix dépend du moteur textuel stable et possède un gate séparé.

## 16. Plus petit prochain Build sûr

Le prochain Build est `SESSION-30-A — Contrats`.

Périmètre inclus :

- discriminant `runKind` ;
- `LongSessionDefinition` ;
- `LongSessionRun` ;
- phases, timing et états ;
- règles pause/reprise, fin anticipée et abandon ;
- contrats de sécurité et de `sessionRecord` ;
- tests unitaires de transitions, timing, version et digest.

Périmètre exclu : UI, stockage/migration, provider, LLM, mémoire enrichie, dialogue semi-structuré, RPS, rechute et voix.

## 17. Builds suivants sans chevauchement

Chaque Build possède ses ressources : domaine long pour A/B ; stockage et UI pour C ; intégration records/mémoire pour D ; backend/orchestrateur/provider pour E. Une évolution du modèle mémoire ou du backend doit rester dans un Build dédié tant que son contrat n'est pas requis par la séance locale.

## 18. Critères go/no-go

### Go `SESSION-30-A`

- convergence canonique versionnée ;
- BUILD-04 et runtime confirmés ;
- périmètre domaine pur publié ;
- `ShortProtocolEngine` explicitement hors diff ;
- aucune migration ou donnée personnelle ;
- tests unitaires déterministes définis.

### No-go

- modification simultanée du stockage v4 ;
- dépendance à OpenAI ou à une clé ;
- introduction d'une UI longue ;
- fusion avec `SESSION-30-B` ou `C` ;
- réutilisation du moteur court comme moteur général ;
- effet métier décidé par une sortie modèle.

## 19. Risques ouverts

- politique clinique détaillée à transformer en contrat exécutable ;
- extension safety pour conversations longues ;
- décision storage-v5/IndexedDB avant `SESSION-30-C` ;
- budget et compression de contexte avant séances semi-structurées ;
- politique de confidentialité OpenAI standard versus ZDR ;
- modèle et paramètres à sélectionner par evals ;
- taxonomie temporelle et sensible des mémoires ;
- QA browser automatisée à rendre disponible dans un environnement équipé ;
- domaines RPS et rechute à maintenir hors premiers incréments.

Aucun de ces risques ne bloque `SESSION-30-A` dans son périmètre strict.

## 20. Transfert documentaire

Décisions transférées par cette convergence :

- manifeste : état vivant et prochain jalon ;
- roadmap : Jalon G fermé et ordre des Builds ;
- `MASTER_BUILD_PROMPT` : état BUILD-04 et prochaine étape corrigés ;
- ADR-006 : rôle, autorité, sécurité, mémoire, séances longues et modalité canonique ;
- présente référence : contrats, dépendances, gates et risques.

Les valeurs opérationnelles changeantes — modèle OpenAI, prix, timeouts, identifiants audio — restent de la configuration validée au moment du Build, pas des décisions architecturales permanentes.

## Verdict

**READY FOR BUILD PREPARATION**

Le socle est sain, les frontières sont convergentes et aucun arbitrage ouvert ne bloque un Build de contrats local et déterministe. `SESSION-30-A` peut être préparé, mais pas élargi silencieusement au moteur, au stockage, à l'UI ou au LLM.
