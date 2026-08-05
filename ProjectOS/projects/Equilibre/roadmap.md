# Équilibre — Roadmap initiale

## Vague 0 — Fondation canonique

Objectif : unifier le projet, formaliser les décisions de base et préparer le travail parallèle.

Sortie : manifeste, ADR, contrat de parallélisation et registre mis à jour.

## Jalon A — Conception parallèle

Produire cinq livraisons indépendantes :

1. Produit et UX ;
2. Mémoire et données ;
3. Moteur TCC ;
4. Architecture PWA/Replit/Pyto ;
5. Qualité, sécurité et validation.

Aucun code applicatif n’est autorisé pendant ce jalon.

## Jalon B — Revue de convergence

Comparer les cinq livraisons, résoudre les contradictions, figer :

- parcours MVP ;
- modèle de données ;
- machine d’états conversationnelle ;
- architecture technique ;
- critères go/no-go.

Sortie : spécification consolidée et plan `BUILD-01`.

## Jalon C — BUILD-01, socle PWA

Statut : intégré. Le dossier applicatif canonique, le shell PWA, la persistance locale contrôlée, la séance guidée, les réglages et le garde-fou sensible sont présents dans `apps/equilibre/`.

## Jalon D — BUILD-02, conversation écrite

Statut : en correction après audit, puis en attente de validation. Le chat persistant, le streaming local, la reprise et les modes conversationnels de base sont dans la PR, avec corrections de migration, confidentialité, interruption, isolation des générations et stockage inconnu. La recette Replit et la recette iPhone physique restent à exécuter avant passage de jalon.

## Jalon E — BUILD-03, séances et mémoire contrôlée

Livrer la séance structurée, le résumé, les plans d’action et la mémoire proposée/confirmée/corrigeable.

## Jalon F — Protocoles, sécurité et voix

Intégrer progressivement les protocoles TCC, les scénarios sensibles, la dictée, la lecture vocale puis la voix temps réel si les critères de sécurité sont satisfaits.

## Règle de passage

Chaque jalon nécessite des critères d’acceptation vérifiés, des risques documentés et une livraison traçable par Pull Request.
