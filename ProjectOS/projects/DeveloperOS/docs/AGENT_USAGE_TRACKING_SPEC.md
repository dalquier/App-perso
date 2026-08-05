# DeveloperOS — BUILD-00 — Spécification du suivi d’usage agentique

## 1. Objectif

Créer un système iPhone-first permettant à Damien de suivre le quota partagé entre Codex, ChatGPT Work et les fonctions agentiques compatibles, puis de rapprocher les variations observées des tâches réalisées.

BUILD-00 ne produit pas encore le widget exécutable. Il fixe le contrat de données, les règles d’attribution, la confidentialité, l’architecture cible et les critères d’acceptation des Builds suivants.

## 2. Périmètre fonctionnel

Le système doit permettre de :

- saisir ou importer un relevé du tableau d’utilisation OpenAI ;
- enregistrer le pourcentage de quota restant et la date de réinitialisation ;
- enregistrer séparément les crédits supplémentaires lorsqu’ils sont visibles ;
- démarrer, clôturer et classer une tâche Codex ou Work ;
- rattacher une tâche à un projet DeveloperOS ;
- calculer une variation observée entre deux relevés ;
- distinguer attribution certaine, intervalle multi-tâches et estimation ;
- produire des indicateurs hebdomadaires ;
- afficher ces indicateurs dans un widget Pyto moderne et professionnel.

Hors périmètre BUILD-00 :

- lecture automatique d’un compte ChatGPT par cookie ;
- utilisation d’une API privée non documentée ;
- suivi de la facturation API OpenAI ;
- stockage du contenu des conversations ;
- synchronisation distante multi-utilisateur.

## 3. Architecture cible

```text
apps/developer-os/
└── companions/
    └── pyto/
        └── agent-usage/
            ├── main.py
            ├── widget.py
            ├── storage.py
            ├── models.py
            ├── analytics.py
            ├── task_logger.py
            ├── import_snapshot.py
            ├── shortcuts_bridge.py
            ├── README.md
            ├── examples/
            └── tests/
```

Les données réelles ne résident pas dans le dépôt. Elles sont écrites dans un dossier local dédié, configurable, sous Pyto/iCloud.

## 4. Modèle de données

### 4.1 TaskRecord

Champs requis :

- `schemaVersion` ;
- `task_id` ;
- `tool` ;
- `project_id` ;
- `title` ;
- `started_at` ;
- `ended_at` ;
- `status` ;
- `source` ;
- `quota_before_percent` ;
- `quota_after_percent` ;
- `observed_delta_percent` ;
- `credits_observed` ;
- `credits_estimated` ;
- `confidence` ;
- `evidence` ;
- `notes`.

### 4.2 UsageSnapshot

Champs requis :

- `schemaVersion` ;
- `snapshot_id` ;
- `captured_at` ;
- `remaining_percent` ;
- `reset_at` ;
- `purchased_credits_remaining` ;
- `source` ;
- `confidence` ;
- `validated_at` ;
- `raw_text_hash` facultatif, sans conserver le texte brut.

### 4.3 UsageInterval

Objet calculé reliant deux relevés :

- `from_snapshot_id` ;
- `to_snapshot_id` ;
- `delta_percent` ;
- `task_ids` ;
- `attribution_mode` ;
- `confidence`.

## 5. Règles de calcul

- `delta_percent = before.remaining_percent - after.remaining_percent`.
- Une valeur négative signale probablement une réinitialisation ou une correction et ne constitue pas une consommation.
- Une tâche unique entre deux relevés peut recevoir la variation observée.
- Plusieurs tâches entre deux relevés partagent un intervalle, sans ventilation fictive.
- Une prévision d’épuisement n’est affichée que si au moins deux variations valides existent dans la période active.
- La prévision doit afficher son niveau de confiance.
- Une donnée âgée de plus de 24 heures est signalée comme obsolète ; ce seuil reste configurable.

## 6. Widget Pyto — direction UX/UI

### 6.1 Positionnement

Le widget doit ressembler à un instrument de pilotage premium, pas à une feuille de calcul miniature. L’information principale doit être lisible en moins de deux secondes.

### 6.2 Langage visuel

- cartes sobres avec profondeur légère ;
- typographie hiérarchisée ;
- grand pourcentage central ;
- anneau ou barre de progression avec valeur textuelle ;
- contraste élevé et mode sombre natif ;
- pictogrammes simples ;
- coins arrondis cohérents avec iOS ;
- espacements généreux ;
- aucune surcharge décorative.

### 6.3 Petite taille

Afficher :

- quota restant ;
- temps avant reset ;
- fraîcheur de la donnée ;
- état synthétique : confortable, vigilance, critique ou épuisé.

### 6.4 Taille moyenne

Afficher en plus :

- jauge principale ;
- tâches Codex et Work de la semaine ;
- consommation depuis le dernier relevé ;
- prévision d’épuisement si suffisamment fiable.

### 6.5 Grande taille

Afficher en plus :

- mini-historique sur sept jours ;
- moyenne par tâche attribuable ;
- distinction quota inclus / crédits supplémentaires ;
- dernière tâche ;
- alerte de qualité des données.

### 6.6 États

Le design doit couvrir :

- données fraîches ;
- données obsolètes ;
- quota épuisé ;
- reset détecté ;
- aucun relevé ;
- import invalide ;
- plusieurs tâches non attribuables ;
- crédits supplémentaires inconnus.

## 7. Parcours iPhone cible

1. Damien ouvre le tableau d’utilisation ChatGPT.
2. Il prend une capture ou copie le texte reconnu.
3. Un Raccourci iOS extrait le pourcentage et la date de reset.
4. Pyto affiche une prévisualisation et demande validation.
5. Le relevé est ajouté au journal local.
6. Le widget est actualisé.
7. Lorsqu’une tâche Codex ou Work est lancée depuis ProjectOS/DeveloperOS, un TaskRecord est créé.
8. À la clôture, le système rapproche la tâche des relevés disponibles.

## 8. Confidentialité

- Aucun secret ni cookie ChatGPT.
- Aucun texte intégral de conversation.
- Aucun screenshot dans GitHub.
- Les exemples versionnés sont fictifs.
- Les exports locaux doivent pouvoir être supprimés depuis l’application.
- La collecte de métadonnées d’usage est distincte du consentement à la mémoire conversationnelle.

## 9. Critères d’acceptation BUILD-00

BUILD-00 est accepté lorsque :

- le standard transverse existe ;
- le modèle JSON d’une tâche existe ;
- la présente spécification couvre données, règles, UX, sécurité et tests ;
- DeveloperOS référence officiellement ce module compagnon ;
- l’index ProjectOS référence le nouveau standard ;
- aucune donnée réelle ni secret n’est ajouté ;
- une Pull Request dédiée permet la revue avant fusion.

## 10. Découpage des Builds suivants

### BUILD-01 — Core Pyto local

Modèles, stockage JSONL, validation, journal des tâches, snapshots et tests unitaires.

### BUILD-02 — Import iOS

Raccourci iOS, parsing du texte reconnu, validation humaine et gestion des erreurs.

### BUILD-03 — Widget premium

Petite, moyenne et grande tailles, mode sombre, états vides, indicateurs et prévisions.

### BUILD-04 — Intégration DeveloperOS

Vue PWA, rattachement aux projets, liens conversations/branches/PR et import/export commun.

## 11. Stratégie de parallélisation

Après fusion de BUILD-00, trois travaux peuvent avancer en parallèle :

- architecture et tests du core Pyto ;
- spécification détaillée du Raccourci iOS et des formats d’entrée ;
- design system et maquettes du widget.

La production du widget final dépend toutefois du contrat de données du core. Les branches parallèles doivent donc éviter de modifier les mêmes fichiers et se rejoindre dans un Build d’intégration contrôlé.
