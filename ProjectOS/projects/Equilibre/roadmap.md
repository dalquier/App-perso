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

Statut : intégré et validé. Le chat persistant, le streaming local, la reprise, les modes conversationnels, la migration versionnée, la confidentialité, l’interruption et l’isolation des générations ont été validés par 48 tests automatisés, les workflows GitHub et une recette physique iPhone. Référence d’intégration : PR #29, commit `b115989fadd0f3e9f6b503c1b933df4d2b179827`.

## Jalon E — BUILD-03, séances et mémoire contrôlée

Statut : intégré par la PR #53. Séances structurées, résumés, plans d'action et mémoire locale proposée/confirmée/corrigeable/supprimable sont présents dans `main`.

## Jalon F — V4 / BUILD-04, protocoles versionnés, stockage v4 et sécurité

Statut : candidate finale validée automatiquement et prête à intégrer dans `main`.

La candidate contient exactement deux protocoles actifs, une navigation principale à cinq destinations avec `Protocoles`, le stockage v4 et ses migrations/garanties anti-résurrection, des gates de sécurité avant mutation, la mémoire uniquement explicite et le cache PWA `equilibre-shell-v6`.

Le lancement Replit final est natif : `.replit` contient uniquement la commande Run `./start-equilibre.sh`. Le script exécute l’installation déterministe, le build Vite puis un serveur statique Node dédié sur `0.0.0.0:${PORT:-5000}`. Aucun Workflow manuel ni Artifact Replit n’est requis. La CI exécute exactement ce chemin et vérifie le HTTP 200.

Les tests automatisés, le build, le direct-run smoke et ProjectOS Quality sont verts sur la candidate. La recette physique iPhone reste requise après intégration et import dans un Replit neuf.

## Jalon G — Capacités ultérieures

La dictée, la lecture vocale puis la voix temps réel restent hors BUILD-04 et ne seront envisagées qu'après critères de sécurité dédiés.

## Règle de passage

Chaque jalon nécessite des critères d’acceptation vérifiés, des risques documentés et une livraison traçable par Pull Request.
