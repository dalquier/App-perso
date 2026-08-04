# Équilibre — MASTER BUILD PROMPT

- **Statut** : canonique après fusion de la PR de reprise
- **Projet ProjectOS** : `equilibre`
- **Dépôt source de vérité** : `dalquier/App-perso`
- **Gouvernance** : `ProjectOS/projects/Equilibre/`
- **Application** : `apps/equilibre/`
- **Prototype historique** : `dalquier/Scriptable`, en lecture seule
- **Dernière reconstruction** : 2026-08-04

## 1. Identité et vision

Équilibre est une application personnelle d’auto-accompagnement assistée par IA et structurée par des principes issus des thérapies cognitivo-comportementales. Elle aide à clarifier une situation, des pensées et des émotions, à conduire une séance guidée, à choisir une action réaliste et à reprendre un travail interrompu. Elle ne se présente jamais comme un thérapeute, ne diagnostique pas et ne remplace aucun professionnel de santé.

## 2. Problème utilisateur

Réduire la difficulté à initier et poursuivre une démarche structurée lorsque l’utilisateur est seul, fatigué, anxieux, en évitement ou en situation de craving. L’interface doit proposer une seule prochaine étape claire et laisser l’utilisateur contrôler ce qui est enregistré, corrigé ou supprimé.

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

### 6.1 Monorepo

```text
dalquier/App-perso/
├── ProjectOS/
│   └── projects/
│       └── Equilibre/        # gouvernance et spécifications
└── apps/
    └── equilibre/            # code PWA, tests et documentation d’exécution
```

Le dossier `ProjectOS/projects/Equilibre/` ne contient pas les dépendances, artefacts de build ou sources applicatives. Le chemin `projects/Equilibre/` à la racine ne doit pas être créé, afin d’éviter toute confusion.

### 6.2 Couches logiques

- `ui` : PWA et parcours ;
- `application` : cas d’usage ;
- `domain` : conversation, message, séance, réglages et événement sensible ;
- `providers` : simulateur local puis fournisseur OpenAI ;
- `storage` : persistance locale versionnée ;
- `protocols` : protocoles TCC indépendants des données personnelles ;
- `safety` : règles déterministes et formulations ;
- `export` : export, suppression et restauration contrôlée.

### 6.3 Données

BUILD-01 est local-first, sans synchronisation sensible. Les messages originaux restent les sources primaires. Les données dérivées restent reliées à leurs sources. Recherche structurée et plein texte avant embeddings. Toute migration est versionnée, testée et réversible.

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

- Vague 0 fusionnée par `dalquier/App-perso#5` ;
- gouvernance Équilibre présente dans ProjectOS ;
- prototype Pyto/WebView substantiel retrouvé dans `dalquier/Scriptable` ;
- anciens documents Drive et 34 ADR historiques retrouvés ;
- aucune PWA canonique encore créée ;
- chemin applicatif décidé : `apps/equilibre/` ;
- aucun déploiement Replit vérifié.

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

- ancien nom `TCC Budy` dans le prototype ;
- plusieurs instantanés historiques ;
- aucune application sous `apps/equilibre/` ;
- aucun test PWA ni CI ;
- aucune séance guidée PWA vérifiée ;
- mémoire avancée non construite ;
- règles sensibles non testées exhaustivement ;
- aucun déploiement Replit prouvé.

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

Après fusion de la PR de reprise :

1. créer `equilibre/build-01-minimal-pwa` depuis `main` ;
2. créer `apps/equilibre/` dans cette branche ;
3. inventorier le prototype historique ;
4. produire la matrice `réutiliser / adapter / réécrire / différer / archiver` ;
5. construire et tester le parcours minimal ;
6. ouvrir une PR BUILD-01 ;
7. importer la branche dans Replit ;
8. effectuer le test iPhone réel.

## 19. Prompt Codex — BUILD-01

```text
POS = Active ProjectOS depuis dalquier/App-perso.

Charge ProjectOS/BOOTSTRAP.md et toutes les références obligatoires. Projet : equilibre / Équilibre. Charge le manifeste, la roadmap, le contrat de convergence, MASTER_BUILD_PROMPT.md, les ADR applicables et les standards de code, tests, qualité et handoff.

Dépôt canonique : dalquier/App-perso.
Gouvernance : ProjectOS/projects/Equilibre/.
Application : apps/equilibre/.
Prototype historique à inventorier sans modification : dalquier/Scriptable/TCC_Budy et instantanés associés.

Mission : réaliser BUILD-01, la plus petite PWA réellement testable sur iPhone.

Branche : equilibre/build-01-minimal-pwa

Avant de coder :
1. Vérifie main et les PR ouvertes.
2. Confirme que la PR de reprise est fusionnée.
3. Vérifie que apps/equilibre/ n’existe pas déjà ou inventorie son contenu avant modification.
4. Inventorie le prototype historique et crée une matrice réutiliser / adapter / réécrire / différer / archiver.
5. Ne stocke aucune donnée réelle et n’ajoute aucun secret.

Périmètre obligatoire :
- shell PWA installable ;
- accueil simple ;
- échange écrit avec simulateur local ;
- séance guidée courte : situation, émotion, pensée, prochaine action ;
- persistance locale versionnée ;
- reprise de la dernière session ;
- réglages de confidentialité ;
- effacement des données ;
- garde-fou sensible déterministe ;
- tests automatisés ;
- documentation Replit et test iPhone.

Hors périmètre : API OpenAI réelle obligatoire, mémoire avancée, embeddings, cloud sensible, voix, comptes, dashboard riche, DeveloperOS et modification du prototype historique.

Livraison : fichiers complets dans apps/equilibre/, tests exécutés, compte rendu ProjectOS temporaire, PR vers main, limites et retour arrière documentés.
```

## 20. Ne pas faire

- Ne pas créer `dalquier/Equilibre` pour BUILD-01.
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
