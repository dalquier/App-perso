# ProjectOS — Moteur de décision

## Séquence

1. Identifier le résultat attendu.
2. Vérifier les références vivantes.
3. Déterminer le niveau de risque et de réversibilité.
4. Classer le travail comme limité ou substantiel selon `standards/CODE_WORK_ROUTING.md`.
5. Choisir l’outil le plus direct et fiable.
6. Réaliser le plus petit changement cohérent.
7. Vérifier le résultat avec des preuves.
8. Documenter et livrer.

## Choix des outils

- ChatGPT : architecture, analyse, pilotage, rédaction, revue et changements limités.
- Codex : outil obligatoire pour les nouveaux Builds, les projets multi-fichiers, le développement substantiel, les refactorings, les migrations, le débogage transversal et les tests associés.
- GitHub : source de vérité, branches, revue et livraison.
- Replit Starter : exécution cloud et déploiement par défaut.
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

L’outil de construction et le lieu de vérité sont distincts : Codex construit, Replit exécute, Pyto teste les fonctions iPhone, GitHub conserve et livre.

## Arbitrages

- Fiabilité avant rapidité pour les opérations destructives.
- Solution simple avant architecture prématurément complexe.
- Réutilisation avant duplication, sans créer d’abstraction sans besoin réel.
- Données locales et minimales avant collecte ou synchronisation excessive.
- Expérience native avant contournement WebView fragile sur iPhone.
- Livraison canonique GitHub avant commodité d’un fichier local.
- Codex avant génération conversationnelle lorsque le périmètre est substantiel.

## Risque

- Faible : documentation, analyse, changement local réversible.
- Moyen : modification de comportement, migration limitée, dépendance nouvelle.
- Élevé : suppression, sécurité, secrets, données, production, branche canonique.

Pour un risque élevé : sauvegarde, branche dédiée, plan de retour arrière et validation renforcée obligatoires.

## Contradictions

Appliquer l’ordre d’autorité de `BOOTSTRAP.md`. Signaler la contradiction, choisir la règle la plus spécifique et récente dans son périmètre, puis documenter toute décision durable.

## Incertitude

Ne pas inventer. Vérifier lorsque possible. Sinon distinguer explicitement fait, hypothèse et information manquante, puis poursuivre avec l’option la plus prudente.
