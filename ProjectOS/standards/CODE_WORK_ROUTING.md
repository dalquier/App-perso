# ProjectOS — Routage des travaux de code

## 1. Principe obligatoire

GitHub est la source canonique du code. Les travaux de développement substantiels sont exécutés par Codex contre le dépôt canonique, sur une branche dédiée, puis livrés par Pull Request ou, lorsque l’environnement ne peut pas publier, par un handoff restreint récupérable repris ensuite par l’agent coordinateur.

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

Avant toute production substantielle, l’agent vérifie que la tâche s’exécute dans un environnement relié au dépôt canonique et identifie le mécanisme réel de publication.

Les contrôles sont :

1. le dépôt associé à l'environnement est exactement le dépôt canonique déclaré ;
2. l'accès Internet de l'agent est activé lorsque GitHub ou des dépendances distantes sont nécessaires ;
3. `origin` pointe vers le dépôt canonique ;
4. `origin/main` ou la branche canonique distante est réellement accessible et son SHA est relevé ;
5. la base locale n’est pas obsolète ;
6. l’une des méthodes de sortie suivantes est disponible :
   - publication native Codex ou plateforme vers GitHub ;
   - écriture Git/GitHub CLI avec credentials ;
   - handoff restreint réellement récupérable.

Le précontrôle doit distinguer :

- **lecture distante disponible** ;
- **écriture terminal indisponible faute de credentials** ;
- **publication native de la plateforme disponible ou non** ;
- **handoff récupérable disponible ou non**.

Un simple `git remote -v`, une branche locale ou un commit local ne prouve pas l'accès GitHub. Un `git push --dry-run` refusé ne prouve pas non plus que la publication native Codex est impossible.

Si aucune méthode de sortie n’est disponible, l’agent s’arrête avant d’écrire du code et classe la tâche `bloquée avant exécution`.

Si GitHub est lisible mais que le terminal n’a pas de credentials, l’agent poursuit selon l’un des deux cas :

- il utilise la publication native Codex ou plateforme puis vérifie la branche et la PR dans GitHub ;
- à défaut, il annonce le mode `handoff-restreint`, produit un artefact récupérable et laisse l’agent coordinateur publier la branche et la PR.

## 5. Séquence de travail pour un changement substantiel

1. Charger ProjectOS et identifier le projet dans `PROJECT_REGISTRY.md`.
2. Vérifier le dépôt canonique, la branche de référence et le manifeste.
3. Exécuter le précontrôle des capacités de lecture, publication et transfert.
4. Choisir explicitement le mode : `github-natif`, `github-cli` ou `handoff-restreint`.
5. Créer une branche dédiée dans GitHub ou une branche locale dédiée selon le mode.
6. Définir le périmètre, les critères d'acceptation, les risques, les tests et le retour arrière.
7. Réaliser l’implémentation ou la production documentaire.
8. Exiger des fichiers complets, des tests exécutés et un compte rendu vérifiable.
9. Publier via la plateforme, Git/CLI ou transmettre un handoff récupérable.
10. Vérifier l'état vivant de la branche, du commit, des fichiers, des tests et de la Pull Request lorsqu’ils existent.
11. Relire la livraison, corriger les écarts si nécessaire et seulement ensuite proposer la fusion.

## 6. Règles de livraison

- La livraison canonique finale est constituée des commits distants de la branche et de la Pull Request.
- Les fichiers complets sont créés ou modifiés dans leur arborescence correcte.
- Une publication native Codex est valide uniquement après vérification dans GitHub.
- Un handoff restreint doit être réellement téléchargeable ou visible par l’agent coordinateur.
- Un ZIP peut faciliter le transfert, mais ne remplace jamais l’arborescence GitHub après reprise.
- Un fichier local Pyto, un artefact Replit ou une copie iCloud peut faciliter l'installation ou le test, mais ne remplace jamais la livraison GitHub finale.
- Les changements lourds ne sont jamais fragmentés en une succession de blocs de code à recopier manuellement lorsqu’un artefact complet peut être fourni.
- Aucun projet ne doit être envoyé vers un dépôt ou un dossier non déclaré sans mise à jour préalable du registre et du manifeste.

Un Build substantiel n'est déclaré `livré dans GitHub` que si la branche distante, le commit, les fichiers et la Pull Request sont vérifiables. Un handoff accessible mais non repris est déclaré `transmis, publication GitHub en attente`. Un artefact laissé seulement dans un workspace inaccessible reste `construit localement, non transmis`.

## 7. Exceptions et environnement restreint

Le routage vers Codex peut être écarté uniquement si :

- Damien demande explicitement un autre mode d'exécution ;
- Codex est techniquement indisponible et le travail est urgent ;
- une contrainte de sécurité ou de plateforme l'interdit.

Dans ce cas, l'écart doit être annoncé, justifié et documenté. Le résultat doit malgré tout être versionné dans GitHub dès que possible.

Le mode `handoff-restreint` est une voie de livraison prévue pour les environnements en lecture seule, sans credentials terminal ou sans publication native. Il doit être annoncé au précontrôle, produire un artefact autonome et ne jamais être présenté comme une Pull Request déjà publiée.

## 8. Test de décision rapide

Avant de produire du code, poser ces deux questions :

> Ce travail crée-t-il un Build, touche-t-il plusieurs fichiers, modifie-t-il l'architecture ou nécessite-t-il une validation substantielle ?

- **Non** : ChatGPT peut exécuter le changement limité, toujours dans GitHub lorsque le dépôt est accessible.
- **Oui** : Codex obligatoire.

Puis :

> Quel mécanisme permet de transmettre réellement le résultat ?

- **Publication native ou Git/CLI autorisé** : branche distante et Pull Request.
- **Lecture seule mais artefact récupérable** : handoff restreint, puis reprise par le coordinateur.
- **Aucun transfert possible** : blocage avant exécution.
