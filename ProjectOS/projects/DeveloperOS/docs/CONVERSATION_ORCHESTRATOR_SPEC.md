# DeveloperOS — Conversation Orchestrator — SPEC-00

- Statut : spécification fonctionnelle et technique V1 relue
- Date : 2026-08-05
- Dernière relecture : 2026-08-05
- Projet : DeveloperOS
- Décision d’architecture : `ADR/ADR-003-CONVERSATION-ORCHESTRATOR-DUAL-EXECUTION.md`
- Code cible futur : `apps/developer-os/modules/conversation-orchestrator/`, à confirmer contre l’arborescence réelle avant `CO-BUILD-00`

## 1. Objectif

Conversation Orchestrator permet à un script maître de :

1. produire un fichier décrivant plusieurs prompts fils ;
2. préparer ou lancer les missions correspondantes ;
3. exécuter en parallèle les missions indépendantes ;
4. collecter les réponses, automatiquement par API ou manuellement depuis ChatGPT Plus ;
5. transmettre les résultats des missions amont aux missions qui en dépendent ;
6. normaliser les résultats sans altérer les réponses brutes ;
7. fournir l’ensemble au prompt ou script maître pour synthèse, arbitrage et prochaines actions.

Le produit fonctionne principalement sur iPhone et s’intègre à l’interface principale de DeveloperOS.

## 2. Principes directeurs

- Un seul contrat de données pour les deux canaux d’exécution.
- Une mission possède un identifiant technique stable et un titre visible déterministe.
- Les prompts fils sont nommés avec le nom exact du prompt maître suivi d’un numéro généré.
- Le canal ChatGPT Plus reste manuel et assisté ; aucune extraction automatique de ChatGPT.
- Le canal API est automatisé, côté serveur et facturé séparément de ChatGPT.
- Un run devient hybride par combinaison de canaux ; `hybrid` n’est pas un troisième canal.
- Les missions indépendantes peuvent être parallélisées ; les dépendances sont respectées et leur contenu est injecté dans les prompts aval.
- L’ordre, les numéros et les titres sont figés après validation du run.
- Une relance ne duplique ni n’écrase silencieusement une réponse existante.
- Les secrets et données réelles ne sont jamais versionnés dans le dépôt public.
- L’application conserve les originaux et produit des vues normalisées sans altérer la preuve brute.

## 3. Terminologie

| Terme | Définition |
|---|---|
| Script maître | Composant externe ou interne qui crée le fichier d’entrée et consomme le dossier final. |
| Prompt maître final | Instruction de consolidation exécutée après collecte des missions requises. |
| Nom maître | Nom visible servant de racine au nom de tous les prompts fils. |
| Mission / job | Unité de travail indépendante ou dépendante, associée à un prompt fils. |
| Prompt fils | Prompt initial d’une mission, enrichi si nécessaire du contexte de ses dépendances. |
| Run | Ensemble versionné d’un fichier d’entrée, d’un plan canonique, de missions, d’états et de résultats. |
| Canal | `openai_api` ou `chatgpt_plus_manual`. |
| Run hybride | Run utilisant les deux canaux entre ses missions et sa synthèse maître. |
| Réponse brute | Réponse exacte telle que reçue ou collée. |
| Résultat normalisé | Objet structuré commun remis au script maître. |
| Dépendance | Résultat d’une mission requis avant d’en lancer une autre. |
| Tentative | Exécution immuable d’une mission ; une relance crée une tentative supplémentaire. |

## 4. Périmètre V1

### Inclus

- Import d’un fichier `run-request.json`.
- Validation JSON Schema et affichage lisible des erreurs.
- Production d’un `run-plan.json` canonique.
- Génération déterministe des séquences et titres des prompts fils.
- Choix global ou individuel du canal d’exécution.
- Détection automatique d’un run hybride.
- File d’attente et exécution parallèle bornée pour l’API.
- Parcours copier-coller optimisé pour ChatGPT Plus.
- Collage et association automatique ou assistée des réponses déjà fournies par Damien.
- Dépendances simples entre missions sous forme de graphe acyclique.
- Injection déterministe des résultats des dépendances dans les prompts aval.
- Relance ciblée d’une mission.
- Consolidation des résultats et génération du dossier maître.
- Export JSON, JSONL et Markdown.
- Historique local des exécutions manuelles.
- États, erreurs, horodatages et usage API observé lorsqu’il est disponible.

### Hors périmètre V1

- Création automatique de conversations visibles dans l’historique ChatGPT.
- Lecture automatique des réponses depuis l’application ou le site ChatGPT.
- Automatisation DOM, navigateur piloté, scraping ou interception de session.
- Collaboration multi-utilisateur.
- Synchronisation complète avec l’historique ChatGPT.
- Achat automatique de crédits ou modification de la facturation.
- Choix autonome d’un modèle sans profil configuré.
- Boucle agentique illimitée entre maître et prompts fils.
- Réduction hiérarchique automatique des très grands corpus.
- Batch API dans le parcours interactif V1.

## 5. Canaux d’exécution

### 5.1 `chatgpt_plus_manual`

Flux humain assisté :

1. l’application affiche le titre du prompt fils ;
2. Damien copie le titre et le prompt ;
3. l’application ouvre ChatGPT à la demande ;
4. Damien crée une conversation, colle et envoie ;
5. Damien revient dans DeveloperOS ;
6. il colle la réponse ;
7. l’application vérifie l’identité et enregistre une tentative immuable.

Fonctions UX obligatoires :

- `Copier le titre` ;
- `Copier le prompt` ;
- `Copier titre + prompt` ;
- `Ouvrir ChatGPT` ;
- `Marquer comme lancé` ;
- zone de collage de la réponse ;
- détection d’une réponse collée dans la mauvaise mission ;
- confirmation si la balise d’identification manque ;
- conservation de la réponse brute ;
- navigation vers la prochaine mission incomplète.

Ce canal ne consomme pas l’API. L’application ne prétend pas mesurer précisément les limites ChatGPT ni garantir l’accès à un modèle donné.

### 5.2 `openai_api`

Le canal API est exécuté par un backend :

- clé API côté serveur uniquement ;
- contexte indépendant par mission ;
- envoi via l’API Responses ;
- conversation persistante seulement lorsque le profil l’exige ;
- traitement synchrone, streaming ou arrière-plan selon le profil ;
- récupération du résultat et des usages disponibles ;
- reprise après interruption ;
- limitation du nombre d’appels simultanés ;
- annulation et relance contrôlées ;
- conservation privée des identifiants opaques nécessaires au diagnostic.

La liste de modèles n’est pas codée dans les fichiers d’exécution. Le fichier référence un `model_profile` interne, résolu côté serveur vers un modèle autorisé au moment de l’exécution.

### 5.3 Run hybride

Le run est marqué `hybrid` lorsque des canaux différents sont utilisés entre ses missions ou sa synthèse maître. Le canal reste défini individuellement pour chaque unité d’exécution.

Une mission peut changer de canal tant qu’elle n’a pas été lancée. Après lancement, un changement crée une nouvelle tentative et conserve l’ancienne trace.

## 6. Nommage et ordre canonique

### 6.1 Motif fixe V1

```text
{master_prompt_name} — {sequence}
```

Exemples :

```text
DeveloperOS — Architecture globale — 01
DeveloperOS — Architecture globale — 02
DeveloperOS — Architecture globale — 100
```

### 6.2 Règles

- `master_prompt_name` est obligatoire et non vide.
- Seuls les espaces de bord sont retirés ; le nom exact est sinon conservé.
- La séquence est générée à partir de la position 1-based dans le tableau `jobs`.
- Le fichier d’entrée V1 ne contient pas de champ `sequence` éditable.
- Deux chiffres minimum : `01` à `99` ; trois chiffres à partir de `100`.
- Avant validation, réordonner le tableau réordonne les numéros.
- Au passage à `validated`, l’ordre, les séquences et les titres sont figés dans `run-plan.json`.
- Toute modification ultérieure crée une nouvelle révision du run et ne réécrit pas l’historique.
- Une relance conserve le même titre visible et incrémente uniquement `attempt`.
- `job_id` ne dépend jamais du titre visible.

### 6.3 Synthèse maître

Titre recommandé :

```text
{master_prompt_name} — Synthèse maître
```

Ce titre est configurable, mais n’utilise pas un numéro de prompt fils.

## 7. Contrat d’entrée `run-request.json`

### 7.1 Exemple canonique

```json
{
  "schema_version": "1.0",
  "run": {
    "run_id": "RUN-20260805-001",
    "master_prompt_name": "DeveloperOS — Architecture globale",
    "default_execution_channel": "chatgpt_plus_manual",
    "max_api_concurrency": 4,
    "failure_policy": "continue_independent"
  },
  "defaults": {
    "model_profile": "reasoning-balanced",
    "max_output_tokens": 6000,
    "dependency_input_mode": "normalized"
  },
  "master": {
    "execution_channel": "chatgpt_plus_manual",
    "instructions": "Tu es le coordinateur principal.",
    "final_prompt": "Analyse toutes les réponses et produis l’arbitrage final.",
    "required_jobs": ["JOB-001", "JOB-002"]
  },
  "jobs": [
    {
      "job_id": "JOB-001",
      "role": "Responsable UX",
      "execution_channel": "chatgpt_plus_manual",
      "instructions": "Tu es responsable UX iPhone.",
      "prompt": "Produis la spécification UX.",
      "depends_on": [],
      "output_format": "markdown"
    },
    {
      "job_id": "JOB-002",
      "role": "Architecte logiciel",
      "execution_channel": "openai_api",
      "instructions": "Tu es architecte logiciel.",
      "prompt": "Définis l’architecture technique.",
      "depends_on": ["JOB-001"],
      "dependency_input_mode": "normalized",
      "output_format": "markdown"
    }
  ]
}
```

### 7.2 Champs obligatoires

- `schema_version` ;
- `run.run_id` ;
- `run.master_prompt_name` ;
- `run.default_execution_channel` ;
- `master.final_prompt` ;
- `jobs` avec au moins une mission ;
- pour chaque mission : `job_id`, `prompt`, `depends_on`.

### 7.3 Contraintes

- `run_id` est unique dans le stockage actif.
- `job_id` est unique dans le run.
- L’ordre du tableau `jobs` est significatif.
- `sequence`, `conversation_title` et `attempt` sont des champs dérivés, interdits dans l’entrée V1.
- Aucun cycle dans `depends_on`.
- Une dépendance référence une mission existante autre qu’elle-même.
- `max_api_concurrency` est borné par configuration serveur.
- Les tailles de fichier, prompt et contexte injecté sont contrôlées avant envoi.
- Le fichier ne contient aucun secret.
- Les champs inconnus sont refusés en mode strict ; les extensions futures utilisent un objet `extensions` explicite.

## 8. Plan canonique `run-plan.json`

Après validation, l’orchestrateur produit un plan immuable contenant pour chaque mission :

- `job_id` ;
- `sequence` générée ;
- `conversation_title` généré ;
- canal résolu ;
- profil de modèle résolu par nom logique, sans nom de modèle secret ou obsolète dans l’entrée ;
- dépendances validées ;
- politique d’injection des dépendances ;
- empreinte du prompt source ;
- état initial.

Le `run-plan.json` est la référence d’exécution. Le `run-request.json` original reste conservé comme preuve d’entrée.

## 9. Dépendances et prompt effectif

### 9.1 Règle de disponibilité

Une mission dépendante devient prête seulement lorsque toutes les missions de `depends_on` sont `completed`.

Politique V1 unique : `all_success`. Les politiques `all_terminal` et `any_success` sont reportées.

### 9.2 Injection du contexte

Valeurs V1 de `dependency_input_mode` :

- `normalized` : injecter `response_normalized` ;
- `raw` : injecter `response_raw`.

Valeur par défaut : `normalized`.

Le prompt effectif est construit dans cet ordre :

1. enveloppe d’identification ;
2. instructions de la mission ;
3. bloc de dépendances classé par séquence ;
4. prompt propre de la mission ;
5. contraintes de sortie.

Format du bloc :

```text
[DEPENDENCY_CONTEXT]
JOB_ID: JOB-001
TITLE: DeveloperOS — Architecture globale — 01
ATTEMPT: 1
CONTENT:
<résultat injecté>
[/DEPENDENCY_CONTEXT]
```

Attendre une dépendance sans injecter son résultat est une erreur de contrat.

## 10. Enveloppe d’identification

```text
[CONVERSATION_ORCHESTRATOR]
RUN_ID: RUN-20260805-001
JOB_ID: JOB-001
ATTEMPT: 1
CONVERSATION_TITLE: DeveloperOS — Architecture globale — 01
[/CONVERSATION_ORCHESTRATOR]
```

La réponse commence idéalement par :

```text
[RUN-20260805-001][JOB-001][ATTEMPT-1]
```

L’absence de balise ne rend pas une réponse manuelle invalide, mais impose une confirmation humaine. Pour l’API, l’association repose sur les identifiants serveur et non sur la balise textuelle.

## 11. États

### 11.1 États d’un run

- `draft` ;
- `validated` ;
- `ready` ;
- `running` ;
- `waiting_manual_input` ;
- `partially_completed` ;
- `completed` ;
- `failed` ;
- `cancelled` ;
- `archived`.

### 11.2 États d’une mission

- `pending` ;
- `blocked_by_dependency` ;
- `ready` ;
- `prepared_manual` ;
- `launched_manual` ;
- `queued_api` ;
- `running_api` ;
- `waiting_response_import` ;
- `completed` ;
- `failed_retryable` ;
- `failed_terminal` ;
- `cancelled` ;
- `superseded`.

### 11.3 Dérivation de l’état du run

Ordre de priorité :

1. `archived` ou `cancelled` lorsqu’explicitement demandé ;
2. `failed` si la politique impose l’arrêt et qu’un échec terminal existe ;
3. `completed` si toutes les missions requises et la synthèse requise sont terminées ;
4. `running` si une mission API est en cours ou si un lancement reste possible immédiatement ;
5. `waiting_manual_input` si l’unique progression possible dépend d’une action humaine ;
6. `partially_completed` si certaines missions sont terminées mais qu’aucune progression automatique n’est possible ;
7. `ready`, `validated` ou `draft` selon l’étape de préparation.

Les transitions invalides sont refusées et journalisées.

## 12. Parallélisation

### 12.1 Mission prête

Une mission est prête lorsque :

- le plan est validé ;
- elle n’est ni terminée ni annulée ;
- toutes ses dépendances requises sont terminées ;
- son canal est configuré ;
- aucune validation humaine obligatoire ne manque ;
- son prompt effectif peut être construit dans les limites autorisées.

### 12.2 API

- Lancement jusqu’à `max_api_concurrency`.
- File FIFO par défaut, priorité explicite possible dans un Build ultérieur.
- Concurrence réduite après erreurs de limite.
- Relances avec attente progressive et nombre maximal de tentatives.
- Aucun double lancement pour la même clé d’idempotence.

Clé logique :

```text
{run_id}:{job_id}:{attempt}
```

### 12.3 ChatGPT Plus

La parallélisation est assistée : l’application prépare plusieurs prompts et permet à Damien d’ouvrir plusieurs conversations ChatGPT. L’envoi et la récupération restent manuels.

### 12.4 Hybride

Les missions API peuvent tourner pendant que Damien traite les missions ChatGPT Plus. L’état du run suit les règles de dérivation de la section 11.3.

## 13. Résultat normalisé

```json
{
  "schema_version": "1.0",
  "run_id": "RUN-20260805-001",
  "job_id": "JOB-001",
  "sequence": 1,
  "conversation_title": "DeveloperOS — Architecture globale — 01",
  "execution_channel": "chatgpt_plus_manual",
  "attempt": 1,
  "status": "completed",
  "response_raw": "...",
  "response_normalized": "...",
  "provider_refs": {},
  "usage_observed": null,
  "started_at": "2026-08-05T16:00:00+02:00",
  "completed_at": "2026-08-05T16:12:00+02:00",
  "integrity": {
    "identity_marker_found": true,
    "manually_confirmed": false,
    "source_hash": "sha256:..."
  }
}
```

Règles :

- `response_raw` est immuable.
- `response_normalized` retire uniquement l’enveloppe technique et normalise les fins de ligne en V1 ; il ne résume ni ne réécrit le contenu.
- Une transformation sémantique future produit un artefact distinct.
- Une réponse remplacée crée une nouvelle tentative.
- Les usages non observables restent `null`, jamais estimés comme observés.
- Les références API opaques restent privées et ne sont exportées que dans un export diagnostic explicite.

## 14. Dossier remis au script maître

```text
run-results/
├── run-request.json
├── run-plan.json
├── run-state.json
├── responses.jsonl
├── master-input.md
├── master-response.md
└── run-manifest.json
```

Ordre de `master-input.md` :

1. identité et révision du run ;
2. prompt maître final ;
3. tableau des missions et statuts ;
4. réponses classées par séquence ;
5. réponses manquantes ou échouées ;
6. avertissements d’intégrité et limites ;
7. instruction de synthèse.

Le prompt maître refuse de démarrer automatiquement si une mission de `required_jobs` manque. Un lancement manuel dégradé exige une confirmation explicite et inscrit la liste des absences.

## 15. Stratégies d’échec V1

- `fail_fast` : arrêter les nouveaux lancements au premier échec terminal ;
- `continue_independent` : poursuivre uniquement les missions qui ne dépendent pas transitivement du travail échoué ;
- `manual_decision` : suspendre les nouveaux lancements et demander un arbitrage.

Par défaut : `continue_independent`.

Une mission dépendante d’un échec reste bloquée. Elle n’est jamais lancée avec un contexte incomplet sans création explicite d’une nouvelle révision du plan.

## 16. Relance et reprise

- Relance d’une mission seule.
- Relance de toutes les missions `failed_retryable`.
- Reprise d’un run après fermeture de la PWA.
- Récupération d’une réponse API terminée pendant l’absence de l’iPhone.
- Conservation de toutes les tentatives.
- Reprise depuis la prochaine mission réellement actionnable.
- Interdiction d’écraser silencieusement une réponse importée.
- Un événement webhook dupliqué est traité de manière idempotente.

## 17. UX iPhone

### 17.1 Écrans

1. Liste des runs.
2. Import ou création d’un run.
3. Validation et prévisualisation du plan canonique.
4. Tableau de bord du run.
5. Détail d’une mission.
6. Import de réponse.
7. Consolidation maître.
8. Paramètres des canaux, limites et confidentialité.

### 17.2 Tableau de bord

Afficher :

- nom maître ;
- révision du run ;
- progression globale ;
- missions prêtes, en cours, manuelles, terminées et bloquées ;
- canal de chaque mission ;
- prochaine action unique ;
- bouton d’arrêt ou reprise ;
- usage et coût API observés lorsqu’ils sont disponibles, distincts de toute estimation.

### 17.3 Exigences

- Safe areas iOS.
- Champs accessibles avec clavier ouvert.
- Défilement fiable.
- Boutons tactiles suffisants.
- Copie confirmée visuellement.
- Retour toujours possible.
- Aucune WebView bloquante.
- États vide, chargement, succès, partiel et erreur.
- Mode sombre.
- Accessibilité VoiceOver de base.

## 18. Architecture technique cible

### Client PWA

- React + TypeScript selon l’architecture DeveloperOS existante.
- Module isolé derrière des interfaces.
- IndexedDB pour les runs manuels et le cache local.
- Import/export via l’API Files du navigateur.
- Presse-papiers avec repli manuel si permission refusée.

### Backend API

- Node.js + TypeScript.
- SDK OpenAI officiel.
- Authentification obligatoire avant exposition publique.
- Stockage privé des runs API.
- Secret injecté par variable d’environnement.
- API interne versionnée.
- Webhook signé ou polling contrôlé pour les travaux d’arrière-plan.
- Politique explicite de conservation, suppression et option `store` avant mise en production.

### Interfaces recommandées

```text
RunRequestValidator
RunPlanBuilder
RunRepository
JobScheduler
DependencyContextBuilder
ExecutionProvider
ManualExecutionProvider
OpenAIExecutionProvider
ResponseNormalizer
MasterBundleBuilder
```

Le provider manuel ne simule pas un appel automatique : il produit les artefacts de copie et attend une réponse collée.

## 19. Sécurité et confidentialité

- `OPENAI_API_KEY` uniquement côté serveur.
- Aucun secret dans le bundle frontend.
- Aucun `.env` commis.
- Validation JSON Schema avant persistance.
- Limite de taille par fichier, prompt, dépendance et réponse.
- Échappement des contenus affichés.
- Protection CSRF et contrôle d’origine selon l’hébergement.
- Authentification et autorisation minimales obligatoires pour le backend.
- Journalisation des métadonnées par défaut ; contenu seulement en mode diagnostic explicite.
- Exports réels exclus du dépôt.
- Suppression locale et serveur confirmée.
- Politique de rétention configurable et documentée.
- Données personnelles minimisées.
- Aucun scraping ou pilotage automatisé de l’interface ChatGPT.

## 20. Coûts et quotas

- ChatGPT Plus et API sont deux ressources distinctes.
- L’application n’additionne jamais leurs usages dans un même solde.
- Canal manuel : afficher `limites ChatGPT non mesurables automatiquement`.
- Canal API : afficher l’usage observé et une estimation monétaire uniquement avec une table de prix datée et vérifiée.
- Une estimation est toujours marquée `estimée`.
- Plafond API par run configurable.
- Confirmation avant dépassement d’un seuil.
- Batch API réservé à un Build ultérieur non interactif.

## 21. Critères d’acceptation SPEC-00

La spécification est validée lorsque :

- les deux canaux sont décrits sans ambiguïté ;
- le run hybride est dérivé et non confondu avec un canal ;
- le nommage est déterministe et la séquence n’est pas contradictoire avec l’ordre ;
- le contrat contient maître, missions, canaux et dépendances ;
- le plan canonique est distinct de l’entrée ;
- le contexte des dépendances est injecté dans les prompts aval ;
- la machine d’états et la parallélisation sont déterministes ;
- le parcours copier-coller est complet ;
- les résultats convergent vers un même format ;
- les règles de sécurité interdisent l’exposition de la clé ;
- les limites ChatGPT et API sont distinguées ;
- les Builds suivants sont décomposables sans décision d’architecture majeure restante.

## 22. Critères d’acceptation du produit V1

- Importer un `run-request.json` valide.
- Rejeter un cycle de dépendances avec une erreur compréhensible.
- Générer exactement les titres `Nom maître — 01`, `— 02`, etc.
- Interdire un champ `sequence` fourni par l’entrée V1.
- Produire un `run-plan.json` stable après validation.
- Préparer plusieurs prompts ChatGPT Plus et importer leurs réponses.
- Lancer au moins deux missions API indépendantes en parallèle.
- Ne pas lancer une mission dont une dépendance manque.
- Injecter le bon résultat amont dans le prompt aval.
- Reprendre un run interrompu sans duplication.
- Relancer une mission sans perdre l’ancienne tentative.
- Générer `responses.jsonl` et `master-input.md` complets.
- Ne jamais exposer la clé dans le client, les exports ou les logs.
- Fonctionner correctement sur iPhone avec clavier, défilement et retour.

## 23. Tests futurs obligatoires

### Contrats et plan

- JSON valide et invalide.
- Identifiants dupliqués.
- Champ `sequence` interdit dans l’entrée.
- Ordre de tableau et séquences générées.
- Dépendance absente ou sur soi-même.
- Cycle direct et indirect.
- Champs inconnus.
- Limites de taille.
- immutabilité du plan validé.

### Nommage

- 1 à 9 ;
- 10 à 99 ;
- 100 et plus ;
- accents, apostrophes et tirets ;
- relance sans changement de titre ;
- nouvelle révision après réordonnancement.

### Dépendances et orchestration

- deux missions parallèles ;
- concurrence maximale ;
- dépendance débloquée après résultat ;
- injection `normalized` et `raw` ;
- ordre stable de plusieurs dépendances ;
- contexte trop volumineux ;
- échec retryable et terminal ;
- annulation ;
- idempotence ;
- reprise après redémarrage.

### Manuel

- copie du titre et du prompt ;
- permission presse-papiers refusée ;
- réponse avec et sans balise ;
- réponse d’une autre mission ;
- réponse très longue ;
- remplacement confirmé.

### API

- clé absente ;
- authentification refusée ;
- limite de débit ;
- timeout ;
- réponse incomplète ;
- webhook dupliqué ;
- polling de récupération ;
- usage observé absent ;
- absence de secret dans le client et les logs.

### UX iPhone

- petit viewport ;
- clavier ouvert ;
- rotation ;
- hors connexion pour le canal manuel ;
- perte réseau pendant une exécution API ;
- retour et reprise.

## 24. Découpage des Builds

### CO-BUILD-00 — Contrats et fondations

- JSON Schema de demande, plan et résultat.
- Types TypeScript.
- Validation stricte.
- Génération du nommage et du plan.
- Graphe de dépendances.
- Construction du contexte injecté.
- Machine d’états.
- Fixtures et tests unitaires.

### CO-BUILD-01 — Canal ChatGPT Plus manuel

- Import du run.
- Tableau de bord.
- Copie titre et prompt effectif.
- Ouverture ChatGPT.
- Collage et vérification.
- Export des résultats.
- Persistance locale.

### CO-BUILD-02 — Backend et canal OpenAI API

- Service backend.
- Authentification.
- Provider OpenAI.
- Concurrence et reprise.
- Erreurs et usages.
- Sécurité du secret.
- Rétention et suppression.

### CO-BUILD-03 — Hybride et synthèse maître

- Exécution mixte.
- Consolidation.
- `master-input.md`.
- Lancement maître manuel ou API.
- Résultats partiels confirmés.

### CO-QA-01 — Recette complète

- Tests automatisés.
- Audit de secrets.
- Déploiement Replit Starter sans agent IA.
- Validation iPhone.
- Reprise réseau et verrouillage.
- Preuve de reconstruction depuis GitHub.

## 25. Parallélisation des travaux de développement

`CO-BUILD-00` doit être intégré avant les développements parallèles, car il fige les contrats partagés.

Après intégration, trois lots peuvent partir du même SHA :

| Lot | Branche logique | Périmètre exclusif |
|---|---|---|
| Manuel | `developeros/co-build-01-manual` | UI et provider manuel. |
| API | `developeros/co-build-02-api` | Backend et provider OpenAI. |
| QA contrats | `developeros/co-qa-contracts` | Tests supplémentaires sans modifier les providers ni les contrats. |

Règles :

- listes de fichiers autorisés dans chaque prompt Codex ;
- aucun fichier partagé modifié simultanément ;
- tout changement de contrat passe par une PR dédiée et suspend les lots dépendants ;
- une tâche d’intégration unique assemble les lots ;
- aucune fusion automatique.

## 26. Routage ProjectOS des outils

### SPEC-00

- ChatGPT : cadrage, architecture, rédaction, relecture et correction documentaire.
- GitHub : branche dédiée, commits, contrôles et Pull Request.
- Codex : non utilisé pour la rédaction documentaire ; son indisponibilité de revue automatique ne bloque pas la revue humaine par ChatGPT.
- Replit : non utilisé.

### Builds

- ChatGPT : préparation des prompts, critères d’acceptation, revue des PR et arbitrage.
- Codex : implémentation multi-fichiers, tests et diff sur branches dédiées.
- GitHub : source canonique et livraison.
- Replit Starter sans agent IA : exécution, preview, tests fonctionnels et déploiement.
- Pyto ou Raccourcis : uniquement si une capacité locale iPhone non réalisable proprement dans la PWA est démontrée.
- Working Copy : récupération ou publication de secours si le canal principal échoue.

## 27. Risques

| Risque | Réponse |
|---|---|
| Confusion Plus/API | Deux canaux et deux compteurs séparés. |
| Confusion ordre/séquence | Séquence dérivée et plan figé. |
| Dépendance seulement attendue mais non transmise | Construction obligatoire du contexte injecté. |
| Réponse collée au mauvais job | Balise, détection et confirmation. |
| Double lancement API | Idempotence et machine d’états. |
| Coût API non maîtrisé | Concurrence et plafond par run. |
| Conflits de branches parallèles | Contrat intégré et périmètres exclusifs. |
| Perte de réponse | Original immuable et persistance atomique. |
| Secret exposé | Backend uniquement et tests de fuite. |
| Prompt maître trop volumineux | Détection de seuil ; réduction hiérarchique reportée. |

## 28. Retour arrière

- Le module reste séparé du noyau Project Core.
- Le canal manuel fonctionne sans backend.
- Le provider API peut être désactivé sans perdre les runs manuels.
- Les schémas et plans sont versionnés.
- Toute migration crée une sauvegarde avant transformation.
- Une PR peut être annulée sans toucher aux données réelles non versionnées.

## 29. Décisions ouvertes pour les Builds

- Emplacement exact dans l’arborescence actuelle de DeveloperOS.
- Hébergement exact du backend privé.
- Authentification pour l’utilisateur unique.
- Stockage serveur minimal : fichier, SQLite ou service managé.
- Profils de modèles initiaux et plafonds de coût.
- Politique OpenAI `store`, rétention et suppression.
- Format exact des deep links vers ChatGPT selon les possibilités iOS vérifiées au moment du Build.

Ces décisions n’empêchent pas `CO-BUILD-00`, sauf l’emplacement exact des fichiers qui doit être confirmé dans son Delivery Preflight.

## 30. Définition de prêt pour CO-BUILD-00

`CO-BUILD-00` peut être confié à Codex lorsque :

- cette SPEC-00 et l’ADR-003 sont fusionnées ;
- le code actuel de DeveloperOS est relu ;
- les emplacements exacts des modules et tests sont confirmés ;
- le Delivery Preflight est établi ;
- le prompt Codex définit les fichiers autorisés, tests et mode de livraison ;
- aucune autre tâche active ne modifie les mêmes fichiers.
