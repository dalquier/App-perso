# ProjectOS — Optimisation de la consommation de crédits

## 1. Objectif

Réduire la consommation inutile de crédits, quotas et appels payants sans dégrader la qualité, la sécurité, la traçabilité ni la capacité de livraison.

L’optimisation porte sur les crédits IA, les quotas d’exécution, les appels API, les ressources cloud et les manipulations humaines répétitives.

## 2. Principe directeur

> Utiliser l’outil le moins coûteux capable d’obtenir un résultat vérifiable au niveau de qualité requis.

Le coût ne prime jamais sur :

- la sécurité ;
- l’intégrité des données ;
- la qualité minimale attendue ;
- la traçabilité GitHub ;
- la capacité de récupération ;
- la nécessité d’un test réel.

## 3. Obligation avant chaque prompt opérationnel

Avant de fournir à Damien un prompt destiné à ChatGPT, Codex, Replit, Pyto, Scriptable, GitHub, Working Copy, Canva, AppDeploy ou un autre outil, l’agent doit afficher un bloc court :

```text
OUTIL RECOMMANDÉ
Outil : <nom>
Pourquoi : <raison principale>
Coût relatif : gratuit / faible / moyen / élevé / inconnu
Alternative moins coûteuse : <outil ou aucune>
Condition de bascule : <événement justifiant un autre outil>
```

Ce bloc précède immédiatement le prompt. Il ne doit pas être fusionné dans le prompt destiné à l’outil.

Lorsque plusieurs outils sont nécessaires, indiquer une séquence ordonnée et attribuer à chacun un rôle précis.

## 4. Hiérarchie par type de tâche

### Clarification, cadrage, architecture, UX, rédaction et pilotage

Outil par défaut : ChatGPT.

Utiliser ChatGPT pour :

- clarifier un besoin ;
- concevoir une solution ;
- préparer une spécification ;
- produire un prompt Codex ;
- analyser un retour de test ;
- relire une Pull Request ;
- effectuer une modification documentaire limitée.

Ne pas mobiliser Codex ou Replit tant que le besoin reste ambigu.

### Développement substantiel

Outil par défaut : Codex.

Codex est requis pour :

- un nouveau Build ;
- une modification multi-fichiers ;
- un refactoring substantiel ;
- une migration ;
- une correction transversale ;
- des tests automatisés liés au dépôt.

Regrouper les changements cohérents dans un prompt complet plutôt que multiplier les petites tâches fragmentées.

### Exécution, test réel, hébergement et déploiement

Outil par défaut : Replit Starter sans agent IA.

Utiliser Replit pour :

- exécuter l’application ;
- installer les dépendances ;
- réaliser des tests fonctionnels ;
- fournir une URL de test ;
- héberger ou déployer.

L’agent IA Replit reste interdit par défaut. Une exception exige une capacité propre à Replit, aucune alternative raisonnable et une justification avant consommation.

### Fonctions iPhone locales

- Pyto : scripts Python, traitement de fichiers, fonctions locales et automatisations natives compatibles.
- Scriptable : widgets et automatisations JavaScript iOS.
- Raccourcis : orchestration simple entre applications sans code lorsque cela suffit.

Choisir Raccourcis avant Pyto ou Scriptable lorsqu’un flux natif simple répond entièrement au besoin.

### Versionnement et livraison

- GitHub : source de vérité, branche, commit, Pull Request, revue et preuve de livraison.
- Working Copy : opérations Git manuelles sur iPhone et récupération de secours.

Ne jamais utiliser un outil IA pour une opération Git mécanique déjà déterminée lorsqu’un outil Git direct suffit.

### Documents, visuels et interfaces

- ChatGPT : contenu, structure, brief et critères.
- Canva : création ou modification visuelle lorsque le résultat attendu est un design.
- AppDeploy : application web publique lorsqu’un prototype réellement déployé est requis.

Ne pas utiliser Canva pour produire du texte seul, ni AppDeploy pour une maquette statique.

### Stockage

- GitHub : code et documentation versionnée.
- Google Drive : documents collaboratifs, archives brutes et sauvegardes.
- iCloud Drive : fichiers locaux iPhone et échanges avec Pyto.
- Replit : environnement d’exécution temporaire, jamais source canonique.

## 5. Règles anti-gaspillage

- Ne pas envoyer à Codex une demande encore ambiguë.
- Ne pas demander à plusieurs outils de reconstruire la même solution en parallèle sans objectif comparatif explicite.
- Ne pas utiliser l’agent Replit pour corriger du code que Codex peut corriger dans GitHub.
- Ne pas fragmenter artificiellement un Build en nombreux prompts indépendants.
- Ne pas recharger des corpus entiers lorsque quelques fichiers ciblés suffisent.
- Ne pas répéter un test coûteux lorsqu’un résultat récent et pertinent existe, sauf changement susceptible de l’invalider.
- Ne pas utiliser une API payante pour une tâche réalisable localement ou avec un service déjà inclus.
- Ne pas reconstruire après un échec de publication : préserver le diff et appliquer le plan de récupération.
- Préférer une opération mécanique directe à un agent IA pour renommer, déplacer, copier, zipper, comparer ou publier lorsque les paramètres sont déjà connus.

## 6. Niveaux de coût relatif

### Gratuit

Fonction incluse sans consommation marginale identifiable dans l’usage courant : lecture GitHub, opération Git directe, Raccourcis local, traitement local simple.

### Faible

Interaction courte avec ChatGPT, appel ciblé à un connecteur, petit traitement local ou action mécanique.

### Moyen

Tâche Codex bornée, génération visuelle limitée, analyse de plusieurs fichiers ou exécution cloud modérée.

### Élevé

Agent Replit, tâche longue et exploratoire, nombreuses générations, appels API répétés, déploiement lourd ou traitement volumineux.

### Inconnu

Tarification, quota ou consommation non vérifiable. Dans ce cas, le signaler et préférer une alternative connue lorsque la qualité reste suffisante.

## 7. Règle de décision

Avant de recommander un outil, évaluer dans cet ordre :

1. résultat attendu ;
2. niveau de risque ;
3. besoin réel d’exécution ;
4. caractère limité ou substantiel ;
5. capacité de livraison ;
6. coût relatif ;
7. alternative moins coûteuse ;
8. condition de bascule.

## 8. Stratégie de bascule

Commencer avec l’outil recommandé le moins coûteux. Basculer uniquement lorsqu’un critère observable est atteint, par exemple :

- ChatGPT vers Codex : le périmètre devient multi-fichiers ou nécessite des tests du dépôt ;
- Codex vers Replit : le code doit être exécuté dans l’environnement cloud réel ;
- Replit sans IA vers agent Replit : une capacité exclusive de la plateforme est démontrée ;
- Raccourcis vers Pyto ou Scriptable : la logique native ne suffit plus ;
- GitHub direct vers Working Copy : la publication automatisée échoue mais le diff est récupérable.

## 9. Critères de conformité

Une tâche est conforme lorsque :

- l’outil recommandé a été annoncé avant chaque prompt opérationnel ;
- le choix est justifié par le résultat attendu et non par habitude ;
- une alternative moins coûteuse a été évaluée ;
- la condition de bascule est explicite ;
- aucune duplication inutile n’a été lancée ;
- les crédits Replit IA n’ont pas été consommés sans exception documentée ;
- la qualité, les tests et la livraison n’ont pas été sacrifiés pour réduire le coût.

## 10. Formulation compacte autorisée

Pour les demandes simples, le bloc peut être réduit à :

```text
Outil recommandé : <outil> — <raison>. Coût relatif : <niveau>. Bascule vers <outil> seulement si <condition>.
```

Cette formulation reste obligatoire avant le prompt lui-même.
