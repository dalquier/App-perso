# DeveloperOS — Migration vers la publication native Codex

Date : 2026-08-04

## Constat

Un test réel de publication a confirmé que l’environnement Codex peut être relié à `dalquier/App-perso` et publier une Pull Request par le menu GitHub de l’interface, même lorsque le sandbox terminal ne présente ni remote `origin`, ni upstream, ni credentials Git visibles.

La Pull Request de test nº 18 a été créée avec succès puis fermée sans fusion.

## Nouvelle règle

Les futurs Builds DeveloperOS :

1. utilisent l’environnement Codex `App-perso — ProjectOS` ;
2. sélectionnent `dalquier/App-perso` et `main` ;
3. construisent dans le sandbox Codex ;
4. ne vérifient pas les credentials Git du terminal ;
5. ne s’arrêtent pas en raison de l’absence de remote ou d’upstream ;
6. produisent les fichiers, les tests, le handoff et le diff ;
7. sont publiés après la tâche par le menu GitHub natif de Codex ;
8. ne modifient jamais directement `main` ;
9. ne fusionnent aucune Pull Request sans validation.

## Repli

Si la publication native échoue après construction, le diff est conservé et transmis par `Copier git apply` ou `Copier le patch`. Le Build n’est pas relancé depuis zéro.
