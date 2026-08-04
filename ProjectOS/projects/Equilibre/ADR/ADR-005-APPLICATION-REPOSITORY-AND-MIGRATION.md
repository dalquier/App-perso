# ADR-005 — Dépôt applicatif dédié et migration du prototype historique

- Statut : accepté pour la reprise
- Date : 2026-08-04

## Contexte

La gouvernance d’Équilibre est versionnée dans `dalquier/App-perso`, tandis qu’un prototype historique Pyto/WebView existe dans `dalquier/Scriptable` sous les noms `TCC_Budy` et plusieurs instantanés horodatés. La cible produit retenue par ProjectOS est désormais une PWA installable sur iPhone, avec Pyto comme compagnon local.

Conserver le code applicatif dans `dalquier/App-perso` mélangerait la gouvernance de plusieurs projets et une application déployable. Utiliser `dalquier/Scriptable` comme dépôt canonique prolongerait une organisation historique contradictoire avec la cible PWA et exposerait le projet à des duplications.

## Décision

1. Le dépôt applicatif canonique d’Équilibre est un dépôt GitHub dédié nommé `dalquier/Equilibre`.
2. La gouvernance, le manifeste, les ADR, la roadmap et le script maître restent dans `dalquier/App-perso/ProjectOS/projects/Equilibre/`.
3. Le prototype `TCC_Budy` de `dalquier/Scriptable` reste une référence historique en lecture seule pendant BUILD-01.
4. BUILD-01 doit inventorier le prototype et classer chaque capacité dans une matrice : `réutiliser`, `adapter`, `réécrire`, `différer` ou `archiver`.
5. Aucun fichier historique n’est supprimé, renommé ou remplacé avant une migration vérifiée et documentée.
6. La PWA est l’interface principale. Pyto demeure un compagnon local pour les fichiers, exports, sauvegardes, anonymisation et utilitaires iPhone.
7. Replit Starter importe le dépôt `dalquier/Equilibre` pour l’exécution, les tests fonctionnels et le déploiement ; il ne devient pas une source de vérité.

## Conséquences

- Le dépôt `dalquier/Equilibre` doit être créé avant le premier commit applicatif.
- Sa branche `main` doit être initialisée sans code métier improvisé ni donnée personnelle.
- Le premier développement substantiel est réalisé par Codex sur `equilibre/build-01-minimal-pwa`.
- La migration ne cherche pas une compatibilité binaire avec Pyto : elle préserve les comportements utiles et les décisions de conception justifiées.
- Les références ProjectOS doivent distinguer clairement le dépôt de gouvernance, le dépôt applicatif et le dépôt historique.

## Retour arrière

Si la séparation en dépôt dédié crée un obstacle technique démontré avant le premier Build, une nouvelle ADR pourra remplacer cette décision. Aucun déplacement de code ne doit alors être effectué sans inventaire, comparaison et plan de retour arrière.
