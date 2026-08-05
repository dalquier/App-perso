# ProjectOS — Suivi de l’usage agentique

## 1. Objet

Ce standard définit la collecte, l’attribution et l’exploitation des données d’usage liées à Codex, ChatGPT Work et aux autres fonctions agentiques partageant un quota ou des crédits.

L’objectif est de permettre un pilotage utile depuis DeveloperOS et un widget Pyto iPhone, sans inventer de consommation, sans exposer de données sensibles et sans confondre quota inclus, crédits supplémentaires et facturation API.

## 2. Principes

- Une donnée observée prévaut toujours sur une estimation.
- Une absence de donnée officielle reste explicitement `unknown`.
- Une baisse de quota entre deux relevés n’est attribuée à une tâche que si une seule tâche éligible est intervenue dans l’intervalle.
- Si plusieurs tâches sont intervenues, la variation est rattachée à l’intervalle, pas répartie artificiellement.
- Les crédits supplémentaires achetés sont suivis séparément du quota hebdomadaire inclus.
- La facturation de l’API OpenAI est hors périmètre de ce journal, sauf module distinct explicitement ajouté.
- Aucun cookie de session, mot de passe, jeton, clé API ou contenu de conversation n’est enregistré.
- Un pourcentage de quota n’est jamais converti en crédits sans méthode documentée et marquage explicite comme estimation.

## 3. Identifiants

Chaque tâche suivie reçoit un identifiant stable :

```text
TSK-AAAAMMJJ-NNN
```

Chaque relevé de quota reçoit un identifiant stable :

```text
SNP-AAAAMMJJ-NNN
```

Chaque intervalle calculé reçoit un identifiant stable :

```text
INT-AAAAMMJJ-NNN
```

Les identifiants sont uniques dans le journal local DeveloperOS/Pyto.

## 4. Enregistrement minimal d’une tâche

Une tâche doit contenir au minimum :

- `task_id` ;
- `tool` : `codex`, `work` ou valeur contrôlée future ;
- `project_id` ;
- `title` ;
- `started_at` ;
- `ended_at` ou `null` ;
- `status` : `planned`, `running`, `completed`, `failed`, `cancelled` ;
- `source` : `manual`, `projectos`, `shortcut`, `import` ;
- `usage_interval_id` ou `null` ;
- `quota_before_percent` ou `null` ;
- `quota_after_percent` ou `null` ;
- `observed_delta_percent` ou `null` ;
- `credits_observed` ou `null` ;
- `credits_estimated` ou `null` ;
- `estimation_method` ou `null` ;
- `confidence` : `observed`, `attributed`, `interval_only`, `estimated`, `unknown` ;
- `evidence` : référence locale non sensible ou `null`.

`observed_delta_percent` ne peut être renseigné sur une tâche que lorsqu’un intervalle valide lui est attribué exclusivement. Sinon, la variation reste portée par l’intervalle.

## 5. Relevé de quota

Un relevé doit contenir :

- date et heure de capture ;
- pourcentage restant ;
- date de réinitialisation ;
- périmètre de mesure ou `measurement_scope` ;
- crédits supplémentaires restants, lorsqu’ils sont explicitement affichés ;
- source de la mesure ;
- niveau de confiance ;
- date de dernière validation humaine.

Le pourcentage doit être compris entre 0 et 100. Une date de réinitialisation incohérente ou passée doit déclencher une validation avant enregistrement. Deux relevés ne sont comparables que s’ils appartiennent au même cycle de quota et au même périmètre de mesure.

## 6. Attribution de consommation

### Attribution certaine

Une variation peut être rattachée à une tâche lorsque :

1. un relevé existe avant la tâche ;
2. un relevé existe après la tâche ;
3. aucune autre tâche Codex ou Work n’a été active entre les deux relevés ;
4. les deux relevés utilisent la même source et le même périmètre de quota ;
5. aucune réinitialisation, correction manuelle ou changement de cycle n’est détecté entre les deux relevés.

Le niveau de confiance devient `attributed`. L’intervalle source reste conservé afin de rendre le calcul vérifiable.

### Intervalle multi-tâches

Si plusieurs tâches sont intervenues, la variation reste enregistrée comme consommation de l’intervalle. Les tâches conservent `observed_delta_percent = null` et `confidence = interval_only`.

### Réinitialisation ou correction

Une variation négative, un changement de date de réinitialisation incompatible ou une hausse du pourcentage restant signale un nouveau cycle ou une correction. Cet intervalle ne doit pas être comptabilisé comme consommation et doit être classé `reset_or_correction`.

### Estimation

Une estimation peut être calculée pour l’analyse, mais :

- elle ne remplace jamais la donnée observée ;
- elle doit être isolée dans `credits_estimated` ;
- sa méthode doit être documentée dans `estimation_method` ;
- elle ne doit jamais être présentée dans l’interface comme un solde officiel ;
- elle ne doit pas être produite lorsque les données sont insuffisantes.

## 7. Stockage et confidentialité

- Le code, les schémas et les exemples anonymisés sont versionnés dans GitHub.
- Les journaux réels restent dans le stockage local Pyto/iCloud ou dans le stockage local DeveloperOS.
- Les exports réels sont exclus de Git.
- Les captures d’écran peuvent être supprimées après extraction et validation.
- Le titre d’une tâche doit rester descriptif sans contenir de secret ni de donnée personnelle sensible.
- Une preuve locale ne doit contenir ni image brute, ni texte OCR brut, ni contenu de conversation ; elle référence seulement un identifiant ou une empreinte locale.

## 8. Widget et interface

Le widget doit privilégier les informations actionnables :

- quota restant ;
- temps avant réinitialisation ;
- fraîcheur du dernier relevé ;
- nombre de tâches Codex et Work sur la période ;
- rythme de consommation ;
- prévision d’épuisement avec niveau de confiance ;
- alerte de donnée obsolète.

Toute valeur estimée doit porter un marqueur visuel explicite. L’absence de mesure ne doit jamais être remplacée par zéro.

## 9. Exigences visuelles

Le widget Pyto doit être moderne, sobre et professionnel :

- hiérarchie typographique claire ;
- densité maîtrisée ;
- prise en charge du mode clair et sombre ;
- compatibilité avec les tailles petite, moyenne et grande ;
- respect des safe areas et de la lisibilité iPhone ;
- jauge accessible qui ne dépend pas uniquement de la couleur ;
- état de fraîcheur visible ;
- aucune animation indispensable à la compréhension.

## 10. Contrôles obligatoires

Avant livraison d’une implémentation :

- validation du schéma ;
- tests des bornes 0 et 100 % ;
- tests de date de réinitialisation ;
- tests d’intervalle avec une et plusieurs tâches ;
- tests de changement de cycle, hausse du quota et correction manuelle ;
- vérification qu’aucun secret ou journal réel n’est commis ;
- vérification manuelle sur iPhone des trois tailles de widget ;
- vérification mode clair, mode sombre et grandes tailles de texte.

## 11. Évolution

Toute nouvelle source automatique doit être documentée avant activation. Une API privée, un cookie de session ou une méthode non officielle ne peut pas devenir la source principale sans décision explicite, analyse de sécurité et mécanisme de désactivation.
