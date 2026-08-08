# DeveloperOS Agent Usage — Raccourci iOS simplifié

Ce parcours utilise `shortcuts_quick.py`. Il conserve le pont JSON strict de BUILD-02, mais déplace la construction des enveloppes, l’UUID, les dates, la validation nominale et les confirmations techniques dans Pyto.

Il ne constitue pas un export Apple `.shortcut`.

## Résultat

Le Raccourci iOS ne construit plus de JSON imbriqué et ne gère plus directement :

- `schemaVersion` ;
- `import_id` ;
- `captured_at` ;
- les scopes ;
- `validated_at` ;
- `confirmed_warning_codes` ;
- les enveloppes analyze/commit/cancel.

Le parcours nominal devient :

```text
Image ou texte
→ OCR si nécessaire
→ Pyto analyze
→ résumé humain
→ Enregistrer ou Annuler
→ Pyto commit/cancel
```

## Préparation Pyto

Le dossier du compagnon doit contenir notamment :

- `shortcuts_quick.py` ;
- `shortcuts_bridge.py` ;
- les modules BUILD-01 et BUILD-02.

L’action Pyto observée sur iPhone est **Exécuter le Script**. La sortie est récupérée avec **Obtenir le résultat du script**. La console doit rester désactivée.

## Configuration du Raccourci

Nom recommandé :

```text
DeveloperOS — Import quota ChatGPT
```

Activer la feuille de partage pour :

- Images ;
- Texte ;
- Fichiers.

En l’absence d’entrée, continuer afin de proposer Capture, Presse-papiers ou Saisie manuelle.

## 1. Acquisition

Produire deux variables :

- `RawText` ;
- `InputKind`.

Valeurs autorisées de `InputKind` :

- `image_ocr` ;
- `clipboard_text` ;
- `manual_text`.

Pour une image, utiliser l’action native d’extraction de texte. Pour une saisie manuelle compacte, le format suivant est accepté :

```text
63
11 août 2026 17:49
```

## 2. Analyse

Ajouter l’action Pyto **Exécuter le Script** :

- script : `shortcuts_quick.py` ;
- arguments : `analyze`, puis la variable `InputKind` ;
- `sys.stdin` : `RawText` ;
- console : désactivée.

Ajouter ensuite **Obtenir le résultat du script**, puis convertir la sortie JSON en dictionnaire.

Lire :

- `status` ;
- `import_id` ;
- `shortcut_summary` ;
- `shortcut_can_commit` ;
- `shortcut_blockers`.

Si `status = error`, afficher `error.code` et `error.message`, puis arrêter.

Afficher `shortcut_summary` et proposer :

- Enregistrer ;
- Annuler.

Si `shortcut_can_commit = false`, ne pas appeler commit. Proposer de recommencer avec une meilleure capture ou la saisie manuelle.

## 3. Enregistrement

Sur **Enregistrer**, appeler `shortcuts_quick.py` une deuxième fois :

- argument : `commit` ;
- `sys.stdin` : `import_id` ;
- console : désactivée.

Récupérer la sortie.

Résultats possibles :

- `committed` : nouveau snapshot enregistré ;
- `idempotent` : même import déjà enregistré ;
- `duplicate_skipped` : mesure déjà présente ;
- `needs_edit` : une correction est obligatoire ;
- `error` : afficher le diagnostic expurgé.

Après `committed` seulement, le Raccourci peut proposer de supprimer la capture d’origine.

## 4. Annulation

Sur **Annuler**, appeler `shortcuts_quick.py` :

- argument : `cancel` ;
- `sys.stdin` : `import_id`.

Le staging est supprimé et aucun snapshot n’est écrit.

## Sécurité et vérité métier

- le texte OCR brut reste transitoire ;
- le résultat d’analyse ne renvoie pas le texte brut ;
- une ambiguïté ou un reset incohérent bloque l’enregistrement rapide ;
- choisir Enregistrer confirme uniquement les avertissements non bloquants déjà affichés ;
- `null` reste distinct de zéro ;
- les doublons sont non destructifs ;
- aucun réseau, cookie, jeton ou API privée n’est utilisé.

## Parcours avancé

Le guide `IOS_SHORTCUT_IMPORT.md` documente le parcours JSON complet avec corrections et overrides dans Raccourcis. Il reste disponible pour les cas avancés, mais n’est plus nécessaire au parcours nominal.

## Tests physiques encore requis

- passage de deux arguments à **Exécuter le Script** ;
- variable dynamique `InputKind` dans les arguments ;
- texte transmis par `sys.stdin` ;
- sortie JSON par **Obtenir le résultat du script** ;
- Pyto fermé ;
- OCR depuis aperçu de capture et Photos ;
- suppression facultative de la capture ;
- mode sombre, grandes tailles de texte et VoiceOver.
