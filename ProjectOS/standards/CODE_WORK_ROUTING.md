# ProjectOS — Routage des travaux de code

## 1. Principe obligatoire

GitHub est la source canonique du code. Les travaux de développement substantiels sont exécutés par Codex directement contre le dépôt canonique, sur une branche dédiée, puis livrés par Pull Request.

ChatGPT conçoit, cadre, décompose, pilote, relit et vérifie. Il ne remplace pas Codex pour produire dans la conversation un projet lourd, un Build complet ou une livraison multi-fichiers.

Replit, Pyto, Scriptable et les autres environnements servent à exécuter, tester, déployer ou exploiter le code selon leur rôle. Ils ne deviennent pas la source de vérité.

## 2. Déclenchement obligatoire de Codex

Le passage par Codex est obligatoire dès qu'au moins un des critères suivants est présent :

- création d'un nouveau projet logiciel ou d'un nouveau Build applicatif ;
- création ou modification coordonnée de plusieurs fichiers de code ;
- architecture modulaire, nouvelle couche technique ou nouvelle intégration ;
- refactoring substantiel ou réécriture d'un composant ;
- correction nécessitant une investigation dans plusieurs modules ;
- migration de structure, de données, de dépendances ou de plateforme ;
- ajout ou modification de tests couvrant plusieurs composants ;
- livraison trop volumineuse pour être fournie intégralement et vérifiée dans une seule réponse ;
- changement nécessitant une exécution, un débogage ou une validation approfondie dans le dépôt.

La taille apparente d'une demande ne suffit pas à la classer comme légère. Un changement court mais transversal, risqué ou architectural est un travail substantiel.

## 3. Travaux autorisés directement dans ChatGPT

ChatGPT peut réaliser directement :

- l'architecture, les spécifications, les critères d'acceptation et les plans de tests ;
- l'analyse, la revue de code et le diagnostic ;
- la rédaction ou la mise à jour de documentation ;
- un correctif trivial, local, réversible et limité à un seul fichier lorsque son comportement est compris ;
- une petite modification de configuration sans migration ni impact transversal ;
- la préparation d'un prompt Codex précis et vérifiable ;
- la vérification de la livraison Codex et la préparation de la décision de fusion.

Un correctif direct reste versionné dans GitHub sur une branche dédiée. Il ne doit pas être livré uniquement sous forme de fichier temporaire, de ZIP ou de bloc de code dans la conversation lorsque le dépôt canonique est accessible.

## 4. Précontrôle Codex obligatoire

Avant toute production de code substantielle, l'agent doit vérifier que la tâche s'exécute dans un environnement Codex relié au dépôt canonique.

Les contrôles bloquants sont :

1. le dépôt associé à l'environnement est exactement le dépôt canonique déclaré ;
2. l'accès Internet de l'agent est activé lorsque GitHub ou des dépendances distantes sont nécessaires ;
3. `origin` pointe vers le dépôt canonique ;
4. `origin/main` ou la branche canonique distante est réellement accessible et son SHA est relevé ;
5. le mécanisme Codex de publication d'une branche et de création d'une Pull Request est disponible ;
6. la tâche ne repose pas sur une copie locale ancienne comme source de vérité.

Un simple `git remote -v`, une branche locale ou un commit local ne prouve pas l'accès GitHub.

Si un contrôle échoue, l'agent doit s'arrêter avant d'écrire du code, signaler précisément le paramétrage manquant et classer la tâche `bloquée avant exécution`. Il ne doit pas produire un Build local en espérant le transmettre ensuite.

## 5. Séquence de travail pour un changement substantiel

1. Charger ProjectOS et identifier le projet dans `PROJECT_REGISTRY.md`.
2. Vérifier le dépôt canonique, la branche de référence et le manifeste.
3. Exécuter le précontrôle Codex obligatoire.
4. Créer une branche dédiée dans GitHub.
5. Définir le périmètre, les critères d'acceptation, les risques, les tests et le retour arrière.
6. Confier l'implémentation à Codex avec accès confirmé au dépôt et à la branche.
7. Exiger des fichiers complets, des tests exécutés et un compte rendu vérifiable.
8. Vérifier l'état vivant de la branche, du commit, des fichiers, des tests et de la Pull Request.
9. Relire la livraison, corriger les écarts si nécessaire et seulement ensuite proposer la fusion.

## 6. Règles de livraison

- La livraison canonique est constituée des commits distants de la branche et de la Pull Request.
- Les fichiers complets sont créés ou modifiés directement dans GitHub avec leur arborescence correcte.
- Un ZIP peut être ajouté sur une branche temporaire pour faciliter le téléchargement, mais ne remplace jamais l'arborescence GitHub.
- Un fichier local Pyto, un artefact Replit ou une copie iCloud peut faciliter l'installation ou le test, mais ne remplace jamais la livraison GitHub.
- Les changements lourds ne sont jamais fragmentés en une succession de blocs de code à recopier manuellement.
- Aucun projet ne doit être envoyé vers un dépôt ou un dossier non déclaré sans mise à jour préalable du registre et du manifeste.

Un Build substantiel n'est déclaré `livré` que si la branche distante, le commit, les fichiers et la Pull Request sont vérifiables. Sinon son état est `construit localement, non livré`.

## 7. Exceptions et incident en cours d'exécution

Le routage vers Codex peut être écarté uniquement si :

- Damien demande explicitement un autre mode d'exécution ;
- Codex est techniquement indisponible et le travail est urgent ;
- une contrainte de sécurité ou de plateforme l'interdit.

Dans ce cas, l'écart doit être annoncé, justifié et documenté. Le résultat doit malgré tout être versionné dans GitHub dès que possible.

Le mode `handoff-restreint` est réservé à une panne imprévisible survenue après un précontrôle réussi, ou à une demande explicite de Damien. Il ne remplace pas le précontrôle et ne justifie pas de commencer dans un environnement déjà connu comme incapable de livrer.

## 8. Test de décision rapide

Avant de produire du code, poser cette question :

> Ce travail crée-t-il un Build, touche-t-il plusieurs fichiers, modifie-t-il l'architecture ou nécessite-t-il une validation substantielle ?

- **Oui** : Codex obligatoire, précontrôle GitHub réussi, branche distante dédiée et Pull Request.
- **Non** : ChatGPT peut exécuter le changement limité, toujours dans GitHub lorsque le dépôt est accessible.
