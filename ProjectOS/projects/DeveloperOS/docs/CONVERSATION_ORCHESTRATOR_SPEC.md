# DeveloperOS — Conversation Orchestrator — SPEC-00

- Statut : spécification fonctionnelle et technique V1
- Date : 2026-08-05
- Projet : DeveloperOS
- Décision d’architecture : `ADR/ADR-003-CONVERSATION-ORCHESTRATOR-DUAL-EXECUTION.md`
- Code cible futur : `apps/developer-os/modules/conversation-orchestrator/`

## 1. Objectif

Conversation Orchestrator permet à un script maître de :

1. produire un fichier décrivant plusieurs prompts fils ;
2. préparer ou lancer les missions correspondantes ;
3. exécuter en parallèle les missions indépendantes ;
4. collecter les réponses, automatiquement par API ou manuellement depuis ChatGPT Plus ;
5. normaliser les résultats ;
6. fournir l’ensemble au prompt ou script maître pour synthèse, arbitrage et prochaines actions.

Le produit doit fonctionner principalement sur iPhone et s’intégrer à l’interface principale de DeveloperOS.

## 2. Principes directeurs

- Un seul contrat de données pour tous les canaux d’exécution.
- Une mission possède un identifiant technique stable et un titre visible déterministe.
- Les prompts fils sont nommés avec le nom exact du prompt maître suivi d’un numéro.
- Le mode ChatGPT Plus reste manuel et assisté ; aucune extraction automatique de ChatGPT.
- Le mode API est automatisé, côté serveur et séparé de la facturation ChatGPT.
- Les missions indépendantes peuvent être parallélisées ; les dépendances sont respectées.
- Une relance ne doit pas dupliquer ni écraser silencieusement une réponse existante.
- Les secrets et données réelles ne sont jamais versionnés dans le dépôt public.
- L’application conserve les originaux et produit des vues normalisées sans altérer la preuve brute.

## 3. Terminologie

| Terme | Définition |
|---|---|
| Prompt maître | Instruction qui construit le plan de missions ou consolide leurs réponses. |
| Nom maître | Nom visible servant de racine au nom de tous les prompts fils. |
| Mission / job | Unité de travail indépendante ou dépendante, associée à un prompt fils. |
| Prompt fils | Prompt initial d’une mission. |
| Exécution / run | Ensemble versionné d’un prompt maître, de missions, d’états et de résultats. |
| Canal | `openai_api` ou `chatgpt_plus_manual`. |
| Résultat brut | Réponse exacte telle que reçue ou collée. |
| Résultat normalisé | Objet structuré commun remis au script maître. |
| Dépendance | Résultat d’une mission requis avant d’en lancer une autre. |

## 4. Périmètre V1

### Inclus

- Import d’un fichier JSON de missions.
- Validation de schéma et affichage lisible des erreurs.
- Génération déterministe des titres des prompts fils.
- Choix global ou individuel du canal d’exécution.
- File d’attente et exécution parallèle bornée pour l’API.
- Parcours copier-coller optimisé pour ChatGPT Plus.
- Collage et association automatique ou assistée des réponses.
- Dépendances simples entre missions sous forme de graphe acyclique.
- Relance ciblée d’une mission.
- Consolidation des résultats et génération du dossier maître.
- Export JSON, JSONL et Markdown.
- Historique local des exécutions.
- États, erreurs, horodatages et consommation API observée lorsqu’elle est disponible.

### Hors périmètre V1

- Création automatique de conversations visibles dans la barre latérale ChatGPT.
- Lecture automatique des réponses depuis l’application ou le site ChatGPT.
- Automatisation DOM, navigateur piloté, scraping ou interception de session.
- Collaboration multi-utilisateur.
- Synchronisation complète avec l’historique ChatGPT.
- Achat automatique de crédits ou modification de la facturation.
- Choix autonome d’un modèle sans règles configurées.
- Boucle agentique illimitée entre maître et prompts fils.

## 5. Canaux d’exécution

### 5.1 `chatgpt_plus_manual`

Le canal ChatGPT Plus est un flux humain assisté :

1. l’application affiche le titre du prompt fils ;
2. Damien copie le titre ;
3. Damien copie le prompt ;
4. l’application ouvre ChatGPT à la demande ;
5. Damien crée une conversation, colle et envoie ;
6. Damien revient dans DeveloperOS ;
7. il colle la réponse ;
8. l’application vérifie les métadonnées et marque la mission terminée.

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
- navigation rapide vers la prochaine mission incomplète.

Ce canal ne consomme pas l’API. L’application ne prétend pas connaître précisément les quotas ChatGPT et ne garantit pas l’accès à un modèle donné.

### 5.2 `openai_api`

Le canal API est exécuté par un backend :

- clé API côté serveur uniquement ;
- création d’une conversation ou d’un contexte indépendant par mission ;
- envoi via l’API Responses ;
- traitement synchrone, streaming ou arrière-plan selon le profil ;
- récupération du résultat et des usages disponibles ;
- reprise après interruption ;
- limitation du nombre d’appels simultanés ;
- annulation et relance contrôlées ;
- conservation des identifiants opaques nécessaires au diagnostic.

La liste de modèles ne doit pas être codée dans les fichiers d’exécution. Le fichier référence un `model_profile` interne, résolu côté serveur vers un modèle actuellement autorisé.

### 5.3 Mode global `hybrid`

Une exécution peut définir :

- un canal par défaut ;
- un canal différent par mission ;
- un canal distinct pour la synthèse maître.

Une mission peut être basculée avant lancement. Après lancement, le changement de canal crée une nouvelle tentative et conserve l’ancienne trace.

## 6. Règles de nommage

### 6.1 Motif obligatoire

```text
{master_prompt_name} — {sequence}
```

Exemples :

```text
DeveloperOS — Architecture globale — 01
DeveloperOS — Architecture globale — 02
DeveloperOS — Architecture globale — 03
```

### 6.2 Règles

- `master_prompt_name` est obligatoire, non vide et normalisé uniquement pour les espaces de bord.
- Le nom exact est conservé ; aucune reformulation automatique.
- `sequence` commence à `1`.
- Deux chiffres minimum : `01` à `99`.
- Trois chiffres à partir de `100`.
- Le numéro est attribué selon l’ordre canonique du tableau `jobs`.
- Un numéro ne change jamais pendant le run.
- Une mission supprimée après création du run laisse son numéro réservé.
- Une relance conserve le même titre et ajoute un numéro de tentative technique.
- L’identifiant technique `job_id` ne dépend pas du titre visible.

### 6.3 Nom de synthèse maître

Le titre recommandé de la synthèse est :

```text
{master_prompt_name} — Synthèse maître
```

Ce titre est configurable mais n’utilise pas un numéro de prompt fils.

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
  "naming": {
    "pattern": "{master_prompt_name} — {sequence}",
    "minimum_digits": 2
  },
  "defaults": {
    "model_profile": "reasoning-balanced",
    "max_output_tokens": 6000
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
      "sequence": 1,
      "role": "Responsable UX",
      "execution_channel": "chatgpt_plus_manual",
      "instructions": "Tu es responsable UX iPhone.",
      "prompt": "Produis la spécification UX.",
      "depends_on": [],
      "output_format": "markdown"
    },
    {
      "job_id": "JOB-002",
      "sequence": 2,
      "role": "Architecte logiciel",
      "execution_channel": "openai_api",
      "instructions": "Tu es architecte logiciel.",
      "prompt": "Définis l’architecture technique.",
      "depends_on": [],
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
- pour chaque mission : `job_id`, `sequence`, `prompt`, `depends_on`.

### 7.3 Contraintes

- `run_id` et `job_id` uniques dans le fichier.
- `sequence` unique et strictement positive.
- Aucun cycle dans `depends_on`.
- Une dépendance référence une mission existante.
- `max_api_concurrency` est borné par configuration serveur.
- Les tailles de prompt sont contrôlées avant envoi.
- Le fichier ne contient aucun secret.
- Les champs inconnus sont refusés en mode strict ou conservés dans `extensions` en mode extensible.

## 8. Enveloppe d’identification des prompts

Chaque prompt préparé inclut un en-tête stable :

```text
[CONVERSATION_ORCHESTRATOR]
RUN_ID: RUN-20260805-001
JOB_ID: JOB-001
ATTEMPT: 1
CONVERSATION_TITLE: DeveloperOS — Architecture globale — 01
[/CONVERSATION_ORCHESTRATOR]
```

Le prompt demande que la réponse commence idéalement par :

```text
[RUN-20260805-001][JOB-001][ATTEMPT-1]
```

La balise facilite l’association, mais son absence ne rend pas la réponse invalide. Une confirmation manuelle est alors demandée.

## 9. États

### 9.1 États d’un run

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

### 9.2 États d’une mission

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

Les transitions invalides sont refusées et journalisées.

## 10. Parallélisation

### 10.1 Principe

Oui, les missions sont parallélisables. L’orchestrateur calcule les missions prêtes à partir du graphe de dépendances.

Une mission est prête lorsque :

- son fichier est valide ;
- elle n’est ni terminée ni annulée ;
- toutes ses dépendances requises sont terminées ;
- son canal est configuré ;
- aucune validation humaine obligatoire ne manque.

### 10.2 API

- Lancement automatique jusqu’à `max_api_concurrency`.
- File FIFO par défaut, avec priorité optionnelle.
- Concurrence réduite automatiquement après erreurs de limite.
- Relances avec attente progressive et nombre maximal de tentatives.
- Aucun double lancement pour la même clé d’idempotence.

Clé d’idempotence logique :

```text
{run_id}:{job_id}:{attempt}
```

### 10.3 ChatGPT Plus

La parallélisation est assistée : l’application prépare plusieurs prompts et permet à Damien d’ouvrir plusieurs conversations ChatGPT. Elle suit leur état, mais l’envoi et la récupération restent manuels.

### 10.4 Hybride

Les missions API peuvent tourner pendant que Damien traite les missions ChatGPT Plus. Le run reste `running` ou `waiting_manual_input` selon les travaux encore requis.

### 10.5 Dépendances

- `depends_on: []` : mission immédiatement parallélisable.
- dépendance simple : attendre la mission cible.
- dépendances multiples : attendre toutes les missions.
- `dependency_policy: all_success` par défaut.
- politique future possible : `all_terminal`, `any_success`.

## 11. Collecte et normalisation des réponses

Chaque résultat est converti dans le format commun suivant :

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
    "manually_confirmed": false
  }
}
```

Règles :

- `response_raw` est immuable.
- Une normalisation ne supprime pas l’original.
- Une réponse remplacée crée une nouvelle tentative.
- Les usages non observables restent `null`, jamais estimés comme observés.
- Les références API opaques restent privées et ne sont exportées que sur demande.

## 12. Dossier remis au script maître

L’orchestrateur produit :

```text
run-results/
├── run-request.json
├── run-state.json
├── responses.jsonl
├── master-input.md
├── master-response.md
└── run-manifest.json
```

### `master-input.md`

Ordre obligatoire :

1. identité du run ;
2. prompt maître final ;
3. tableau des missions et statuts ;
4. réponses classées par `sequence` ;
5. réponses manquantes ou échouées ;
6. contradictions ou avertissements techniques détectés ;
7. instruction de synthèse.

Le script maître peut refuser de démarrer si une mission requise manque.

## 13. Stratégies d’échec

Valeurs V1 :

- `fail_fast` : arrêter les lancements futurs au premier échec terminal ;
- `continue_independent` : poursuivre les missions sans dépendance au travail échoué ;
- `continue_all_possible` : poursuivre tout ce qui peut techniquement s’exécuter ;
- `manual_decision` : suspendre et demander un arbitrage.

Par défaut : `continue_independent`.

Une mission dépendante d’un échec reste bloquée et n’est jamais lancée avec un contexte incomplet sans décision explicite.

## 14. Relance et reprise

- Relance d’une mission seule.
- Relance de toutes les missions échouées.
- Reprise d’un run après fermeture de la PWA.
- Récupération d’une réponse API terminée pendant l’absence de l’iPhone.
- Conservation de toutes les tentatives.
- Option `reprendre depuis la dernière mission incomplète`.
- Interdiction d’écraser silencieusement une réponse importée.

## 15. UX iPhone

### 15.1 Écrans

1. Liste des exécutions.
2. Import / création d’un run.
3. Validation du fichier.
4. Tableau de bord du run.
5. Détail d’une mission.
6. Import de réponse.
7. Consolidation maître.
8. Paramètres des canaux et limites.

### 15.2 Tableau de bord

Afficher :

- nom maître ;
- progression globale ;
- missions prêtes, en cours, manuelles, terminées et bloquées ;
- canal de chaque mission ;
- prochaine action unique ;
- bouton d’arrêt ou reprise ;
- coût API observé si disponible, distinct de toute estimation.

### 15.3 Exigences

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

## 16. Architecture technique cible

### Client PWA

- React + TypeScript selon l’architecture DeveloperOS existante.
- Module isolé derrière des interfaces.
- IndexedDB pour les runs manuels et cache local.
- Import/export via l’API Files du navigateur.
- Presse-papiers avec repli manuel si permission refusée.

### Backend API

- Node.js + TypeScript.
- SDK OpenAI officiel.
- Authentification minimale avant exposition publique.
- Stockage privé des runs API.
- Secret injecté par variable d’environnement.
- API interne versionnée.
- Webhook signé ou polling contrôlé pour les travaux d’arrière-plan.

### Interfaces recommandées

```text
RunRepository
JobScheduler
ExecutionProvider
ManualExecutionProvider
OpenAIExecutionProvider
ResponseNormalizer
MasterBundleBuilder
```

Le provider manuel ne simule pas un appel automatique : il produit les artefacts de copie et attend une réponse collée.

## 17. Sécurité et confidentialité

- `OPENAI_API_KEY` uniquement côté serveur.
- Aucun secret dans le bundle frontend.
- Aucun `.env` commis.
- Validation JSON Schema avant persistance.
- Limite de taille par fichier, prompt et réponse.
- Échappement des contenus affichés.
- Protection CSRF et contrôle d’origine selon l’hébergement.
- Journalisation des métadonnées par défaut, contenu seulement en mode diagnostic explicite.
- Exports réels exclus du dépôt.
- Suppression locale et serveur confirmée.
- Politique de rétention configurable.
- Données personnelles minimisées.

## 18. Coûts et quotas

- ChatGPT Plus et API sont deux ressources distinctes.
- L’application n’additionne jamais leurs usages dans un même solde.
- Mode manuel : afficher `quota ChatGPT non mesurable automatiquement`.
- Mode API : afficher usage observé et estimation monétaire uniquement si une table de prix datée et vérifiée est disponible.
- Une estimation est toujours marquée `estimée`.
- Plafond API par run configurable.
- Confirmation avant dépassement d’un seuil.
- Batch API réservé aux volumes non interactifs et ajouté seulement dans un Build ultérieur.

## 19. Critères d’acceptation SPEC-00

La spécification est validée lorsque :

- les deux canaux sont décrits sans ambiguïté ;
- le nommage des prompts fils est déterministe ;
- le contrat JSON contient maître, missions, canaux et dépendances ;
- le graphe de parallélisation et les états sont définis ;
- le parcours copier-coller est complet ;
- les résultats des deux canaux convergent vers un même format ;
- les règles de sécurité interdisent l’exposition de la clé ;
- les limites ChatGPT et API sont distinguées ;
- les Builds suivants sont décomposables sans décision d’architecture majeure restante.

## 20. Critères d’acceptation du produit V1

- Importer un `run-request.json` valide.
- Rejeter un cycle de dépendances avec une erreur compréhensible.
- Générer exactement les titres `Nom maître — 01`, `— 02`, etc.
- Préparer plusieurs prompts ChatGPT Plus et importer leurs réponses.
- Lancer au moins deux missions API indépendantes en parallèle.
- Ne pas lancer une mission dont une dépendance manque.
- Reprendre un run interrompu sans duplication.
- Relancer une mission sans perdre l’ancienne tentative.
- Générer `responses.jsonl` et `master-input.md` complets.
- Ne jamais exposer la clé dans le client, les exports ou les logs.
- Fonctionner correctement sur iPhone avec clavier, défilement et retour.

## 21. Tests futurs obligatoires

### Contrats

- JSON valide et invalide.
- Identifiants et séquences dupliqués.
- Dépendance absente.
- Cycle direct et indirect.
- Champs inconnus.
- Limites de taille.

### Nommage

- 1 à 9 ;
- 10 à 99 ;
- 100 et plus ;
- accents, apostrophes et tirets ;
- relance sans changement de titre.

### Orchestration

- deux missions parallèles ;
- concurrence maximale ;
- dépendance débloquée après résultat ;
- échec retryable ;
- échec terminal ;
- annulation ;
- idempotence ;
- reprise après redémarrage.

### Manuel

- copie du titre et du prompt ;
- permission presse-papiers refusée ;
- réponse avec balise ;
- réponse sans balise ;
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
- usage observé absent.

### UX iPhone

- petit viewport ;
- clavier ouvert ;
- rotation ;
- hors connexion pour le mode manuel ;
- perte réseau pendant une exécution API ;
- retour et reprise.

## 22. Découpage des Builds

### CO-BUILD-00 — Contrats et fondations

- JSON Schema demande/résultat.
- Types TypeScript.
- validation ;
- nommage ;
- graphe de dépendances ;
- machine d’états ;
- fixtures et tests unitaires.

### CO-BUILD-01 — Mode ChatGPT Plus manuel

- import du run ;
- tableau de bord ;
- copie titre/prompt ;
- ouverture ChatGPT ;
- collage et vérification ;
- export des résultats ;
- persistance locale.

### CO-BUILD-02 — Backend et mode OpenAI API

- service backend ;
- provider OpenAI ;
- concurrence ;
- reprise ;
- erreurs ;
- usage ;
- sécurité du secret.

### CO-BUILD-03 — Mode hybride et synthèse maître

- exécution mixte ;
- consolidation ;
- `master-input.md` ;
- lancement maître manuel ou API ;
- résultats partiels.

### CO-QA-01 — Recette complète

- tests automatisés ;
- déploiement Replit sans agent IA ;
- validation iPhone ;
- audit secrets ;
- reprise réseau et verrouillage ;
- preuve de reconstruction depuis GitHub.

## 23. Parallélisation des travaux de développement

### Séquence obligatoire

`CO-BUILD-00` doit être intégré avant les développements parallèles, car il fige les contrats partagés.

### Travaux parallélisables après CO-BUILD-00

| Lot | Branche logique | Périmètre exclusif |
|---|---|---|
| Manuel | `developeros/co-build-01-manual` | UI et provider manuel. |
| API | `developeros/co-build-02-api` | Backend et provider OpenAI. |
| QA contrats | `developeros/co-qa-contracts` | Tests de schémas, graphes et fixtures sans modifier les providers. |

### Règles

- Chaque lot part du même commit intégrant `CO-BUILD-00`.
- Les listes de fichiers autorisés sont définies dans chaque prompt Codex.
- Aucun fichier partagé n’est modifié dans deux tâches simultanées.
- Les changements de contrat passent par une Pull Request dédiée avant reprise des lots.
- Une tâche d’intégration unique assemble les lots.
- Les tâches ne sont pas fusionnées automatiquement.

## 24. Routage ProjectOS des outils

### SPEC-00

- Outil : ChatGPT.
- Rôle : cadrage, architecture, rédaction, décision et mise à jour documentaire.
- GitHub : branche dédiée et Pull Request.
- Codex : non utilisé, car aucun code applicatif n’est produit.
- Replit : non utilisé.

### Builds

- ChatGPT : préparation des prompts, critères d’acceptation, revue des PR et arbitrage.
- Codex : implémentation multi-fichiers, tests et diff sur branches dédiées.
- GitHub : source canonique et livraison.
- Replit Starter sans agent IA : exécution, preview, tests fonctionnels et déploiement.
- Pyto/Raccourcis : uniquement si une capacité locale iPhone non réalisable proprement dans la PWA est démontrée.
- Working Copy : récupération ou publication de secours si le canal principal échoue.

## 25. Risques

| Risque | Réponse |
|---|---|
| Confusion entre Plus et API | Deux canaux et deux compteurs séparés. |
| Réponse collée au mauvais job | Balise, détection et confirmation. |
| Double lancement API | Idempotence et machine d’états. |
| Coût API non maîtrisé | Concurrence et plafond par run. |
| Conflits de branches parallèles | Contrat gelé et périmètres de fichiers exclusifs. |
| Perte de réponse | Original immuable et persistance atomique. |
| Secret exposé | Backend uniquement et tests de fuite. |
| Dépendance bloquée | Visualisation claire et politique d’échec. |
| Prompt maître trop volumineux | Réduction hiérarchique prévue pour un Build ultérieur. |

## 26. Retour arrière

- Le module reste séparé du noyau Project Core.
- Le mode manuel fonctionne sans backend.
- Le provider API peut être désactivé sans perdre les runs manuels.
- Les schémas sont versionnés.
- Toute migration crée une sauvegarde avant transformation.
- Une PR peut être annulée sans toucher aux données réelles non versionnées.

## 27. Décisions ouvertes pour les Builds

- Hébergement exact du backend privé.
- Authentification du backend pour l’utilisateur unique.
- Stockage serveur minimal : fichier, SQLite ou service managé.
- Profils de modèles initiaux et plafonds de coût.
- Stratégie de rétention des contenus API.
- Format exact des deep links vers ChatGPT selon les possibilités iOS vérifiées au moment du Build.

Ces décisions n’empêchent pas le lancement de `CO-BUILD-00`.

## 28. Définition de prêt pour CO-BUILD-00

`CO-BUILD-00` peut être confié à Codex lorsque :

- cette SPEC-00 et l’ADR-003 sont fusionnées ;
- le code actuel de DeveloperOS est relu ;
- les emplacements exacts des modules et tests sont confirmés ;
- le Delivery Preflight est établi ;
- le prompt Codex définit les fichiers autorisés, tests et mode de livraison ;
- aucune autre tâche active ne modifie les mêmes fichiers.
