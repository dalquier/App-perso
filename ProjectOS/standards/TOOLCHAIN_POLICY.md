# ProjectOS — Politique de toolchain frugale

## 1. Objectif

Préserver durablement l’usage du plan gratuit Replit Starter en séparant strictement le développement logiciel de l’exécution. La qualité, la traçabilité et la capacité de reprise priment sur la commodité d’un agent intégré à une plateforme d’hébergement.

## 2. Principe directeur

> Le code est conçu et produit avec ChatGPT et Codex, versionné et livré dans GitHub. Chaque projet conserve une seule application Replit canonique : elle est créée par un import initial qualifié, puis reçoit les versions suivantes par synchronisation Git pour les tester et les publier sans réimport. Les crédits IA Replit sont une ressource exceptionnelle soumise à une autorisation ponctuelle.

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

Usage normal autorisé sans agent IA **après qualification du runtime conformément à `REPLIT_RUNTIME_CONTRACT.md`** :

- réutiliser l’application Replit canonique déjà qualifiée et propre ;
- effectuer l’unique import initial du dépôt GitHub canonique uniquement si le `REPLIT IMPORT/SETUP CAPABILITY GATE` est `ADMISSIBLE` ;
- synchroniser ensuite les branches/SHA par le Git pane ou une commande Git déterminée, sans nouvel import ;
- conserver la version publiée stable pendant la validation d’une candidate en Preview avec données fictives ou isolées ;
- installer les dépendances et exécuter l’application lorsque la commande canonique reste effectivement gouvernante ;
- utiliser le Shell pour des commandes déterminées et non exploratoires ;
- consulter les logs, reproduire une anomalie et relever les preuves ;
- réaliser des tests manuels et fonctionnels ;
- effectuer les opérations Git mécaniques nécessaires pour récupérer une branche dans un runtime déjà qualifié ;
- redémarrer, héberger ou déployer une application lorsque pertinent ;
- stocker l’espace de travail d’exécution temporaire.

Un import ou setup Replit n’est **pas** considéré comme une opération mécanique gratuite par défaut. Le `REPLIT IMPORT/SETUP CAPABILITY GATE` s’applique avant la création initiale ou une recréation exceptionnelle, pas à chaque version. Si le setup démarre/requiert Agent ou si refuser Agent bloque le Run/Preview nominal, ce chemin est incompatible avec l’usage normal sans Agent. Une fois l’application canonique créée, une mise à jour ordinaire passe exclusivement par Git ; l’apparition de `Set up the imported project` impose un arrêt et un diagnostic, jamais un réimport réflexe.

L’import ZIP ne doit jamais être utilisé comme contournement improvisé d’un import GitHub : il possède son propre comportement de setup et doit être qualifié séparément. En août 2026, le flux ZIP Replit observé/documenté est incompatible par défaut avec la politique sans Agent ; toute évolution ultérieure doit être re-vérifiée avant usage.

Usage IA interdit par défaut :

- génération ordinaire de fonctionnalités ;
- refactoring, correction ou création de tests pouvant être réalisés par Codex ;
- analyse, exploration, planification ou diagnostic pouvant être réalisés par ChatGPT ou Codex ;
- conception d’architecture ou d’UX pouvant être réalisée par ChatGPT ;
- duplication d’un travail déjà réalisable contre GitHub ;
- utilisation de l’agent pour une opération Git, un redémarrage, une lecture de logs ou une modification mécanique déjà déterminée ;
- lancement parallèle de l’agent Replit sur des fichiers également modifiés par ChatGPT, Codex ou un humain ;
- accepter un setup Agent automatique d’import uniquement pour « faire marcher Run » sans exception IA Replit préalablement autorisée.

Les modes de conversation, de planification, d’analyse, de setup ou de modification de l’agent Replit sont tous considérés comme un usage d’IA Replit. Aucun mode ne doit être supposé gratuit ou négligeable.

Une utilisation de l’agent IA Replit n’est admise que si toutes les conditions suivantes sont réunies :

1. la tâche dépend d’une capacité exclusive ou intrinsèquement spécifique à Replit ;
2. ChatGPT, Codex, GitHub direct, un runtime déjà qualifié et une opération manuelle déterminée ne peuvent pas raisonnablement obtenir le même résultat ;
3. le périmètre exact, le mode prévu, le coût relatif et un plafond de consommation sont annoncés avant l’exécution ;
4. Damien donne une autorisation explicite pour cette tâche précise après avoir reçu ces informations ;
5. le mode le moins coûteux capable de réussir est sélectionné ; les modes accélérés ou intensifs sont interdits sans justification et autorisation spécifiques ;
6. tout changement durable est reversé immédiatement dans une branche GitHub et une Pull Request vérifiable.

L’autorisation est ponctuelle : elle ne vaut ni pour une tâche suivante, ni pour une relance, ni pour une extension du périmètre. Toute relance payante exige une nouvelle évaluation et une nouvelle autorisation.

### Canal temporaire de continuité QA

Lorsqu’un besoin de validation ne dépend pas spécifiquement de Replit et que la création/récupération Replit disponible est `INCOMPATIBLE` ou `UNKNOWN`, ProjectOS ne doit pas bloquer le Build ni multiplier les imports. Il peut utiliser temporairement un autre canal de Preview/QA si :

- GitHub reste la source canonique ;
- le SHA ou l’inventaire exact reproduit est connu ;
- le périmètre de preuve est annoncé (par exemple QA visuelle uniquement) ;
- ce résultat n’est jamais présenté comme `REPLIT VALIDATED` ;
- les éléments de chrome injectés par la plateforme sont distingués de l’application ;
- tout changement durable repasse par ChatGPT/Codex → GitHub ;
- ce canal ne devient ni la cible opérationnelle ni un substitut silencieux à l’application Replit canonique.

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
2. Damien sélectionne dans Codex le dépôt canonique et la branche de base attendue.
3. Codex développe dans le sandbox fourni et produit un diff propre.
4. Codex exécute les tests et prépare le handoff ainsi que le texte de Pull Request.
5. Damien publie la branche et la Pull Request par le menu GitHub natif de Codex.
6. ChatGPT vérifie la livraison dans GitHub.
7. Si une validation Replit est requise, ChatGPT applique `REPLIT_RUNTIME_CONTRACT.md`.
8. Si l’application Replit canonique existe, elle récupère mécaniquement le SHA/branche attendu par Git, sans Agent et sans nouvel import.
9. Si elle n’existe pas ou doit exceptionnellement être recréée, appliquer d’abord le `REPLIT IMPORT/SETUP CAPABILITY GATE` ; un chemin `INCOMPATIBLE` ne doit pas être répété.
10. La candidate s’exécute dans la Preview de l’application canonique avec données fictives ou isolées ; la version publiée stable et ses données réelles restent inchangées.
11. Après CI, recette, sauvegarde/migration applicable et rollback prouvé sur le même SHA, publier dans cette même application et enregistrer le nouveau Last Known Good.
12. Si la récupération Replit est bloquée, utiliser seulement un canal temporaire borné sans présenter le résultat comme validation Replit ni changer de cible opérationnelle.
13. Les observations de runtime fournissent uniquement les faits utiles : parcours reproduit, captures, logs, commande exécutée, SHA/version et résultat.
14. Les anomalies repartent vers ChatGPT pour diagnostic ou Codex pour correction.
15. Le correctif revient par GitHub, puis l’application canonique le récupère et le reteste.

Le cycle normal ne contient aucun prompt adressé à l’agent Replit. Il contient un import initial au maximum, puis des synchronisations Git ; aucune mise à jour par réimport ou recréation.

## 5. Règles de maîtrise des coûts et de sécurité

- Ne jamais lancer l’agent Replit pour explorer une idée encore mal définie.
- Ne jamais utiliser l’agent Replit pour demander seulement un avis, un plan ou une analyse.
- Ne jamais demander à Replit de reconstruire un projet déjà présent dans GitHub.
- Ne jamais supposer que l’import initial Replit sera passif ou respectera immédiatement le `.replit` versionné ; vérifier le Capability Gate.
- Ne jamais utiliser un nouvel import pour mettre à jour une application canonique existante.
- Ne jamais répéter un import `INCOMPATIBLE` pour essayer de contourner le setup automatique.
- Ne jamais remplacer la version publiée stable avant validation du même SHA, de la conservation des données et du rollback.
- Préférer une livraison complète et testée par Codex à une série de petites générations Replit.
- Préférer un test manuel déterminé à un test généré par l’agent lorsque le parcours est déjà connu.
- Ne jamais placer un jeton GitHub ou un secret dans un prompt Codex ou Replit.
- Ne pas lancer une authentification interactive GitHub dans un sandbox Codex Cloud.
- En cas d’échec de publication après construction, conserver le diff et utiliser le patch plutôt que reconstruire.
- Réserver les crédits Replit à une dépendance réellement spécifique à la plateforme et préalablement autorisée.
- Ne jamais relancer automatiquement une tâche IA Replit échouée ou incomplète.
- Surveiller les coûts d’API des applications séparément des coûts de développement.

## 6. Critères de conformité

Une livraison respecte cette politique lorsque :

- le code complet existe dans GitHub ;
- une seule application Replit canonique est identifiée par projet ;
- le canal Replit, lors de sa création ou recréation, possède un Capability Gate admissible ou une exception Agent explicitement autorisée ;
- les versions ordinaires arrivent dans cette application par Git sans réimport ;
- une version publiée stable, un SHA/tag Last Known Good, une frontière de données et un rollback sont documentés ;
- Replit peut être supprimé puis recréé depuis le dépôt sans perte du projet **lorsqu’un chemin de recréation admissible existe** ; sinon la limitation est documentée sans dégrader GitHub ;
- aucun changement durable n’existe uniquement dans l’espace de travail Replit ;
- les tests et limites sont documentés ;
- aucun prompt n’a été adressé à l’agent IA Replit, ou l’exception ponctuelle est explicitement justifiée et autorisée ;
- le coût relatif, le plafond, le périmètre et le mode de l’exception sont consignés ;
- le résultat produit dans Replit est reversé dans GitHub ;
- `main` n’a pas été modifiée directement ;
- la Pull Request n’a pas été fusionnée sans validation.

## 7. Exception IA Replit

Avant toute exception, afficher et compléter le bloc suivant :

```text
EXCEPTION IA REPLIT
Capacité exclusive à Replit :
Résultat attendu :
Alternatives écartées et raisons :
Périmètre exact :
Mode Replit prévu :
Coût relatif estimé :
Plafond de consommation :
Condition d’arrêt :
Retour prévu dans GitHub :
Autorisation de Damien : EN ATTENTE
```

L’agent ne doit pas fournir ni exécuter le prompt Replit tant que l’autorisation reste `EN ATTENTE`.

Après exécution, consigner la consommation observable, le résultat, les limites, les fichiers concernés et la branche ou Pull Request de retour. En l’absence de mesure fiable, indiquer `coût non vérifiable` et ne pas présenter l’opération comme optimisée.

## 8. Optimisation systématique des crédits

Le standard `ProjectOS/standards/CREDIT_OPTIMIZATION.md` est obligatoire pour toute recommandation d’outil et pour tout prompt opérationnel remis à Damien.

Avant chaque prompt destiné à un outil, l’agent doit préciser au minimum :

- l’outil recommandé ;
- la raison principale du choix ;
- le coût relatif estimé ;
- l’alternative moins coûteuse évaluée ;
- la condition observable justifiant une bascule vers un autre outil.

L’agent doit privilégier l’outil le moins coûteux capable d’atteindre le résultat vérifiable requis, sans sacrifier la qualité, la sécurité, les tests, la traçabilité ou la livraison.

Un prompt ne doit pas être transmis à Codex, Replit ou un autre outil coûteux tant que son périmètre n’est pas suffisamment défini pour éviter les itérations exploratoires inutiles.

Pour Replit, la règle est plus stricte : l’absence d’une capacité exclusive démontrée et d’une autorisation ponctuelle explicite interdit tout prompt à l’agent IA. L’apparition automatique d’une tâche Agent lors d’un import ne vaut jamais autorisation.
