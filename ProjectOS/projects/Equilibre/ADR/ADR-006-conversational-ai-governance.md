# ADR-006 — Gouvernance conversationnelle IA

- **Statut** : proposé pour acceptation avec CONVERGENCE-05
- **Date** : 2026-08-08
- **Projet** : Équilibre
- **Décision liée** : `docs/CONVERSATION_AI_CONVERGENCE.md`

## Contexte

Équilibre dispose désormais d'un socle local-first avec conversations persistantes, protocoles versionnés, stockage v4, safety avant mutation, mémoire explicitement contrôlée et runtime PWA/Replit.

Les prochaines capacités introduisent un modèle OpenAI réel, une mémoire contextuelle, des séances conversationnelles longues et, ultérieurement, la voix.

Sans décision transverse, ces évolutions pourraient créer plusieurs sources d'autorité concurrentes :

- état local versus état OpenAI ;
- règles client versus backend ;
- mémoire brute versus contexte transmis ;
- protocole déterministe versus décisions du modèle ;
- texte versus audio ;
- tests logiciels versus comportement probabiliste.

Cette ADR fixe la répartition durable des responsabilités.

## Décision 1 — L'application reste propriétaire de l'état métier

Les conversations, messages, protocolRuns, sessionRecords, mémoires et réglages utilisateur restent sous l'autorité de l'application Équilibre.

Le backend de première génération ne devient pas une base serveur de ces données.

OpenAI n'est pas utilisé comme stockage conversationnel canonique.

Conséquences :

- pas de Conversations API OpenAI comme source de vérité ;
- pas de `previous_response_id` comme mécanisme primaire de continuité ;
- reprise fondée sur l'état Équilibre ;
- export/suppression restent gouvernés par Équilibre.

## Décision 2 — Le backend est une passerelle d'inférence sécurisée

Le backend same-origin intégré au runtime Équilibre :

- authentifie ;
- valide Origin/CSRF ;
- borne les entrées ;
- applique la safety serveur ;
- assemble les règles autoritaires ;
- appelle le provider ;
- streame la réponse ;
- gère abort, timeouts et erreurs ;
- journalise uniquement des métadonnées techniques autorisées.

Il ne persiste pas le contenu utilisateur métier dans la première architecture cible.

## Décision 3 — Le contexte est assemblé en deux étages

### Côté client : `ClientContextSelector`

Il minimise les données avant le réseau :

- historique borné ;
- mémoires confirmées, actives et pertinentes ;
- état protocole/séance minimal ;
- exclusions de confidentialité et de fraîcheur.

### Côté serveur : `ServerContextAssembler`

Il considère le contexte client comme non fiable puis :

- valide les formes et budgets ;
- injecte `ClinicalRolePolicy` autoritaire ;
- injecte les règles safety autoritaires ;
- prépare le contexte final du provider.

Le client ne peut jamais fournir ou remplacer les règles autoritaires.

## Décision 4 — Le rôle clinique est une politique versionnée indépendante du modèle

Équilibre est un compagnon d'auto-accompagnement structuré, pas un thérapeute humain ou numérique.

`ClinicalRolePolicy` est versionnée indépendamment :

- du modèle OpenAI ;
- de l'UI ;
- du stockage ;
- des données personnelles ;
- des protocoles.

Le changement de modèle ne change jamais silencieusement le rôle.

Invariants :

- validation émotionnelle distincte de l'assentiment factuel ;
- autonomie utilisateur ;
- humilité épistémique ;
- fermeté utile autorisée sans humiliation ;
- résistance à la sycophancy et à la réassurance répétitive ;
- aucune dépendance affective encouragée ;
- aucun diagnostic ou décision de traitement.

## Décision 5 — Le modèle n'a aucun pouvoir métier direct

Une sortie de modèle, textuelle ou structurée, reste une proposition non fiable.

Elle ne peut pas directement :

- créer/modifier/supprimer une mémoire ;
- changer une étape ou phase de protocole ;
- créer un sessionRecord ;
- modifier les règles safety ;
- modifier `ClinicalRolePolicy` ;
- déclencher une action externe.

Tout effet passe par une validation applicative explicite.

## Décision 6 — La mémoire durable reste sous contrôle utilisateur et applicatif

Le modèle ne crée jamais directement de mémoire durable.

Le système sépare :

- statut de confirmation : `proposed | confirmed` ;
- cycle de vie : `active | uncertain | obsolete | superseded`.

Les éléments supprimés, refusés, obsolètes ou expirés ne sont pas injectés au modèle.

La sélection est locale, déterministe, bornée et explicable avant tout envoi réseau.

Les embeddings et bases vectorielles sont différés jusqu'à preuve mesurée d'un besoin.

## Décision 7 — La safety reste multicouche et indépendante du provider

La safety comporte au minimum :

1. gates déterministes côté application avant mutation/transmission ;
2. validation serveur avant provider ;
3. limites et consignes fournies au modèle ;
4. validation post-génération pour les sorties structurantes ;
5. gate distinct avant tout effet métier ;
6. UI spécifique pour les interruptions sensibles.

Aucun changement de fournisseur ne peut supprimer ces couches.

## Décision 8 — Responses API stateless du point de vue produit

La première intégration OpenAI utilise :

- Responses API ;
- `store:false` ;
- `background:false` ;
- `maxRetries:0` ;
- modèle configurable côté serveur ;
- streaming abortable ;
- timeouts applicatifs.

Les retries implicites du SDK sont désactivés ; Équilibre possède sa politique de retry.

`store:false` n'est jamais présenté comme une garantie de rétention nulle chez le fournisseur.

## Décision 9 — Le texte accepté est l'état conversationnel canonique

Toute modalité vocale reste une couche de transport autour du moteur textuel.

Règle :

> **Audio is transport. Text is state.**

Conséquences :

- dictée → transcription éditable → envoi explicite → pipeline texte ;
- TTS dérivé d'une réponse textuelle canonique ;
- audio brut non durable par défaut ;
- aucune logique métier propre à un `VoiceConversationProvider` parallèle ;
- speech-to-speech direct différé tant que les gates métier ne sont pas prouvés.

## Décision 10 — Les séances longues possèdent leur moteur

`LongSessionEngine` reste séparé du moteur de protocoles courts BUILD-04.

Le modèle peut dialoguer à l'intérieur d'une séance mais ne possède jamais :

- l'objectif ;
- le temps ;
- les transitions ;
- la persistance ;
- la safety ;
- la mémoire ;
- les effets métier.

Le premier protocole long reste structuré, local et déterministe avant tout dialogue semi-structuré.

## Décision 11 — Les evals comportementales appartiennent à Équilibre

Équilibre possède son corpus, ses rubriques, ses assertions, ses baselines et ses rapports.

Le harness est provider-agnostic.

Un modèle juge éventuel est calibré contre une référence humaine et reste un instrument, pas l'autorité.

Les invariants critiques sont testés déterministement lorsque possible ; les propriétés qualitatives sont évaluées avec modèle réel et red-team.

Aucun fournisseur d'evals externe n'est une dépendance architecturale canonique.

## Décision 12 — Le modèle est choisi par gate comportemental et coût

Aucun modèle n'est fixé définitivement par intuition.

La sélection suit :

```text
candidats
→ evals Équilibre
→ blockers = 0
→ seuils comportementaux
→ latence et coût
→ modèle le moins coûteux satisfaisant les gates
```

## Conséquences positives

- local-first préservé ;
- secret OpenAI hors client ;
- minimisation avant réseau ;
- rôle et safety indépendants du modèle ;
- mémoire contrôlable et non intrusive ;
- protocoles et séances non confondus avec le LLM ;
- voix ajoutable sans second moteur ;
- évaluation reproductible et indépendante du fournisseur ;
- coûts maîtrisables par contexte et gates.

## Coûts et contraintes

- davantage de contrats et tests ;
- duplication volontaire de certains contrôles safety client/serveur ;
- backend nécessaire avant IA réelle ;
- sélection mémoire plus complexe qu'un dump complet ;
- campagnes d'evals réelles payantes mais ciblées ;
- migrations de stockage potentiellement nécessaires pour mémoire enrichie/séances longues ;
- voix temps réel différée.

Ces coûts sont acceptés car ils protègent l'autorité métier, la confidentialité, la sécurité et la capacité de faire évoluer le fournisseur.

## Alternatives rejetées

- clé OpenAI dans le navigateur ;
- état conversationnel principal chez OpenAI ;
- backend persistant les conversations par commodité ;
- Clinical Role uniquement sous forme d'un long prompt non versionné ;
- LLM autorisé à écrire la mémoire ;
- LLM contrôlant les transitions de séances/protocoles ;
- envoi de toute la mémoire au modèle pour qu'il choisisse ;
- embeddings par défaut avant preuve de besoin ;
- tool calling avec effets métier dans le premier cycle ;
- speech-to-speech direct comme architecture vocale initiale ;
- dépendance canonique à une plateforme d'evals fournisseur.

## Points volontairement laissés à des décisions ultérieures

Cette ADR ne fige pas :

- le modèle OpenAI exact ;
- les timeouts numériques ;
- la durée de session d'auth ;
- la taxonomie finale des MemoryType ;
- la stratégie storage-v5/IndexedDB ;
- le modèle STT/TTS ;
- les paramètres realtime ;
- l'éligibilité ZDR.

Ces choix doivent respecter les invariants de la présente ADR et peuvent faire l'objet d'ADR spécialisées lorsqu'ils deviennent structurants.

## Gate d'implémentation

L'ordre initial est :

1. BUILD-05A — Governance & Contracts ;
2. BUILD-05B — Secure Backend Boundary ;
3. BUILD-05C — Deterministic Memory Context ;
4. BUILD-05D — OpenAI Provider & Streaming ;
5. BUILD-05E — AI Eval Harness & Model Gate ;
6. SESSION-30 semi-structuré après les gates correspondants ;
7. voix progressive après stabilité du moteur texte et Voice Gate.

Toute parallélisation future applique les Resource Locks et le Merge Gate global ProjectOS.

## Réversibilité

Cette décision reste réversible par une ADR ultérieure, mais tout remplacement doit démontrer explicitement comment il conserve ou remplace :

- l'autorité sur l'état ;
- le contrôle utilisateur ;
- la minimisation des données ;
- la safety ;
- les transitions métier ;
- l'indépendance fournisseur ;
- l'évaluabilité comportementale.
