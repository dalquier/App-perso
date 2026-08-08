# Équilibre — Roadmap initiale

## Vague 0 — Fondation canonique

Objectif : unifier le projet, formaliser les décisions de base et préparer le travail parallèle.

Sortie : manifeste, ADR, contrat de parallélisation et registre mis à jour.

## Jalon A — Conception parallèle

Produire cinq livraisons indépendantes :

1. Produit et UX ;
2. Mémoire et données ;
3. Moteur TCC ;
4. Architecture PWA/Replit/Pyto ;
5. Qualité, sécurité et validation.

Aucun code applicatif n’est autorisé pendant ce jalon.

## Jalon B — Revue de convergence

Comparer les cinq livraisons, résoudre les contradictions, figer :

- parcours MVP ;
- modèle de données ;
- machine d’états conversationnelle ;
- architecture technique ;
- critères go/no-go.

Sortie : spécification consolidée et plan `BUILD-01`.

## Jalon C — BUILD-01, socle PWA

Statut : intégré. Le dossier applicatif canonique, le shell PWA, la persistance locale contrôlée, la séance guidée, les réglages et le garde-fou sensible sont présents dans `apps/equilibre/`.

## Jalon D — BUILD-02, conversation écrite

Statut : intégré et validé. Le chat persistant, le streaming local, la reprise, les modes conversationnels, la migration versionnée, la confidentialité, l’interruption et l’isolation des générations ont été validés par 48 tests automatisés, les workflows GitHub et une recette physique iPhone. Référence d’intégration : PR #29, commit `b115989fadd0f3e9f6b503c1b933df4d2b179827`.

## Jalon E — BUILD-03, séances et mémoire contrôlée

Statut : intégré par la PR #53. Séances structurées, résumés, plans d'action et mémoire locale proposée/confirmée/corrigeable/supprimable sont présents dans `main`.

## Jalon F — V4 / BUILD-04, protocoles versionnés, stockage v4 et sécurité

Statut : **intégré dans `main`**.

BUILD-04 apporte deux protocoles actifs versionnés, une navigation principale à cinq destinations avec `Protocoles`, le stockage v4 et ses migrations/garanties anti-résurrection, des gates de sécurité avant mutation, la mémoire uniquement explicite et le cache PWA `equilibre-shell-v6`.

Le lancement Replit versionné utilise `./start-equilibre.sh`, le build Vite de production et un serveur statique Node dédié. Le direct-run smoke CI vérifie ce chemin et le HTTP 200. La validation runtime/iPhone post-intégration est désormais régie par le contrat canonique `ProjectOS/projects/Equilibre/docs/REPLIT_RUNTIME_CONTRACT.md` et reste à rattacher au SHA effectivement exécuté.

## Jalon G — Convergence Équilibre conversationnelle

Objectif : préparer la version réellement conversationnelle d’Équilibre avant tout nouveau Build substantiel.

Flux analytiques à faire converger :

- `CLINICAL-ROLE-01` — rôle, posture, compétences et limites ;
- `AI-BACKEND-01` — backend sécurisé et fournisseur OpenAI réel ;
- `MEMORY-CONTEXT-01` — utilisation intelligente de la mémoire explicitement validée ;
- `AI-EVAL-01` — évaluations comportementales et sécurité ;
- `SESSION-30-01` — séances conversationnelles longues ;
- `VOICE-ARCH-01` — architecture de modalité vocale future ;
- `V4-QA-AUTO-01` — QA automatisée du socle V4.

Sortie attendue : spécification consolidée des interfaces entre rôle, safety, contexte, mémoire, provider, protocoles courts, séances longues et modalités futures, puis découpage en Builds non concurrents.

Aucune implémentation semi-structurée ou spécialisée à risque ne commence avant cette convergence.

## Jalon H — SESSION-30, séances conversationnelles d’environ 30 minutes

Référence normative de travail : `ProjectOS/projects/Equilibre/docs/SESSION_30_REFERENCE.md`.

Verdict analytique : `READY FOR 30-MIN SESSION CONVERGENCE`.

### Décisions de base

- nouvelle famille `long-conversational` ;
- cible d’environ 30 minutes de temps actif ;
- sept phases communes : cadrage, objectif, exploration, travail central, mise en perspective, action éventuelle, synthèse ;
- deux modes prévus : `structured` puis `semi-structured` ;
- `ShortProtocolEngine` BUILD-04 préservé ;
- nouveau `LongSessionEngine` spécialisé ;
- même famille `ProtocolRun`, avec identité/version/digest communs ;
- séance longue distincte d’une Conversation libre, sans duplication automatique des messages ;
- pause persistante, reprise exacte et fin anticipée ;
- action facultative ;
- mémoire jamais automatique ;
- sécurité déterministe et transversale ;
- architecture modality-ready pour la future voix.

### Premier protocole recommandé

`S30-02 — Résoudre un problème concret`, d’abord en mode entièrement structuré, local et déterministe.

Le premier incrément doit valider le cœur métier sans LLM : phases, temps actif, pause/reprise, fin anticipée, synthèse et `sessionRecord`.

### Découpage SESSION-30

1. **SESSION-30-A — Contrats** : `LongSessionDefinition`, `LongSessionRun`, phases, timing, relation `ProtocolRun`, sécurité, `sessionRecord`.
2. **SESSION-30-B — Moteur structuré** : premier protocole local et déterministe.
3. **SESSION-30-C — Persistance et UX iPhone** : décision stockage, migration/rollback, interface longue, background/foreground.
4. **SESSION-30-D — SessionRecord / action / mémoire** : provenance, résumé, action facultative, proposition mémoire explicite, historique.
5. **SESSION-30-E — Dialogue semi-structuré** : provider, orchestrateur, intents, génération interruptible, validation des sorties et fallback structuré.
6. **SESSION-30-F — Bibliothèque faible/moyen risque** : clarification complexe, ambivalence, affirmation de soi, activation légère.
7. **SESSION-30-G — Domaines renforcés** : travail/RPS puis prévention de rechute après revue sécurité dédiée.
8. **SESSION-30-H — Voix** : dictée, TTS, tour par tour, puis temps réel sans modifier le moteur métier.

### Gates avant implémentation

Avant le code correspondant, trancher explicitement :

- contrat exact `LongSessionDefinition` ;
- extension contrôlée du stockage v4 ou migration storage-v5 / IndexedDB ;
- contrat du provider semi-structuré ;
- extension du modèle de sécurité pour conversations longues.

Le dialogue semi-structuré ne doit pas précéder la validation du moteur structuré local.

Les domaines RPS et prévention de rechute sont différés jusqu’à validation du moteur générique, des guards et des evals de sécurité.

## Jalon I — Voix progressive

La voix reste une capacité ultérieure et ne bloque pas la finalisation écrite.

Ordre cible :

1. dictée vers le même modèle `Turn` texte ;
2. lecture vocale des réponses ;
3. conversation vocale tour par tour ;
4. voix temps réel avec interruption lorsque les critères de sécurité sont satisfaits.

Le texte accepté reste la représentation canonique du dialogue ; l’audio brut n’est pas conservé par défaut.

## Règle de passage

Chaque jalon nécessite des critères d’acceptation vérifiés, des risques documentés et une livraison traçable par Pull Request.

Les futurs Builds ne doivent pas contourner la convergence analytique en mélangeant moteur de séance, fournisseur IA, mémoire, sécurité, stockage et voix dans un unique incrément.
