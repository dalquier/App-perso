# Équilibre — MASTER BUILD PROMPT

- **Statut** : canonique après fusion de la PR de reprise
- **Projet ProjectOS** : `equilibre`
- **Dépôt source de vérité** : `dalquier/App-perso`
- **Gouvernance** : `ProjectOS/projects/Equilibre/`
- **Application** : `apps/equilibre/`
- **Prototype historique** : `dalquier/Scriptable`, en lecture seule
- **Dernière mise à jour** : 2026-08-05

## 1. Identité et vision

Équilibre est une application personnelle d’auto-accompagnement assistée par IA et structurée par des principes issus des thérapies cognitivo-comportementales. Elle aide à clarifier une situation, des pensées et des émotions, à conduire une séance guidée, à choisir une action réaliste et à reprendre un travail interrompu. Elle ne se présente jamais comme un thérapeute, ne diagnostique pas et ne remplace aucun professionnel de santé.

## 2. Problème utilisateur

Réduire la difficulté à initier et poursuivre une démarche structurée lorsque l’utilisateur est seul, fatigué, anxieux, en évitement ou en situation de craving. L’interface propose une seule prochaine étape claire et laisse l’utilisateur contrôler ce qui est enregistré, corrigé ou supprimé.

## 3. Périmètre V1

- échange écrit rapide ;
- séance guidée structurée ;
- historique local et reprise ;
- mémoire personnelle contrôlée ;
- premiers protocoles TCC versionnés ;
- PWA installable et optimisée iPhone ;
- garde-fous sensibles ;
- export, sauvegarde et suppression préparés ;
- fonctionnement dégradé explicite sans IA distante.

## 4. Hors périmètre initial

- diagnostic ou décision clinique ;
- remplacement d’un thérapeute ;
- multi-utilisateur ;
- synchronisation cloud sensible ;
- voix temps réel ;
- application native Swift ;
- dashboard riche, gamification ou score psychologique global ;
- embeddings et mémoire vectorielle dans BUILD-01 ;
- intégration DeveloperOS.

## 5. Principes TCC, éthiques et de sécurité

- Équilibre se présente comme une IA d’auto-accompagnement inspirée des TCC.
- Le LLM ne persiste jamais directement une mémoire durable.
- Les faits, hypothèses, synthèses et mémoires validées restent distincts.
- Toute mémoire durable possède provenance, temporalité, statut et validation.
- Les contenus utilisateurs et documents récupérés sont non fiables et ne modifient jamais les règles permanentes, les schémas ou la sécurité.
- Une sortie structurée ne produit aucun effet métier avant validation.
- Un scénario sensible interrompt le parcours ordinaire et oriente calmement vers une aide humaine adaptée.
- Aucune donnée personnelle, médicale ou sensible réelle dans GitHub, les tests, les exemples, les captures ou les journaux.

## 6. Architecture cible

```text
dalquier/App-perso/
├── ProjectOS/
│   └── projects/
│       └── Equilibre/        # gouvernance et spécifications
└── apps/
    └── equilibre/            # code PWA, tests et documentation d’exécution
```

Le dossier `ProjectOS/projects/Equilibre/` ne contient pas les dépendances, artefacts de build ou sources applicatives. Le chemin `projects/Equilibre/` à la racine ne doit pas être créé. Aucun dépôt GitHub concurrent ne doit être créé pour BUILD-01.

### Couches logiques

- `ui` : PWA et parcours ;
- `application` : cas d’usage ;
- `domain` : conversation, message, séance, réglages et événement sensible ;
- `providers` : simulateur local puis fournisseur OpenAI ;
- `storage` : persistance locale versionnée ;
- `protocols` : protocoles TCC indépendants des données personnelles ;
- `safety` : règles déterministes et formulations ;
- `export` : export, suppression et restauration contrôlée.

La base intégrée jusqu’à BUILD-02 est local-first, sans synchronisation sensible. Les messages originaux restent les sources primaires. Les données dérivées restent reliées à leurs sources. Recherche structurée et plein texte avant embeddings. Toute migration est versionnée, testée et réversible.

## 7. Rôle des outils

- **ChatGPT** : charge ProjectOS, audite, arbitre, prépare les Builds et vérifie les PR.
- **Codex** : implémente les changements substantiels sur une branche dédiée, écrit les tests et prépare la PR.
- **GitHub** : source de vérité unique.
- **Replit Starter** : importe `dalquier/App-perso` et exécute depuis `apps/equilibre/` ; jamais source de vérité.
- **Pyto** : compagnon local pour fichiers, exports, sauvegardes et utilitaires ; pas interface principale.
- **OpenAI API** : composant derrière une interface fournisseur ; aucun secret dans le client ou GitHub.

## 8. Références obligatoires à charger

1. `ProjectOS/BOOTSTRAP.md` ;
2. `ProjectOS/00_INDEX.md` ;
3. `ProjectOS/PROJECT_REGISTRY.md` ;
4. `ProjectOS/core/KERNEL.md` ;
5. `ProjectOS/core/LIFECYCLE.md` ;
6. `ProjectOS/core/DECISION_ENGINE.md` ;
7. `ProjectOS/standards/TOOLCHAIN_POLICY.md` ;
8. `ProjectOS/standards/CODE_WORK_ROUTING.md` ;
9. `ProjectOS/standards/TESTING.md` ;
10. `ProjectOS/standards/QUALITY_UX_SECURITY.md` ;
11. `ProjectOS/projects/Equilibre/PROJECT_MANIFEST.md` ;
12. `ProjectOS/projects/Equilibre/roadmap.md` ;
13. `ProjectOS/projects/Equilibre/PARALLEL_WORK_CONTRACT.md` ;
14. le présent fichier ;
15. les ADR Équilibre applicables.

Le prototype `dalquier/Scriptable/TCC_Budy` est chargé uniquement pour inventaire, migration ou comparaison. Les anciens documents Drive sont secondaires et non canoniques.

## 9. État vérifié

- BUILD-01 intégré : socle PWA, séance guidée, persistance locale contrôlée, réglages et garde-fou sensible ;
- BUILD-02 intégré par la PR #29 au commit `b115989fadd0f3e9f6b503c1b933df4d2b179827` ;
- conversations locales persistantes, historique, reprise, renommage, suppression et modes conversationnels opérationnels ;
- stockage version 2, migration BUILD-01 déterministe et protection des versions inconnues ;
- génération locale progressive, interruption et isolation par conversation ;
- 48 tests automatisés, build Vite et workflows GitHub réussis ;
- recette Replit et recette physique iPhone réussies ;
- aucun fournisseur OpenAI réel et aucune donnée distante dans BUILD-02.

## 10. Décisions prises

- Équilibre est le nom canonique ;
- `dalquier/App-perso` reste le dépôt unique ;
- gouvernance sous `ProjectOS/projects/Equilibre/` ;
- application sous `apps/equilibre/` ;
- PWA comme interface principale ;
- Replit pour exécution et déploiement ;
- Pyto comme compagnon ;
- mono-utilisateur et local-first au départ ;
- API OpenAI derrière une interface fournisseur ;
- aucune donnée réelle dans le dépôt public.

## 11. Décisions ouvertes

- stack PWA précise ;
- stockage local exact ;
- stratégie backend future pour OpenAI ;
- contenu final du premier protocole guidé ;
- règles et formulations sensibles exhaustives ;
- politique de chiffrement, export et synchronisation future ;
- éléments historiques à adapter ou réécrire.

Ces choix sont arbitrés dans BUILD-01 uniquement lorsqu’ils sont nécessaires au parcours minimal.

## 12. Fonctions historiques à préserver

- création, ouverture, reprise et suppression d’une conversation ;
- historique local ;
- simulateur local ;
- interface fournisseur ;
- séparation UI/application/domaine/stockage ;
- migrations ;
- tests de cœur ;
- gestion explicite des erreurs ;
- adaptation clavier iOS et clair/sombre.

Préserver signifie comparer et documenter, pas copier aveuglément du Python dans la PWA.

## 13. Dettes connues

- mémoire contrôlée et séances enrichies non construites ;
- fournisseur OpenAI réel et backend sécurisé non construits ;
- chiffrement, export et synchronisation future à cadrer ;
- protocoles TCC et règles sensibles à étendre avant diffusion ;
- dépendance actuelle au fournisseur local dégradé.

## 14. Critères d’acceptation globaux

- PWA installable ou utilisable sur iPhone ;
- parcours principal fonctionnel avec données fictives ;
- statut d’IA non thérapeute clairement affiché ;
- données visibles, contrôlables et supprimables ;
- reprise après fermeture ;
- mode dégradé explicite ;
- garde-fou sensible fonctionnel ;
- aucun secret ou donnée réelle ;
- tests automatisés passants ;
- tests manuels iPhone documentés ;
- Replit recréable depuis GitHub ;
- retour arrière décrit.

## 15. Stratégie de tests

### Automatisés

- cas d’usage ;
- stockage et migrations ;
- contrat du simulateur ;
- reprise et suppression ;
- règles sensibles ;
- absence de secrets et données réelles ;
- build et manifeste PWA.

### Fonctionnels

- Safari iPhone et ajout à l’écran d’accueil ;
- clavier, clair/sombre et petites tailles d’écran ;
- fermeture/réouverture ;
- fonctionnement local sans réseau ;
- erreur fournisseur et mode dégradé ;
- suppression totale des données.

## 16. Protection des données

Le dépôt `dalquier/App-perso` est public. Sont interdits : données personnelles réelles, conversations, bases exportées, clés, fichiers `.env`, journaux de contenu, profils réels et captures sensibles. Les fixtures utilisent uniquement des identités et situations fictives. Les données locales du navigateur ne sont jamais commitées.

## 17. Méthode de livraison

1. ChatGPT prépare et vérifie le Build.
2. Codex crée une branche depuis `main` à jour.
3. Codex travaille uniquement dans le périmètre demandé.
4. Tests et documentation sont ajoutés dans la même branche.
5. Une PR est ouverte vers `main`.
6. ChatGPT vérifie diff, tests, risques et absence de données sensibles.
7. Replit importe la branche et exécute `apps/equilibre/`.
8. Les corrections repartent dans la branche ou une branche dédiée.
9. Aucun changement direct sur `main`.

## 18. Prochaine étape exacte

Préparer `BUILD-03 — séances et mémoire contrôlée` depuis `main` à jour :

1. consolider les critères produit, données, TCC, sécurité et UX ;
2. définir le modèle versionné des séances, résumés, plans d’action et éléments de mémoire ;
3. garantir une mémoire proposée, confirmée, modifiable et supprimable ;
4. préserver le local-first, la suppression totale, les migrations et le garde-fou déterministe ;
5. définir les tests automatisés, la recette Replit et la recette iPhone avant implémentation ;
6. réaliser BUILD-03 avec Codex sur une branche dédiée et une nouvelle Pull Request.

## 19. Historique des Builds intégrés

- BUILD-01 : socle PWA minimal, séance guidée, confidentialité locale et garde-fou.
- BUILD-02 : conversations persistantes locales, streaming interruptible, historique multi-conversations, migration versionnée et validation iPhone.
- Les anciens prompts d’exécution BUILD-01/BUILD-02 sont historiques et ne doivent plus être utilisés comme instructions actives.

## 20. Ne pas faire

- Ne pas créer de dépôt GitHub applicatif concurrent pour BUILD-01.
- Ne pas créer `projects/Equilibre/` à la racine.
- Ne pas mettre le code PWA dans `ProjectOS/projects/Equilibre/`.
- Ne pas modifier le prototype historique.
- Ne pas copier aveuglément l’architecture Python.
- Ne pas modifier `main` directement.
- Ne pas développer durablement uniquement dans Replit.
- Ne pas exposer une clé OpenAI.
- Ne pas versionner de données réelles.
- Ne pas commencer par la voix, les embeddings, le multi-utilisateur ou une application native.
- Ne pas présenter Équilibre comme un thérapeute.
