# ProjectOS — Cycle de vie

## 1. Idée
Clarifier le problème, la valeur attendue, les utilisateurs et les contraintes.

## 2. Initialisation
Créer ou vérifier le registre, le manifeste, le dépôt canonique, la branche par défaut, la documentation minimale et le premier jalon.

Aucun nouveau Build substantiel ne commence tant que son emplacement canonique n’est pas vérifié.

## 3. Delivery Preflight

Avant toute première modification, appliquer `standards/ARTIFACT_DELIVERY_AND_RECOVERY.md` et vérifier :

- le dépôt, la référence de base, la branche cible et le SHA source ;
- le mécanisme de livraison réellement disponible dans l’environnement ;
- la compatibilité du canal avec les fichiers textuels et binaires prévus ;
- le plan de récupération si la publication principale échoue ;
- la preuve externe qui permettra de déclarer le résultat publié ou exporté.

Aucun travail ne commence sans canal de livraison réaliste. Dans Codex Cloud, la publication native sélectionnée dans l’interface constitue un canal valide même si le terminal ne possède pas de credentials Git ; sa réussite devra être confirmée après la tâche par la présence effective de la branche et de la Pull Request dans GitHub.

`/tmp` et tout stockage éphémère interne peuvent servir au calcul, jamais de destination finale d’un livrable.

## 4. Planification
Décomposer le travail en changements cohérents, définir les critères d’acceptation, les risques, les tests, le retour arrière et les artefacts de récupération attendus.

Classer le travail selon `standards/CODE_WORK_ROUTING.md` :

- travail limité : exécution directe possible par ChatGPT ;
- travail substantiel : implémentation obligatoire par Codex.

## 5. Exécution
Créer une branche dédiée, modifier le périmètre minimum nécessaire, conserver la compatibilité utile et documenter les décisions structurantes.

Pour un travail substantiel :

1. préparer un prompt Codex fondé sur les références vivantes ;
2. exécuter le développement dans Codex contre la branche GitHub dédiée ;
3. créer ou modifier les fichiers complets directement dans le dépôt canonique ;
4. éviter toute livraison principale sous forme de blocs de code, de fichiers temporaires ou de ZIP à recopier ;
5. préserver le diff et le commit produits jusqu’à confirmation de la récupération ou de la publication.

## 6. Vérification
Exécuter les tests pertinents, vérifier le parcours principal, la sécurité, la persistance, l’UX et les conditions réelles d’utilisation.

Pour une livraison Codex, vérifier également l’état vivant de la branche, des commits, des fichiers, des tests et de la Pull Request. Ne jamais valider sur la seule base d’un compte rendu textuel.

Vérifier séparément la qualité du résultat, la publiabilité du diff et la récupération effective des artefacts.

## 7. Livraison
Mettre à jour la documentation, ouvrir une Pull Request vers la branche canonique et présenter les preuves, limites et étapes restantes.

La branche GitHub et sa Pull Request constituent la livraison canonique. Les exports locaux servent uniquement à l’installation, au test ou à la sauvegarde.

En cas d’échec de publication, ne pas reconstruire le travail : préserver l’état existant et appliquer le plan de récupération prévu par `standards/ARTIFACT_DELIVERY_AND_RECOVERY.md`.

## 8. Exploitation
Surveiller les incidents, retours, dépendances et écarts entre documentation et réalité.

## 9. Évolution
Créer une nouvelle branche et répéter le cycle. Toute décision durable doit être reflétée dans le manifeste, une ADR ou un standard.

Tout nouveau Build est traité comme une évolution substantielle et passe par Codex, sauf exception explicite documentée.

## 10. Archivage
Marquer clairement le projet ou document comme archivé, préserver l’historique et empêcher son chargement comme référence active.

## Définition de terminé
Une modification est terminée lorsque le résultat attendu est vérifié, les tests sont exécutés ou justifiés, la documentation est cohérente, les risques sont signalés et une livraison traçable existe.

Pour un travail substantiel, la définition de terminé exige en plus :

- des fichiers complets présents dans le dépôt canonique ;
- une branche dédiée ;
- des preuves de test ;
- une Pull Request vérifiable ;
- aucune dépendance à une copie manuelle depuis la conversation pour reconstituer le projet ;
- une preuve de récupération hors de l’environnement producteur ;
- un état final nommé sans ambiguïté : construit, exporté, publié, livré ou intégré.
