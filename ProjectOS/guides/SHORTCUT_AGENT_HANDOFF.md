# ProjectOS — Raccourci iOS d’import des livraisons agents

## But

Créer un raccourci `ProjectOS — Importer une livraison` utilisable depuis la feuille de partage de Safari, ChatGPT, Codex ou Fichiers.

## Entrées acceptées

- fichiers ZIP, patch ou bundle ;
- documents Markdown ou texte ;
- URL de conversation ;
- texte contenant un compte rendu ou le contenu complet de fichiers.

## Flux minimal

1. Recevoir l’entrée depuis la feuille de partage.
2. Demander le projet, l’axe et le nom de la discussion, avec valeurs proposées lorsque le texte permet de les détecter.
3. Créer un horodatage `yyyyMMdd-HHmmss`.
4. Créer le dossier :

```text
iCloud Drive/ProjectOS/Inbox/<projet>/<horodatage>-<axe>/
```

5. Enregistrer les fichiers reçus sans les modifier.
6. Pour une entrée texte, l’enregistrer dans `HANDOFF_RECEIVED.md`.
7. Créer `IMPORT_METADATA.md` contenant : nom de discussion, projet, axe, date, URL source, branche cible, type de livraison et liste des fichiers.
8. Afficher une notification avec le chemin du dossier.
9. Proposer d’ouvrir le dossier dans Fichiers ou Working Copy.

## Limites

Le raccourci assure la collecte, le classement et la traçabilité. L’application d’un patch, les contrôles Git et la création d’une Pull Request restent à effectuer par un outil disposant des capacités nécessaires, par exemple Working Copy, GitHub ou un agent connecté.

## Nettoyage

Après confirmation que la livraison a été intégrée et vérifiée, déplacer le dossier vers `iCloud Drive/ProjectOS/Processed/` ou le supprimer selon la politique de conservation du projet.