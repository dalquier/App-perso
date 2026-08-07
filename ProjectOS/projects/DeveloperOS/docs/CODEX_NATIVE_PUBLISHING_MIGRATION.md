# DeveloperOS — Migration vers la publication native Codex

> **Statut : historique / complété par les standards vivants.** Ce document conserve le test de capacité réalisé le 2026-08-04, mais ses règles opérationnelles absolues ont été remplacées par `ProjectOS/standards/CODEX_NATIVE_PUBLISHING.md` et `ProjectOS/standards/CODEX_GITHUB_RELIABILITY.md`.

Date du constat initial : 2026-08-04

## Constat historique

Un test réel de publication a confirmé qu’un environnement Codex peut être relié à `dalquier/App-perso` et publier une Pull Request par le mécanisme GitHub de l’interface, même lorsque le sandbox terminal ne présente ni remote `origin`, ni upstream, ni credentials Git visibles.

La Pull Request de test nº 18 a été créée avec succès puis fermée sans fusion.

## Règle actuelle

Ce test ne prouve pas que **toute** tâche Codex future disposera du même canal de publication. Les tâches DeveloperOS appliquent désormais les standards ProjectOS vivants :

1. vérifier le dépôt, la base et le SHA de départ ;
2. vérifier séparément la lecture GitHub, l’écriture locale, le push terminal et la publication native ;
3. ne jamais traiter un commentaire `@codex` ou un environnement lisible comme preuve de publication ;
4. choisir avant modification un canal principal et un canal de récupération ;
5. produire les modifications et les validations sans modifier directement `main` ;
6. publier nativement uniquement si cette capacité est réellement disponible pour la branche ou la PR concernée ;
7. sinon utiliser le canal de récupération ou de publication authentifié prévu ;
8. vérifier le SHA distant et la CI du SHA effectivement publié ;
9. ne fusionner aucune Pull Request sans autorisation explicite.

## Repli

Si le canal principal échoue après construction, ne pas reconstruire le Build depuis zéro. Conserver et vérifier le diff, puis utiliser le mécanisme de récupération défini par `ARTIFACT_DELIVERY_AND_RECOVERY.md` et `CODEX_GITHUB_RELIABILITY.md`.

## Références actuelles

- `ProjectOS/standards/CODEX_NATIVE_PUBLISHING.md`
- `ProjectOS/standards/CODEX_GITHUB_RELIABILITY.md`
- `ProjectOS/standards/ARTIFACT_DELIVERY_AND_RECOVERY.md`
