# ProjectOS — Politique de toolchain frugale

## 1. Objectif

Préserver durablement l’usage du plan gratuit Replit Starter en séparant strictement le développement logiciel de l’exécution. La qualité, la traçabilité et la capacité de reprise priment sur la commodité d’un agent intégré à une plateforme d’hébergement.

## 2. Principe directeur

> Le code est conçu et produit avec ChatGPT et Codex, versionné et livré dans GitHub. Replit Starter reçoit le résultat versionné pour l’exécuter, le tester, le stocker comme environnement de travail et le déployer. Les crédits IA Replit sont une ressource exceptionnelle.

Cette règle s’applique à tous les projets logiciels pilotés par ProjectOS, sauf exception explicite, temporaire et documentée.

## 3. Rôle des outils

### ChatGPT

- clarifier le besoin et le résultat attendu ;
- concevoir l’architecture, l’expérience utilisateur et le modèle de données ;
- préparer les spécifications, plans, critères d’acceptation et prompts Codex ;
- réaliser les revues, audits et changements documentaires ou limités ;
- vérifier l’état vivant de GitHub avant toute décision dépendante.

### Codex

- réaliser les nouveaux Builds et changements substantiels ;
- modifier les projets multi-fichiers ;
- effectuer refactorings, migrations et débogages transversaux ;
- écrire et exécuter les tests associés ;
- travailler dans l’environnement relié au dépôt canonique ;
- produire un diff propre, un compte rendu et le texte proposé de Pull Request.

Dans Codex Cloud, le sandbox terminal et l’interface de publication sont deux couches distinctes. Le sandbox n’a pas besoin d’exposer un remote, un upstream ou des credentials Git. La branche et la Pull Request sont publiées après la tâche par le menu GitHub natif de Codex, conformément à `CODEX_NATIVE_PUBLISHING.md`.

### GitHub

- rester la source de vérité unique du code et de la documentation versionnable ;
- conserver branches, commits, Pull Requests, ADR, manifests, tests et preuves de livraison ;
- permettre à tout agent ou environnement de reprendre le projet sans dépendre de Replit.

### Replit Starter

Usage normal autorisé :

- cloner ou importer le dépôt GitHub canonique ;
- installer les dépendances et exécuter l’application ;
- réaliser des tests manuels et fonctionnels ;
- fournir un environnement cloud temporaire ;
- stocker l’espace de travail d’exécution ;
- héberger ou déployer une application lorsque pertinent.

Usage IA interdit par défaut :

- génération ordinaire de fonctionnalités ;
- refactoring, correction ou création de tests pouvant être réalisés par Codex ;
- conception d’architecture ou d’UX pouvant être réalisée par ChatGPT ;
- duplication d’un travail déjà réalisable contre GitHub.

Une utilisation de l’agent IA Replit n’est admise que si une capacité propre à Replit est indispensable, qu’aucune alternative raisonnable n’existe et que l’exception est signalée avant consommation des crédits.

### Pyto et Scriptable

- Pyto assure les scripts, utilitaires, accès locaux et fonctions iPhone natives en Python ;
- Scriptable assure les widgets et automatisations iOS pour lesquels JavaScript est approprié ;
- leurs sorties sont versionnées dans GitHub lorsqu’elles constituent du code durable.

### Working Copy

- fournit le client Git principal sur iPhone ;
- peut appliquer un patch de secours lorsque la publication native Codex échoue ;
- ne remplace pas GitHub comme source canonique.

### Google Drive et iCloud Drive

- Google Drive reçoit les documents collaboratifs, corpus et sauvegardes horodatées ;
- iCloud Drive reçoit les données locales et échanges avec Pyto ;
- aucun de ces stockages ne devient une branche parallèle du code.

### OpenAI API

- est utilisée uniquement comme composant des applications créées ;
- ne doit pas financer ou remplacer ChatGPT, Codex ou GitHub pendant le développement.

## 4. Flux de livraison standard

1. ChatGPT clarifie, conçoit et spécifie.
2. Damien sélectionne dans Codex le dépôt canonique et `main` comme branche de base.
3. Codex développe dans le sandbox fourni et produit un diff propre.
4. Codex exécute les tests et prépare le handoff ainsi que le texte de Pull Request.
5. Damien publie la branche et la Pull Request par le menu GitHub natif de Codex.
6. ChatGPT vérifie la livraison dans GitHub.
7. Replit récupère la branche ou le dépôt et exécute l’application.
8. Les tests réels, mobiles, fonctionnels ou de déploiement sont réalisés dans Replit lorsque pertinent.
9. Les anomalies repartent vers ChatGPT pour diagnostic ou Codex pour correction, jamais vers l’agent Replit par défaut.

## 5. Règles de maîtrise des coûts et de sécurité

- Ne jamais lancer l’agent Replit pour explorer une idée encore mal définie.
- Ne jamais demander à Replit de reconstruire un projet déjà présent dans GitHub.
- Préférer une livraison complète et testée par Codex à une série de petites générations Replit.
- Ne jamais placer un jeton GitHub ou un secret dans un prompt Codex.
- Ne pas lancer une authentification interactive GitHub dans un sandbox Codex Cloud.
- En cas d’échec de publication après construction, conserver le diff et utiliser le patch plutôt que reconstruire.
- Réserver les crédits Replit à une dépendance réellement spécifique à la plateforme.
- Surveiller les coûts d’API des applications séparément des coûts de développement.

## 6. Critères de conformité

Une livraison respecte cette politique lorsque :

- le code complet existe dans GitHub ;
- Replit peut être supprimé puis recréé depuis le dépôt sans perte du projet ;
- aucun changement durable n’existe uniquement dans l’espace de travail Replit ;
- les tests et limites sont documentés ;
- l’agent IA Replit n’a pas été utilisé, ou son exception est explicitement justifiée ;
- `main` n’a pas été modifiée directement ;
- la Pull Request n’a pas été fusionnée sans validation.

## 7. Exception

Toute exception doit préciser : le besoin propre à Replit, les alternatives écartées, le coût ou quota estimé, le périmètre exact et la manière dont le résultat sera reversé dans GitHub.