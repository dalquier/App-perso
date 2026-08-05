# Guide — Archivage des conversations ProjectOS

## Objet

Ce guide applique l’ADR-003. Il archive uniquement les conversations ChatGPT et Codex dont l’enregistrement ProjectOS est actif. Il ne parcourt ni n’exporte toutes les conversations du compte OpenAI.

## Structure Drive

```text
Google Drive/App-perso/ProjectOS/Conversation-Archives/
└── <Projet>/<AAAA>/<SES-AAAAMMJJ-NNN>/
    ├── MANIFEST.json
    ├── SESSION_SUMMARY.md
    ├── conversation.<format>
    ├── attachments/
    ├── deliverables/
    └── archive.zip
```

`conversation.<format>` et `archive.zip` sont optionnels. Le nom de session est la clé de liaison avec GitHub.

## Procédure

1. Vérifier que la mémoire de la session est activée.
2. Inventorier uniquement les éléments de cette session effectivement accessibles.
3. Classer chaque fichier :
   - canonique : conserver dans GitHub et référencer son chemin ;
   - non canonique : inclure dans l’archive Drive ;
   - sensible ou secret : exclure, masquer ou résumer.
4. Préparer la synthèse et le manifeste à partir du modèle.
5. Créer le dossier Drive privé de la session.
6. Téléverser le verbatim disponible, les pièces jointes non canoniques, les livrables utiles, la synthèse et le manifeste.
7. Si un bundle est créé, calculer son SHA-256.
8. Vérifier :
   - le dossier et les fichiers existent sur Drive ;
   - le nombre de fichiers et la taille correspondent au manifeste ;
   - le lien n’est pas public ;
   - l’empreinte du bundle correspond ;
   - les éléments indisponibles sont listés.
9. Mettre à jour l’index et la synthèse GitHub avec le statut et le lien Drive privé.
10. Supprimer éventuellement la copie iCloud de transit uniquement après vérification et action explicite.

## États

- `non requise` : rien d’utile à archiver.
- `à préparer` : éléments accessibles, archive non vérifiée.
- `partielle` : archive contrôlée mais éléments manquants documentés.
- `vérifiée` : existence, inventaire, accès et intégrité contrôlés.
- `indisponible` : export impossible avec les capacités actuelles.
- `supprimée` : suppression explicitement demandée et répercutée dans GitHub.

## Automatisation

L’automatisation admissible commence lorsque les fichiers de la session sont accessibles dans un dossier de transit ou par un connecteur autorisé. Elle peut :

- sélectionner un dossier portant l’identifiant de session ;
- générer l’inventaire et les SHA-256 ;
- créer le dossier Drive ;
- téléverser et relire les métadonnées ;
- produire les valeurs à reporter dans GitHub ;
- déplacer la copie de transit vers une corbeille récupérable après validation explicite.

Elle ne doit jamais :

- scanner tout le compte ChatGPT ou Codex ;
- déclarer un export réussi sans fichier accessible ;
- créer un partage public ;
- supprimer automatiquement l’unique copie avant vérification ;
- recopier dans Drive le dépôt canonique comme s’il s’agissait d’une archive conversationnelle.

## Récupération

1. Rechercher la session dans `memory/CONVERSATION_INDEX.md`.
2. Lire sa synthèse.
3. Ouvrir les références GitHub canoniques.
4. Si nécessaire, suivre le lien Drive privé.
5. Contrôler le manifeste avant d’utiliser un fichier archivé.
6. Si l’archive est partielle, traiter la liste des éléments indisponibles comme une limite explicite.
