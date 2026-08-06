# ProjectOS — Moteur de décision

## Séquence

1. Identifier le résultat attendu.
2. Vérifier les références vivantes.
3. Déterminer le niveau de risque et de réversibilité.
4. Classer le travail comme limité ou substantiel selon `standards/CODE_WORK_ROUTING.md`.
5. Après résolution du régime de mémoire, appliquer `standards/PARALLEL_EXECUTION.md` et distinguer les vérifications internes parallélisables des flux visibles soumis à autorisation.
6. Appliquer `standards/TOOLCHAIN_POLICY.md`.
7. Choisir l’outil le plus direct et fiable.
8. Réaliser le plus petit changement cohérent.
9. Vérifier le résultat avec des preuves.
10. Documenter et livrer.

## Décision de parallélisation

- Les lectures, recherches et vérifications internes sans effet de bord peuvent être exécutées en parallèle automatiquement lorsqu’elles sont peu coûteuses et sans ressource mutable commune.
- Plusieurs tâches, agents, conversations, branches ou livrables visibles ne sont lancés en parallèle qu’après application complète de `standards/PARALLEL_EXECUTION.md` et réponse positive de Damien à la question canonique.
- Une dépendance, un fichier partagé, une branche partagée, une ressource mutable commune ou l’absence de coordinateur impose une exécution séquentielle.
- Le diagnostic précède toujours la correction lorsque le contenu du correctif dépend du diagnostic.

## Choix des outils

- ChatGPT : architecture, analyse, pilotage, rédaction, revue et changements limités.
- Codex : outil obligatoire pour les nouveaux Builds, les projets multi-fichiers, le développement substantiel, les refactorings, les migrations, le débogage transversal et les tests associés.
- GitHub : source de vérité, branches, revue et livraison.
- Replit Starter sans IA : import du dépôt, exécution cloud, tests fonctionnels, consultation des logs, stockage de l’espace de travail, hébergement et déploiement.
- Agent IA Replit : interdit par défaut ; usage ponctuel uniquement après franchissement de la barrière d’exception et autorisation explicite de Damien.
- Pyto : fonctions iPhone natives, automatisation locale, fichiers et utilitaires.
- Working Copy : opérations Git sur iPhone.
- Google Drive : documents collaboratifs et sauvegardes, jamais source canonique du code.
- OpenAI API : uniquement comme composant des applications créées.

## Règle de routage du code

Avant toute production de code, appliquer le test suivant :

> Le travail crée-t-il un Build, touche-t-il plusieurs fichiers, modifie-t-il l’architecture, réalise-t-il une migration ou nécessite-t-il une validation substantielle ?

- **Oui** : l’implémentation passe par Codex, sur une branche GitHub dédiée, avec tests et Pull Request.
- **Non** : ChatGPT peut réaliser le changement limité, à condition qu’il reste local, réversible, compris et versionné dans GitHub.

Un travail substantiel ne doit pas être dégradé en succession de blocs de code, fichiers temporaires ou ZIP à recopier manuellement lorsque le dépôt canonique et Codex sont accessibles.

L’outil de construction et le lieu de vérité sont distincts : ChatGPT conçoit, Codex construit, Replit exécute et teste sans IA, Pyto valide les fonctions iPhone, GitHub conserve et livre.

## Flux de diagnostic et de correction

Pour toute anomalie observée dans Replit :

1. reproduire le problème sans agent IA ;
2. relever le parcours, les captures, les logs et le résultat observable ;
3. transmettre ces preuves à ChatGPT pour diagnostic ;
4. router vers Codex si la correction est substantielle ;
5. publier le correctif dans GitHub ;
6. récupérer la branche dans Replit sans agent IA ;
7. retester et consigner le résultat.

Une anomalie observée dans Replit ne justifie pas automatiquement l’utilisation de son agent IA.

## Barrière préalable à toute utilisation de l’agent IA Replit

Avant tout prompt, plan, analyse, diagnostic, modification ou relance confié à l’agent Replit, vérifier successivement :

1. **Capacité exclusive** : la tâche dépend-elle réellement d’une capacité propre à Replit, et non de la simple présence du code ou des logs dans Replit ?
2. **Alternatives** : ChatGPT, Codex, GitHub direct, le Shell Replit sans IA ou une opération manuelle déterminée sont-ils insuffisants ?
3. **Périmètre** : le résultat attendu, les fichiers ou ressources concernés et la condition d’arrêt sont-ils bornés ?
4. **Coût** : le mode le moins coûteux, le coût relatif et un plafond de consommation ont-ils été annoncés ?
5. **Livraison** : tout résultat durable peut-il être reversé dans une branche GitHub et une Pull Request vérifiable ?
6. **Autorisation** : Damien a-t-il explicitement autorisé cette tâche précise après présentation du bloc `EXCEPTION IA REPLIT` défini dans `standards/TOOLCHAIN_POLICY.md` et `standards/CREDIT_OPTIMIZATION.md` ?

Si une réponse est négative ou inconnue, ne pas utiliser l’agent IA Replit.

Une autorisation antérieure ne s’étend jamais à une nouvelle tâche, une relance, un changement de mode ou un élargissement de périmètre.

## Arbitrages

- Fiabilité avant rapidité pour les opérations destructives.
- Solution simple avant architecture prématurément complexe.
- Réutilisation avant duplication, sans créer d’abstraction sans besoin réel.
- Données locales et minimales avant collecte ou synchronisation excessive.
- Expérience native avant contournement WebView fragile sur iPhone.
- Livraison canonique GitHub avant commodité d’un fichier local.
- Codex avant génération conversationnelle lorsque le périmètre est substantiel.
- ChatGPT ou Codex avant l’agent IA Replit.
- Replit sans IA avant tout usage de l’agent Replit.
- Opération mécanique directe avant agent IA.
- Une itération mieux spécifiée avant plusieurs essais coûteux.
- Parallélisation utile avant séquentialité par défaut, mais uniquement lorsque les flux sont autonomes, exclusifs et coordonnés.

## Risque

- Faible : documentation, analyse, changement local réversible.
- Moyen : modification de comportement, migration limitée, dépendance nouvelle.
- Élevé : suppression, sécurité, secrets, données, production, branche canonique.

Pour un risque élevé : sauvegarde, branche dédiée, plan de retour arrière et validation renforcée obligatoires.

Toute utilisation de l’agent IA Replit avec coût non prévisible est traitée comme un risque financier élevé jusqu’à preuve contraire.

## Contradictions

Appliquer l’ordre d’autorité de `BOOTSTRAP.md`. Signaler la contradiction, choisir la règle la plus spécifique et récente dans son périmètre, puis documenter toute décision durable.

## Incertitude

Ne pas inventer. Vérifier lorsque possible. Sinon distinguer explicitement fait, hypothèse et information manquante, puis poursuivre avec l’option la plus prudente.