# ADR-005 — Monorepo applicatif et migration du prototype historique

- Statut : accepté
- Date : 2026-08-04

## Contexte

La gouvernance d’Équilibre est versionnée dans `dalquier/App-perso`, sous `ProjectOS/projects/Equilibre/`. Un prototype historique Pyto/WebView existe dans `dalquier/Scriptable` sous les noms `TCC_Budy` et plusieurs instantanés horodatés. La cible ProjectOS est une PWA installable sur iPhone, avec Pyto comme compagnon local.

Créer un dépôt applicatif supplémentaire ajouterait une seconde source à synchroniser alors que `dalquier/App-perso` est déjà le dépôt canonique de ProjectOS et ne contient pas encore une organisation applicative concurrente. Placer le code sous `ProjectOS/projects/Equilibre/` mélangerait gouvernance et artefacts de build. Créer `projects/Equilibre/` à la racine serait trop proche de `ProjectOS/projects/Equilibre/` et favoriserait les erreurs de chemin.

## Décision

1. Le dépôt canonique unique reste `dalquier/App-perso`.
2. La gouvernance d’Équilibre reste sous `ProjectOS/projects/Equilibre/`.
3. Le code applicatif canonique est placé sous `apps/equilibre/`.
4. Le prototype `TCC_Budy` de `dalquier/Scriptable` reste une référence historique en lecture seule pendant BUILD-01.
5. BUILD-01 inventorie chaque capacité historique et la classe : `réutiliser`, `adapter`, `réécrire`, `différer` ou `archiver`.
6. Aucun fichier historique n’est supprimé, renommé ou remplacé avant une migration vérifiée et documentée.
7. La PWA est l’interface principale ; Pyto demeure un compagnon local pour fichiers, exports, sauvegardes, anonymisation et utilitaires iPhone.
8. Replit Starter importe `dalquier/App-perso` mais exécute l’application depuis `apps/equilibre/`. Replit ne devient jamais une source de vérité.

## Conséquences

- Aucun nouveau dépôt GitHub n’est nécessaire pour BUILD-01.
- La branche de Build sera `equilibre/build-01-minimal-pwa` dans `dalquier/App-perso`.
- Les commandes Replit devront cibler explicitement `apps/equilibre/`.
- Une même Pull Request pourra modifier la gouvernance et le code lorsque les changements sont intrinsèquement liés.
- Le dépôt étant public, aucune donnée réelle, clé, conversation, base locale exportée ou configuration personnelle ne peut être versionnée.
- Une extraction future vers un dépôt privé reste possible par nouvelle ADR si le backend ou les données sensibles l’exigent.

## Retour arrière

Si le monorepo crée un obstacle technique démontré, une nouvelle ADR pourra décider l’extraction de `apps/equilibre/` vers un dépôt dédié. Cette extraction devra conserver l’historique Git lorsque possible, mettre à jour le registre et le manifeste, et fournir un plan de retour arrière.
