# ADR-001 — Toolchain de développement frugale

- Statut : accepté
- Date : 2026-07-28
- Portée : tous les projets logiciels gouvernés par ProjectOS

## Contexte

Le plan Replit Starter fournit un environnement pratique d’exécution et de déploiement, mais son agent IA gratuit repose sur un quota limité. Les projets pilotés par ProjectOS nécessitent des développements multi-fichiers, des itérations nombreuses, des tests et une traçabilité durable. Utiliser l’agent Replit comme développeur principal consommerait rapidement ce quota et créerait un risque de dépendance à un environnement non canonique.

ProjectOS dispose déjà d’une séparation naturelle des responsabilités : ChatGPT pour la conception et le pilotage, Codex pour le développement substantiel, GitHub comme source de vérité et Replit comme environnement cloud.

## Décision

ChatGPT et Codex deviennent les seuls outils de développement par défaut :

- ChatGPT conçoit, spécifie, pilote, documente et révise ;
- Codex implémente les Builds et changements substantiels, avec tests et Pull Request ;
- GitHub conserve et livre l’intégralité du code et des références versionnées ;
- Replit Starter est réservé à l’import du dépôt, l’exécution, les tests fonctionnels, le stockage de l’espace de travail, l’hébergement et le déploiement.

L’agent IA Replit ne doit pas être utilisé pour les travaux ordinaires réalisables avec ChatGPT ou Codex. Une exception exige une capacité spécifique à Replit, l’absence d’alternative raisonnable et une justification explicite.

## Conséquences positives

- conservation durable du plan Replit Starter ;
- réduction de la dépendance à un fournisseur d’exécution ;
- code toujours reconstructible depuis GitHub ;
- meilleure traçabilité des changements ;
- répartition claire des responsabilités ;
- possibilité de changer ultérieurement d’hébergeur sans perdre le projet.

## Conséquences négatives

- nécessité de synchroniser correctement GitHub et Replit ;
- diagnostic parfois réparti entre plusieurs outils ;
- besoin de reverser dans GitHub toute correction manuelle réalisée pendant un test ;
- certaines intégrations propres à Replit peuvent demander une exception ponctuelle.

## Alternatives rejetées

### Replit comme environnement principal de développement

Rejeté en raison du quota IA Starter, du risque de verrouillage et de la possibilité de laisser des changements uniquement dans l’espace Replit.

### Développement principalement manuel dans Replit

Rejeté comme flux par défaut sur iPhone : moins efficace pour les changements substantiels et moins robuste que le travail versionné par Codex contre GitHub.

### OpenAI API pour assister le développement

Rejeté : l’API est réservée aux fonctionnalités des applications créées et ne doit pas remplacer ChatGPT ou Codex pendant leur construction.

## Règles de vérification

Une application doit pouvoir être recréée dans Replit depuis son dépôt GitHub sans dépendre d’un historique de conversation avec l’agent Replit. Tout changement durable réalisé pendant l’exécution ou les tests doit être reporté sur une branche GitHub et livré par Pull Request.