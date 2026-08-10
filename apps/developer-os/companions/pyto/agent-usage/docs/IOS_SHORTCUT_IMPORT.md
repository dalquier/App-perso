# DeveloperOS Agent Usage — BUILD-02 Import iOS

Ce document est un guide d’assemblage déterministe. Il ne constitue pas un export Apple `.shortcut`.

## Architecture

Le Raccourci effectue deux appels Pyto :

1. `analyze` reçoit un JSON UTF-8 par `sys.stdin`, parse le texte transitoire, crée un staging sans texte brut et retourne des candidats JSON ;
2. après validation humaine, `commit` recharge le staging, applique les corrections, écrit un `UsageSnapshot` BUILD-01 et ajoute les métadonnées dans `import_events.jsonl` ;
3. `cancel` supprime le staging sans écrire de snapshot.

Le snapshot persistant utilise obligatoirement :

- `source = "shortcut"` ;
- `confidence = "observed"` ;
- `human_validated = true` ;
- `measurement_scope == quota_scope` ;
- un `quota_cycle_id` dérivé du scope et du reset UTC.

## Installation Pyto

1. Placer le compagnon `agent-usage` dans un dossier accessible à Pyto.
2. Configurer `DEVELOPEROS_AGENT_USAGE_DIR` vers le dossier local de données DeveloperOS.
3. Vérifier physiquement dans Pyto :

```python
from zoneinfo import ZoneInfo
print(ZoneInfo("Europe/Paris"))
```

4. Ne stocker ni capture, ni texte OCR brut, ni secret dans GitHub.

## Assemblage du Raccourci

Nom recommandé : `DeveloperOS — Import quota ChatGPT`.

1. Activer l’affichage dans la feuille de partage.
2. Accepter Images, Texte et Fichiers.
3. Capturer la date actuelle et la formater en ISO 8601 avec décalage.
4. Générer un UUID et construire `import_id = IMP-<UUID>`.
5. Si l’entrée est une image, conserver la référence de l’image puis utiliser l’action native d’extraction de texte.
6. Si l’entrée est du texte, utiliser ce texte.
7. Sans entrée, proposer Capture, Presse-papiers ou Saisie manuelle.
8. Construire une requête `usage_snapshot_analyze_request` comprenant :
   - `schemaVersion = 1` ;
   - `source = shortcut` ;
   - `measurement_scope = chatgpt_agentic_shared` ;
   - `quota_scope = chatgpt_agentic_shared` ;
   - `timezone = Europe/Paris` ;
   - `transient.input_kind` ;
   - `transient.raw_text`.
9. Lancer `shortcuts_bridge.py` avec l’action Pyto **Run Script**, console désactivée, JSON transmis par `sys.stdin`.
10. Lire la réponse avec **Get Script Output**.
11. Afficher le quota, la date complète du reset avec offset, les crédits, la confiance des champs et les avertissements.
12. Pour un champ `ambiguous` ou `absent`, exiger une correction explicite.
13. Proposer Enregistrer, Modifier ou Annuler.
14. Sur Enregistrer, construire `usage_snapshot_commit_request` avec :
   - `validated_by_user = true` ;
   - `validated_at` ;
   - `overrides` ;
   - `confirmed_warning_codes` ;
   - commentaire facultatif.
15. Appeler une seconde fois `shortcuts_bridge.py` et afficher le résultat.
16. Sur Annuler, envoyer `usage_snapshot_cancel_request`.
17. Après un commit réussi seulement, proposer de supprimer la capture. Un échec de suppression ne remet pas en cause le snapshot.

Les noms exacts des actions Pyto doivent être confirmés physiquement sur l’iPhone installé.

## Modes d’entrée

- `image_ocr` : capture ou image OCR ;
- `clipboard_text` : texte partagé ou presse-papiers ;
- `manual_text` : saisie manuelle de secours.

Le mode manuel produit `raw_text_hash = null`.

## Doublons et idempotence

- le même `import_id` retourne le même `snapshot_id` ;
- un hash déjà vu ou un snapshot exact est ignoré par défaut sans suppression de l’historique ;
- aucune donnée existante n’est écrasée ;
- les corrections restent tracées dans le journal d’import.

## Stockage et confidentialité

- `usage_snapshots.jsonl` reste la source de vérité BUILD-01 ;
- `import_events.jsonl` contient uniquement métadonnées, idempotence, warnings et durées ;
- `staging/IMP-*.json` ne contient pas le texte brut et expire après 30 minutes ;
- `.raw_text_hash_secret` est généré localement et ne doit jamais être exporté ;
- les diagnostics publics sont expurgés.

## Transmission de secours

La méthode principale est `Run Script` + `sys.stdin` + `Get Script Output`.

Un fichier JSON temporaire iCloud peut servir de secours uniquement après test physique, avec suppression vérifiée. Le presse-papiers ne doit pas servir de transport JSON nominal.

## Tests automatisés

Depuis la racine du dépôt :

```bash
python -m pytest apps/developer-os/companions/pyto/agent-usage/tests -q
python -m py_compile \
  apps/developer-os/companions/pyto/agent-usage/import_parser.py \
  apps/developer-os/companions/pyto/agent-usage/import_staging.py \
  apps/developer-os/companions/pyto/agent-usage/import_ledger.py \
  apps/developer-os/companions/pyto/agent-usage/import_snapshot.py \
  apps/developer-os/companions/pyto/agent-usage/shortcuts_bridge.py
```

## Recette physique iPhone restant à exécuter

- noms exacts des actions Pyto ;
- entrée par `sys.stdin` ;
- sortie par `Get Script Output` ;
- console désactivée ;
- accents et sauts de ligne ;
- `ZoneInfo("Europe/Paris")` ;
- heures DST ambiguës et inexistantes ;
- Pyto fermé ;
- partage depuis l’aperçu de capture ;
- partage depuis Photos ;
- lancement sans entrée ;
- presse-papiers ;
- suppression de capture ;
- iCloud indisponible ;
- mode sombre ;
- grandes tailles de texte ;
- VoiceOver ;
- fonctionnement hors ligne ;
- mode économie d’énergie ;
- écran verrouillé ;
- timeout réel de l’action Pyto.

## Limites

BUILD-02 n’implémente aucun widget. Les imports historiques avec un reset passé restent hors périmètre. Aucun fichier `.shortcut` non vérifié n’est fourni.
