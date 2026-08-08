# ProjectOS — Index canonique

## Autorité

Ce dossier est la référence commune de tous les projets personnels. GitHub `dalquier/App-perso`, branche `main`, est la source de vérité.

## Point d’entrée

- `BOOTSTRAP.md` : chargeur unique de ProjectOS.
- `PROJECT_REGISTRY.md` : registre structuré des projets, alias et références canoniques.

## Noyau

- `core/KERNEL.md` : principes permanents et séquence de décision.
- `core/LIFECYCLE.md` : cycle de vie standard d’un projet et d’une modification.
- `core/DECISION_ENGINE.md` : règles de sélection des outils, de résolution des conflits et d’escalade.

## Standards transverses

- `standards/TOOLCHAIN_POLICY.md` : politique obligatoire de développement frugal et rôle de chaque outil.
- `standards/REPLIT_RUNTIME_CONTRACT.md` : contrat obligatoire pour toute application utilisant Replit ; mode runtime, Git hygiene, lancement direct, Preview native, Direct Run Smoke et récupération d’un workspace contaminé.
- `standards/WORKSPACE_AND_FILE_LIFECYCLE.md` : espace de travail iCloud canonique pour les téléchargements, fichiers temporaires, échanges et livrables locaux, avec routage, rétention et règles de promotion vers GitHub/Drive.
- `standards/CREDIT_OPTIMIZATION.md` : optimisation obligatoire des crédits, quotas et appels payants, avec recommandation d’outil avant chaque prompt opérationnel.
- `standards/PARALLEL_EXECUTION.md` : détection, autorisation et orchestration des flux de travail indépendants.
- `standards/PROGRESS_COMMUNICATION.md` : mises à jour factuelles sur les tâches réalisées, l’action en cours et le temps restant estimé.
- `standards/LONG_CONTENT_DELIVERY.md` : choix entre réponse conversationnelle, fichier téléchargeable et livraison GitHub pour les contenus longs, prompts et code.
- `standards/AGENT_USAGE_TRACKING.md` : suivi des tâches Codex/Work, relevés de quota, règles d’attribution et confidentialité.
- `standards/QUALITY_UX_SECURITY.md` : qualité, UX iPhone et sécurité.
- `standards/TOOLS_AND_STORAGE.md` : rôle des applications et stockages.
- `standards/CODE_WORK_ROUTING.md` : routage obligatoire des développements substantiels vers Codex et GitHub.
- `standards/CODEX_NATIVE_PUBLISHING.md` : fonctionnement des sandboxes Codex Cloud et publication native des branches et Pull Requests.
- `standards/CODEX_GITHUB_RELIABILITY.md` : garde-fous de fraîcheur, ressources logiques, preuves de SHA/CI et Merge Gate pour les flux Codex ↔ GitHub.
- `standards/INCIDENT_LEARNING.md` : capture, taxonomie, gravité, déduplication, Execution Capability Preflight et apprentissage à partir des incidents.
- `standards/ARTIFACT_DELIVERY_AND_RECOVERY.md` : précontrôle obligatoire du canal de livraison, preuves externes et récupération des artefacts.
- `standards/CODING_STANDARDS.md` : règles communes de conception et de code.
- `standards/DOCUMENTATION.md` : exigences de documentation et traçabilité.
- `standards/TESTING.md` : stratégie de tests et preuves d’exécution.
- `standards/AGENT_HANDOFFS.md` : transmissions temporaires et livraisons récupérables des agents.
- `standards/CONVERSATION_NAMING.md` : convention obligatoire de nommage des discussions ChatGPT et Codex.
- `standards/CONVERSATION_MEMORY.md` : consentement, indexation et synthèse de la mémoire conversationnelle.
- `standards/CONVERSATION_ARCHIVE_PIPELINE.md` : capture incrémentale directe de la transcription visible et des fichiers dans Google Drive.

`standards/REPLIT_RUNTIME_CONTRACT.md` doit être chargé dès qu’une demande concerne Replit, Preview/Webview, Artifact, Workflow de lancement, port, serveur runtime, PWA exécutée dans Replit, import GitHub dans Replit ou création d’une nouvelle application destinée à y être exécutée.

`standards/WORKSPACE_AND_FILE_LIFECYCLE.md` doit être chargé dès qu’une demande concerne un téléchargement, un fichier généré ou reçu, un fichier temporaire, un export, un ZIP/patch de transit, un classement local, un nettoyage de fichiers ou le choix d’une destination iCloud/Drive/GitHub.

## Décisions transverses

- `ADR/ADR-001-FRUGAL-DEVELOPMENT-TOOLCHAIN.md` : ChatGPT et Codex développent ; Replit Starter exécute, teste, stocke et déploie.
- `ADR/ADR-002-PERMANENT-CODEX-CONVERSATION-MEMORY.md` : consentement permanent à l’enregistrement structuré de toutes les conversations ProjectOS exécutées avec Codex.
- `ADR/ADR-003-DIRECT-CONVERSATION-ARCHIVING.md` : archive directe Drive ; ChatGPT au choix, Codex systématique.
- `ADR/ADR-004-CONTROLLED-PARALLEL-EXECUTION.md` : autorisation simple et garde-fous pour paralléliser les flux indépendants.

## Observabilité

- `observability/README.md` : architecture, composants et état des phases d’observabilité incidents.
- `observability/AGGREGATOR_CONTRACT.md` : contrat JSON partagé entre agrégateur, widget, dashboard et Analyzer.
- `observability/ANALYZER.md` : fonctionnement et garde-fous de la synthèse/prompt à la demande.
- `observability/pyto/` : widget iPhone/Pyto de comptage synthétique des incidents.
- `scripts/incident_aggregator.py` : lecture/déduplication/agrégation déterministe du Ledger.
- `scripts/incident_analyzer.py` : filtres, synthèse et génération du prompt d’audit ChatGPT/Codex.
- GitHub issue `#87 — ProjectOS — Incident Ledger` : journal append-only des occurrences d’incidents expurgées.

## Guides

- `guides/SHORTCUT_AGENT_HANDOFF.md` : flux iOS Raccourcis pour collecter et classer les livraisons d’agents.
- `guides/CONVERSATION_ARCHIVING.md` : usage iPhone pour enregistrer et retrouver une conversation.
- `guides/WORKSPACE_IPHONE.md` : installation de `ProjectOS Workspace`, configuration Safari et construction des raccourcis `Ranger dans ProjectOS` et `Nettoyer Workspace`.

## Prompts

- `prompts/MASTER_PROJECT_PROMPT.md` : version complète de secours du mode ProjectOS.
- `prompts/ACTION_PROMPTS.md` : commandes récurrentes.
- `prompts/CODING_PROMPTS.md` : prompts spécialisés pour développement, audit et correction.

## Projets

- `projects/README.md` : règles d’organisation des références propres aux projets.
- `projects/<projet>/PROJECT_MANIFEST.md` : contrat de pilotage du projet.
- `projects/<projet>/ADR/` : décisions d’architecture.
- `projects/<projet>/docs/` : documentation versionnée utile au pilotage.
- `projects/<projet>/roadmap.md` : trajectoire et jalons lorsque nécessaire.
- `projects/<projet>/memory/` : index, chronologie et synthèses des conversations enregistrées avec consentement.

Le registre central détermine quels projets disposent déjà d’un dossier ProjectOS et quelles références restent à confirmer ou à migrer.

## Modèles

- `templates/PROJECT_MANIFEST.md` : manifeste type.
- `templates/REPLIT_RUNTIME_CONTRACT.md` : contrat type obligatoire pour une application utilisant Replit comme runtime, Preview, hébergement ou environnement de recette.
- `templates/DELIVERY_MANIFEST.md` : preuve type de construction, export, publication, livraison et récupération.
- `templates/AGENT_TASK_RECORD.json` : exemple anonymisé de tâche Codex ou Work suivie.
- `templates/INCIDENT_OCCURRENCE.json.example` : modèle machine-readable d’une occurrence d’incident.
- `templates/CONVERSATION_INDEX.md` : registre type des conversations enregistrées.
- `templates/PROJECT_TIMELINE.md` : chronologie structurante type.
- `templates/SESSION_SUMMARY.md` : synthèse autonome type d’une session.
- `templates/CONVERSATION_ARCHIVE_MANIFEST.json.example` : inventaire et état d’intégrité d’une archive Drive.
- Les modèles ADR, roadmap et documents complémentaires peuvent être ajoutés sans modifier `BOOTSTRAP.md`, à condition d’être indexés ici.

## Archives

- `archives/` : références ProjectOS remplacées ou obsolètes, conservées uniquement pour traçabilité.
- Un document archivé ne doit jamais être chargé comme référence active sauf demande historique explicite.

## Ordre d’autorité

1. instruction explicite de Damien dans la conversation active ;
2. contraintes de sécurité et règles de plateforme ;
3. manifeste du projet concerné ;
4. ADR applicables ;
5. règles permanentes de ProjectOS ;
6. documentation versionnée ;
7. documentation collaborative explicitement référencée sur Google Drive ;
8. mémoire conversationnelle enregistrée ;
9. copie locale iCloud et historique conversationnel brut.

## Stockages

- GitHub : code, règles, manifests, ADR, documentation versionnée, index, synthèses conversationnelles et Incident Ledger expurgé.
- Working Copy : copie Git locale sur iPhone.
- iCloud Drive : `ProjectOS Workspace` pour les téléchargements, fichiers de travail, échanges et livrables locaux ; autres données locales/Pyto selon leur projet. iCloud n’est jamais une seconde branche canonique du code.
- Google Drive : documents collaboratifs, corpus, sauvegardes horodatées et archives conversationnelles intégrales privées.
- Replit Starter : environnement d’exécution, de test, de stockage de travail et de déploiement ; jamais source canonique.

Une sauvegarde Drive ou Replit et une archive brute de conversation ne sont jamais une source de vérité.
