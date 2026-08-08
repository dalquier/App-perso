# Équilibre — SESSION-30-01

## Référence de convergence — séances conversationnelles d’environ 30 minutes

- **Statut** : référence analytique de convergence
- **Verdict source** : `READY FOR 30-MIN SESSION CONVERGENCE`
- **Date de référence** : 2026-08-08
- **Projet** : `equilibre`
- **Dépôt canonique** : `dalquier/App-perso`
- **Application** : `apps/equilibre/`
- **Nature** : spécification de base à préserver jusqu’à remplacement explicite par une décision ProjectOS/ADR plus récente
- **Implémentation** : non commencée par ce document

## 1. Objet

Cette référence fige la base de travail issue de l’analyse `SESSION-30-01` pour la future catégorie de séances conversationnelles longues d’Équilibre.

Une séance longue Équilibre est définie comme **un protocole conversationnel versionné, borné par un objectif et organisé en phases adaptatives, visant environ 30 minutes de temps actif, dont l’utilisateur conserve le contrôle à tout moment**. Elle peut produire une synthèse, une action éventuelle et une proposition de mémoire explicite. Elle ne constitue ni une psychothérapie, ni un diagnostic, ni une prise en charge clinique.

La séance longue ne doit pas être implémentée comme une simple extension des protocoles courts BUILD-04. Le moteur BUILD-04 reste volontairement court, linéaire et déterministe ; les séances longues exigent un moteur spécialisé gérant phases, boucles, temps actif, pause/reprise, clôture anticipée et, plus tard, dialogue semi-structuré contrôlé.

## 2. Invariants à préserver depuis BUILD-04

Les séances longues doivent conserver les garanties existantes :

- `ProtocolRun` versionné ;
- `protocolId`, `protocolVersion` et digest de définition ;
- stockage local versionné ;
- anti-résurrection ;
- garde de sécurité avant mutation ;
- mémoire durable uniquement explicite ;
- `sessionRecord` traçable ;
- historique et reprise ;
- séparation stricte entre définitions publiques de protocoles et données personnelles.

## 3. Frontière produit

### Conversation libre

- durée indéterminée ;
- aucune trajectoire imposée ;
- résultat principal : conversation.

### Protocole court BUILD-04

- objectif : micro-tâche ;
- durée typique : 4 à 7 minutes ;
- étapes linéaires ;
- résultat déterministe.

### Séance longue

- objectif borné ;
- durée cible : environ 30 minutes actives ;
- phases et boucles contrôlées ;
- synthèse, action éventuelle et `sessionRecord`.

### Frontière avec la psychothérapie

Équilibre ne doit jamais :

- diagnostiquer ;
- déterminer un traitement ;
- conduire une exposition traumatique ;
- prescrire une conduite médicale ;
- prendre en charge un sevrage ;
- décider qu’un utilisateur est dépressif, addict, harcelé, apte ou inapte ;
- simuler une relation thérapeutique ;
- promettre une efficacité clinique ;
- se présenter comme disponible à la place d’un professionnel.

La séparation doit être structurelle dans le moteur, la sécurité, les contrats et les usages, pas seulement déclarative dans l’interface.

## 4. Architecture de domaine

### 4.1 Enveloppe commune

Les protocoles courts et longs restent dans la même famille conceptuelle `ProtocolRun`.

```text
ProtocolRun
├── id
├── protocolId
├── protocolVersion
├── definitionDigest
├── runKind
├── status
├── startedAt
├── updatedAt
├── revision
└── payload spécifique
```

`runKind` doit au minimum distinguer :

- `short-guided` ;
- `long-conversational`.

### 4.2 LongSessionRun

Le modèle conceptuel cible contient au minimum :

```text
LongSessionRun
├── runKind = long-conversational
├── interactionMode
│   ├── structured
│   └── semi-structured
├── status
│   ├── draft
│   └── completed
├── activityState
│   ├── active
│   └── paused
├── currentPhaseId
├── phaseProgress[]
├── turns[]
├── anchors{}
├── timing{}
├── originRef?
├── result?
└── sessionRecordId?
```

Le statut principal reste `draft | completed`. La pause est portée par `activityState="paused"` afin qu’une séance en pause reste un draft à reprendre et continue de bloquer le lancement simultané d’un autre protocole guidé.

### 4.3 Transitions de haut niveau

```text
nouvelle
  ↓
draft / active
  ├─ pause ─────────────> draft / paused ──> reprise
  ├─ fermeture app ─────> draft / paused
  ├─ erreur provider ───> draft conservé
  ├─ sécurité ──────────> interruption sans mutation sensible
  ├─ abandon ───────────> suppression du draft
  ├─ fin anticipée ─────> completed / early
  └─ clôture normale ───> completed / normal
```

L’abandon ne crée pas de faux `sessionRecord`. La fin anticipée est une vraie clôture et peut produire un `sessionRecord` avec `completionMode=early`.

## 5. Sept phases communes

Toute séance longue utilise la même grammaire générale, configurable par protocole :

1. **Accueil / cadrage** — sujet, disponibilité, limites, attentes ;
2. **Objectif de séance** — ce qui rendrait la séance utile ;
3. **Exploration** — faits, contexte, pensées, émotions, comportements, contraintes ;
4. **Travail central** — méthode propre au protocole ;
5. **Mise en perspective** — reformulation, enseignements, ce qui change ;
6. **Action éventuelle** — décision ou expérimentation uniquement si pertinente ;
7. **Synthèse / clôture** — résumé vérifiable, correction, suite, mémoire éventuelle.

Cibles indicatives :

- cadrage : 2–3 min ;
- objectif : 3–4 min ;
- exploration : 6–8 min ;
- travail central : 8–10 min ;
- perspective : 3–4 min ;
- action : 2–4 min ;
- clôture : 2–3 min.

L’action peut être absente. `actionPlan: null` est un résultat normal.

## 6. Règles temporelles

Principe : **mesurer sans presser**.

- cible : 30 minutes actives ;
- plage normale : 24–36 minutes ;
- dépassement souple : jusqu’à environ 40 minutes ;
- aucune expiration automatique ;
- aucun compte à rebours anxiogène ;
- le temps en arrière-plan, écran verrouillé ou pause ne compte pas.

Le temps actif est la somme des périodes durant lesquelles la séance est active, au premier plan et non en pause.

Les signaux UX doivent être souples et orientés vers la clôture progressive. L’utilisateur conserve les choix `Approfondir`, `Passer à la suite`, `Mettre de côté ce point`, `Mettre en pause` ou `Finir maintenant`.

Le moteur propose d’avancer lorsque les critères de sortie de phase sont présents, qu’une reformulation est jugée correcte, que l’utilisateur estime le travail suffisant ou que deux boucles successives n’apportent plus d’information structurante. Il ne change pas de phase unilatéralement dans les cas ambigus.

## 7. UX iPhone cible

La séance longue est une conversation guidée, jamais un formulaire massif.

Éléments attendus :

- titre de séance et phase courante ;
- estimation temporelle sous forme de fourchette ;
- une question principale à la fois ;
- réponses longues autorisées ;
- reformulations ponctuelles et corrigibles ;
- menu discret : pause, état d’avancement, finir maintenant, abandonner ;
- clavier iPhone non bloquant ;
- scroll stable ;
- safe areas ;
- Dynamic Type ;
- VoiceOver ;
- aucun état dépendant uniquement de la couleur ;
- aucune gamification de « progression thérapeutique ».

Après fermeture : proposer explicitement la reprise avec le sujet de travail et la dernière activité. Ne jamais reprendre automatiquement au milieu d’une génération.

## 8. Définitions versionnées

Le modèle cible `LongSessionDefinition` contient au minimum :

```text
LongSessionDefinition
├── id
├── version
├── kind = long-conversational
├── title
├── objective
├── estimatedDuration
├── supportedInteractionModes[]
├── useWhen[]
├── doNotUseWhen[]
├── phases[]
├── transitionPolicy
├── timingPolicy
├── summaryContract
├── actionContract
├── memoryContract
├── safetyProfile
└── limits
```

Les définitions restent versionnées, digestées, auditables, sans donnée personnelle et indépendantes du modèle IA.

## 9. Turns et anchors

### Turns

Le dialogue long conserve des objets proches des messages de conversation :

```text
Turn
├── id
├── phaseId
├── role
├── content
├── createdAt
├── status
├── modality
└── provider?
```

Les statuts doivent couvrir au minimum `complete`, `generating`, `partial`, `interrupted`, `error`.

### Anchors

Les éléments structurants ne doivent pas être redéduits du transcript à chaque reprise. Le moteur conserve des `anchors` explicites, par exemple :

- `sessionGoal` ;
- `situationFacts` ;
- `interpretations` ;
- `constraints` ;
- `resources` ;
- `workingHypothesis` ;
- `options` ;
- `selectedAction`.

Un anchor proposé par une IA semi-structurée n’a aucun effet métier avant présentation, correction possible et acceptation utilisateur.

## 10. Relation avec le moteur BUILD-04

Décision de base : **mêmes familles de run, moteurs séparés**.

```text
Protocol Registry
  ├── ShortProtocolDefinition
  │      ↓
  │   ShortProtocolEngine   ← BUILD-04 préservé
  │
  └── LongSessionDefinition
         ↓
      LongSessionEngine
```

Le `ShortProtocolEngine` BUILD-04 ne doit pas être étendu jusqu’à devenir un moteur général de séances longues.

## 11. Relation avec Conversations

Une séance longue n’est pas une conversation libre et ne doit pas dupliquer automatiquement ses tours dans `conversations[].messages[]`.

Une séance peut toutefois être liée explicitement à une conversation par `originRef` et, en fin de séance, à un `SessionRecord` lié à une conversation.

Tout transfert entre Conversation et Séance doit être explicite et traçable. Une synthèse de séance n’est jamais automatiquement injectée dans une conversation.

## 12. Mémoire

Le principe existant est renforcé : aucune mémoire durable implicite.

Séquence cible :

```text
séance terminée
→ candidat mémoire transitoire
→ geste utilisateur explicite
→ MemoryEntry(status = proposed)
→ lecture/correction
→ confirmation explicite
→ MemoryEntry(status = confirmed)
```

Types acceptables potentiels :

- insight ;
- préférence ;
- stratégie utile ;
- engagement/action récurrente ;
- élément contextuel utile.

À proscrire comme mémoire durable : diagnostics supposés, interprétations cliniques, étiquettes de personnalité, prédictions, contenu sensible inutile ou état émotionnel ponctuel transformé en vérité durable.

La provenance doit rester traçable jusqu’au `sessionRecordId` / `sourceSessionId`.

## 13. Sécurité multicouche

Les séances longues exigent un renforcement par rapport aux protocoles courts.

### S0 — admissibilité du protocole

Chaque définition possède ses `doNotUseWhen` et limites propres.

### S1 — entrée utilisateur

Avant persistance, provider, analyse ou résumé : normalisation et garde déterministe. Un contenu bloqué ne contamine pas le run métier.

### S2 — sortie IA

En mode semi-structuré, le provider ne possède aucun pouvoir métier. Les sorties structurantes doivent être schématisées, validées et filtrées avant présentation ou effet.

### S3 — mutation métier

Une barrière distincte précède changement de phase, action, `SessionRecord` et proposition mémoire.

### S4 — interruption sensible

En cas de garde déclenchée :

- aucune mutation avec le contenu bloqué ;
- aucune synthèse automatique de ce contenu ;
- aucune mémoire ;
- aucune action ;
- aucune poursuite du parcours ordinaire sur ce tour ;
- interface de sécurité distincte.

La sécurité reste indépendante du provider et non contournable par le LLM.

## 14. Bibliothèque candidate et priorité

### Priorité 1

1. `S30-02 — Résoudre un problème concret` — première implémentation recommandée ;
2. `S30-01 — Clarifier une situation complexe` ;
3. `S30-03 — Clarifier une ambivalence` ;
4. `S30-04 — Préparer une conversation assertive`.

### Priorité 2

5. `S30-05 — Se remettre en mouvement` ;
6. `S30-06 — Comprendre une situation de travail / RPS` — revue sécurité renforcée requise.

### Priorité 3

7. `S30-07 — Préparer une situation à risque de rechute` — domaine renforcé, non autorisé dans le premier incrément.

Les domaines RPS et rechute ne doivent pas être introduits avant validation du moteur générique, des guards et des evals de sécurité.

## 15. Premier protocole recommandé

Le premier protocole long à implémenter est `S30-02 — Résoudre un problème concret`, en mode **entièrement structuré et local**.

Séquence centrale recommandée :

```text
problème contrôlable ?
→ formulation précise
→ options
→ avantages / inconvénients
→ choix
→ plan éventuel
→ critère de réévaluation
```

Ce premier incrément doit valider le moteur, le temps actif, pause/reprise, clôture et synthèse sans dépendre d’un LLM.

## 16. Stratégie de tests

### Unitaires

- transitions ;
- conditions de sortie ;
- retour arrière ;
- pause/reprise ;
- temps actif ;
- fermeture/reprise ;
- fin anticipée ;
- dépassement ;
- abandon ;
- clôture idempotente ;
- version/digest ;
- `sessionRecord`.

### Temporels

Tester au minimum :

- séance continue ;
- pause longue ;
- fermeture à chaque phase ;
- changement d’app ;
- verrouillage ;
- reprise le lendemain.

Le temps suspendu ne doit jamais augmenter `activeElapsed`.

### Semi-structuré

Prévoir des fixtures longues 30–50 tours : utilisateur bref, prolixe, changeant de sujet, revenant en arrière, refusant une reformulation, ne voulant pas d’action, donnant des informations contradictoires ou demandant de sortir du protocole.

### Sécurité

Prévoir des batteries spécifiques : autodestruction, violence, intoxication, sevrage, médicaments, urgence médicale, risque de rechute, coercition/violence interpersonnelle, harcèlement présumé, décisions juridiques/financières irréversibles et prompt injection.

### Mémoire

Tester : aucune mémoire par défaut, proposition explicite, correction, confirmation, provenance et suppression.

### iPhone réel

Safari et PWA installée, clavier, scroll long, grandes polices, VoiceOver, premier plan/arrière-plan, extinction écran, faible réseau, offline, fermeture forcée, persistance et reprise.

## 17. Risques majeurs

1. **Impression de relation thérapeutique** — réduire par tâches bornées, rôle explicite, objectifs concrets et limites structurelles.
2. **Improvisation psychologique du modèle** — réduire par définitions versionnées, orchestrateur, intents autorisés et validation avant effet métier.
3. **Sur-validation** — distinguer compréhension de l’utilisateur et validation factuelle de son interprétation.
4. **Pression à l’action** — permettre une clôture sans action.
5. **Dérive longue** — utiliser phase, anchors, synthèses intermédiaires et stratégie de retour au focus.
6. **Volume de stockage** — décision explicite `storage-v5` / IndexedDB avant accumulation importante de longs transcripts.
7. **Domaines trop risqués trop tôt** — différer RPS et rechute jusqu’aux guards/evals renforcés.

## 18. Découpage recommandé en incréments

### SESSION-30-A — Contrats

- `LongSessionDefinition` ;
- `LongSessionRun` ;
- phases ;
- timing ;
- modèle de données ;
- relation `ProtocolRun` ;
- sécurité ;
- `sessionRecord`.

### SESSION-30-B — Moteur structuré

- `S30-02 Résoudre un problème concret` ;
- entièrement local ;
- déterministe ;
- pause/reprise ;
- temps actif ;
- fin anticipée ;
- synthèse.

### SESSION-30-C — Persistance et UX iPhone

- décision extension v4 vs stockage v5 ;
- migration/rollback ;
- interface longue ;
- reprise physique ;
- tests background/foreground.

### SESSION-30-D — SessionRecord / action / mémoire

- provenance ;
- résumé final ;
- action optionnelle ;
- proposition mémoire explicite ;
- historique.

### SESSION-30-E — Dialogue semi-structuré

- provider ;
- orchestrateur ;
- intents ;
- génération interruptible ;
- validation des sorties ;
- fallback structuré ;
- tests de dérive longue.

### SESSION-30-F — Bibliothèque faible/moyen risque

Ajouter progressivement clarification complexe, ambivalence, affirmation de soi et activation légère.

### SESSION-30-G — Domaines renforcés

Après revue sécurité dédiée : travail/RPS puis prévention de rechute.

### SESSION-30-H — Voix

Ordre : dictée → TTS → conversation vocale tour par tour → temps réel.

Le texte accepté reste la représentation canonique ; l’audio brut n’est pas conservé par défaut.

## 19. Décisions de convergence à figer

Les décisions suivantes constituent la base normative de travail :

1. nouvelle classe `long-conversational` ;
2. durée cible 30 min, 24–36 normal, ~40 soft maximum ;
3. sept phases communes ;
4. modes `structured` et `semi-structured` ;
5. moteurs séparés short/long ;
6. même famille `ProtocolRun` avec identité/version/digest communs ;
7. une séance en pause reste un draft et bloque un autre protocole guidé ;
8. séance longue distincte de Conversation, sans duplication automatique ;
9. pause persistante avec arrêt du temps actif ;
10. abandon = suppression du draft ;
11. fin anticipée = vraie clôture ;
12. action facultative ;
13. mémoire jamais automatique ;
14. sécurité déterministe et transversale, non contournable par le provider ;
15. premier protocole : `S30-02 Résoudre un problème concret` ;
16. premier mode : entièrement structuré ;
17. semi-structuré dans un incrément séparé ;
18. RPS et rechute différés jusqu’au renforcement sécurité ;
19. architecture prête pour la voix sans dépendance vocale dans le domaine ;
20. décision explicite de stockage avant implémentation des longs transcripts.

## 20. Points de convergence encore ouverts

Quatre points doivent être arbitrés avant le code correspondant :

1. contrat exact `LongSessionDefinition` ;
2. stratégie stockage v5 / IndexedDB ou extension v4 contrôlée ;
3. contrat du provider semi-structuré ;
4. extension du modèle de sécurité pour les séances longues.

Ils ne bloquent pas la convergence analytique mais interdisent d’improviser ces choix pendant l’implémentation.

## 21. Règle d’architecture finale

Une séance longue ne doit jamais être « un chatbot auquel on demande de faire une séance pendant 30 minutes ».

Le moteur de séance possède l’objectif, le temps, les phases, les règles, les données, les limites, la sécurité et les effets métier. Lorsqu’une IA est utilisée, elle reste un moteur de dialogue contraint à l’intérieur de cet espace et ne possède aucun pouvoir direct sur les règles permanentes, la persistance, la mémoire ou les transitions métier.

## 22. Gate de passage à l’implémentation

Aucune implémentation longue ne commence avant :

- convergence avec `CLINICAL-ROLE-01` ;
- convergence avec l’architecture backend/IA réelle ;
- convergence avec mémoire contextuelle ;
- convergence avec les evals de sécurité/comportement ;
- arbitrage du stockage pour les longs transcripts ;
- plan de Build publié et périmètres non concurrents.

Le premier Build doit privilégier le moteur **structuré, local et déterministe** avant toute couche générative.
