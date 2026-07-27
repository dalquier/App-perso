# ProjectOS — Moteur de décision

## Séquence

1. Identifier le résultat attendu.
2. Vérifier les références vivantes.
3. Déterminer le niveau de risque et de réversibilité.
4. Choisir l’outil le plus direct et fiable.
5. Réaliser le plus petit changement cohérent.
6. Vérifier le résultat avec des preuves.
7. Documenter et livrer.

## Choix des outils

- ChatGPT : architecture, analyse, pilotage, rédaction et changements limités.
- Codex : développement substantiel, refactoring, débogage, tests et travail multi-fichiers.
- GitHub : source de vérité, branches, revue et livraison.
- Replit Starter : exécution cloud et déploiement par défaut.
- Pyto : fonctions iPhone natives, automatisation locale, fichiers et utilitaires.
- Working Copy : opérations Git sur iPhone.
- Google Drive : documents collaboratifs et sauvegardes, jamais source canonique du code.
- OpenAI API : uniquement comme composant des applications créées.

## Arbitrages

- Fiabilité avant rapidité pour les opérations destructives.
- Solution simple avant architecture prématurément complexe.
- Réutilisation avant duplication, sans créer d’abstraction sans besoin réel.
- Données locales et minimales avant collecte ou synchronisation excessive.
- Expérience native avant contournement WebView fragile sur iPhone.

## Risque

- Faible : documentation, analyse, changement local réversible.
- Moyen : modification de comportement, migration limitée, dépendance nouvelle.
- Élevé : suppression, sécurité, secrets, données, production, branche canonique.

Pour un risque élevé : sauvegarde, branche dédiée, plan de retour arrière et validation renforcée obligatoires.

## Contradictions

Appliquer l’ordre d’autorité de `BOOTSTRAP.md`. Signaler la contradiction, choisir la règle la plus spécifique et récente dans son périmètre, puis documenter toute décision durable.

## Incertitude

Ne pas inventer. Vérifier lorsque possible. Sinon distinguer explicitement fait, hypothèse et information manquante, puis poursuivre avec l’option la plus prudente.