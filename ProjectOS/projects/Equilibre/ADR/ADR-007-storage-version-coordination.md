# ADR-007 — Coordination des versions et migrations de stockage

- **Statut** : proposé pour acceptation avec CONVERGENCE-05
- **Date** : 2026-08-09
- **Projet** : Équilibre
- **Décisions liées** : `ADR-006-conversational-ai-governance.md`, `docs/CONVERSATION_AI_CONVERGENCE.md`, `docs/SESSION_30_REFERENCE.md`

## Contexte

Les prochains incréments Équilibre peuvent faire évoluer une même ressource logique mutable : le stockage local versionné.

Deux besoins sont déjà identifiés :

- MEMORY-CONTEXT enrichit le modèle de mémoire, sa temporalité et ses règles de sélection ;
- SESSION-30 introduira à terme des runs et transcripts longs susceptibles d'imposer une évolution de capacité ou de schéma.

Le choix technique exact reste volontairement ouvert : extension contrôlée du stockage actuel ou évolution vers un stockage plus adapté, potentiellement IndexedDB avec une nouvelle version de schéma.

En revanche, ProjectOS impose désormais un Resource Lock sur les versions, schémas et migrations partagés. Deux Builds ne sont donc pas indépendants s'ils tentent chacun de modifier la version globale du stockage, même lorsque leurs fichiers métier diffèrent.

## Décision

La **version globale, le schéma et la chaîne de migration du stockage Équilibre constituent une ressource logique unique**.

À tout instant, une seule branche d'implémentation peut être propriétaire d'une évolution de cette ressource.

Avant tout Build nécessitant un changement de stockage :

1. relever la version et le schéma vivants de `main` ;
2. déclarer explicitement le Resource Lock sur la version, le schéma et la migration ;
3. figer le contrat de migration et de rollback ;
4. attribuer un unique owner à l'évolution ;
5. faire consommer ce contrat par les autres Builds sans bump parallèle ;
6. fusionner séquentiellement l'évolution propriétaire ;
7. refaire le Freshness Gate avant qu'un Build dépendant ne poursuive ou ne publie une modification du stockage.

## Conséquences pour BUILD-05C et SESSION-30

- BUILD-05A doit figer les besoins communs avant la première migration concernée.
- BUILD-05C peut enrichir la mémoire uniquement selon le contrat de stockage alors actif ou selon la migration dont il est explicitement propriétaire.
- SESSION-30 ne crée pas en parallèle une autre migration vers la même version globale.
- Si SESSION-30 exige ensuite un changement supplémentaire, il part de la version déjà intégrée et reçoit un nouveau numéro/version de migration.
- Les branches métier peuvent rester parallèles seulement si elles ne possèdent pas simultanément la ressource logique de stockage.

## Invariants de migration

Toute évolution conserve ou remplace explicitement les garanties existantes :

- migration versionnée et déterministe ;
- sauvegarde/rollback lorsque le contrat courant l'exige ;
- conservation contrôlée des données compatibles ;
- rejet sûr des versions inconnues ;
- protection contre les écritures stale ;
- protection anti-résurrection après suppression/effacement ;
- absence d'invention de données ou de provenance pendant migration ;
- tests de reprise après fermeture et redémarrage ;
- export et suppression cohérents avec le nouveau schéma.

## Ce que cette ADR ne décide pas

Cette ADR ne choisit pas :

- `localStorage` versus IndexedDB ;
- le numéro exact d'une future version ;
- les stores/index exacts ;
- les seuils de volume déclenchant une migration ;
- la structure finale des MemoryType ;
- la représentation finale des longs transcripts.

Ces choix doivent être tranchés au moment du contrat BUILD-05A/BUILD-05C ou SESSION-30 concerné, avec preuves de besoin et tests de migration.

## Alternatives rejetées

- deux branches parallèles bumpant chacune la même version de stockage ;
- réserver seulement les fichiers sans réserver la version/schéma logique ;
- laisser chaque feature choisir silencieusement sa migration ;
- réconcilier après coup deux schémas divergents portant le même numéro.

## Gate

Une PR qui modifie la version, le schéma ou une migration du stockage n'est pas intégrable tant que :

- le Resource Lock et son owner ne sont pas explicites ;
- aucune autre PR active ne possède la même ressource logique ;
- la migration part de la version réellement vivante dans `main` ;
- rollback, stale-write et anti-résurrection applicables sont testés ;
- le Freshness Gate global est repassé juste avant intégration.

Cette coordination est une contrainte d'intégration, indépendamment du choix technique final du stockage.
