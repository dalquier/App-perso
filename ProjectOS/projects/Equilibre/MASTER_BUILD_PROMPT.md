# Équilibre — MASTER BUILD PROMPT

- **Statut** : canonique après fusion de la PR de reprise
- **Projet ProjectOS** : `equilibre`
- **Dépôt source de vérité** : `dalquier/App-perso`
- **Gouvernance** : `ProjectOS/projects/Equilibre/`
- **Application** : `apps/equilibre/`
- **Prototype historique** : `dalquier/Scriptable`, en lecture seule
- **Dernière mise à jour** : 2026-08-09

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

La base intégrée jusqu'à BUILD-04 est local-first, sans synchronisation sensible. Les messages originaux restent les sources primaires. Les données dérivées restent reliées à leurs sources. Recherche structurée et plein texte avant embeddings. Toute migration est versionnée, testée et réversible.

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
- BUILD-03 intégré par la PR #53 : séances structurées et mémoire locale contrôlée ;
- V4 / BUILD-04 intégrée dans `main` : stockage version 4, deux protocoles actifs versionnés, gates de sécurité avant mutation et cache PWA `equilibre-shell-v6` ;
- runtime Replit natif stabilisé par la PR #122 et vérifié au SHA `d9b91b9531b77b2c8f04e713465d69beb06f9bac` ;
- convergence conversationnelle du Jalon G versionnée dans `docs/CONVERSATIONAL_ARCHITECTURE_CONVERGENCE.md` ;
- contrats SESSION-30-A intégrés par la PR #125 au commit `2eaa9425a421967558fd64d1b1f6822f626d872c` ;
- moteur structuré local SESSION-30-B intégré par la PR #129 ;
- préparation SESSION-30-C acceptée par la PR #131 ; C0 est une candidate isolée qui ajoute la sécurité des données v4 sans activer storage-v5 ;
- génération locale progressive, interruption et isolation par conversation ;
- les 181 tests automatisés, le build, le lancement racine, le HTTP 200 et le smoke iPhone du socle sont verts au SHA de stabilisation ;
- aucun fournisseur OpenAI réel, backend conversationnel ou stockage distant n'est encore implémenté.

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

- mise en œuvre de l'ADR-007 : storage-v5 / IndexedDB transactionnelle après C0 et avant la persistance des séances longues ;
- contrat exécutable détaillé de `ClinicalRolePolicy` ;
- taxonomie temporelle et sensible de la mémoire contextuelle ;
- modèle OpenAI, paramètres, budgets et timeouts à sélectionner par evals ;
- niveau de conservation OpenAI standard ou Zero Data Retention si éligible ;
- extension safety des dialogues longs et des domaines renforcés ;
- politique de chiffrement, export et synchronisation future.

Ces décisions sont prises dans les Builds qui en dépendent. La décision de stockage ne bloque pas `SESSION-30-B`, qui reste un moteur de domaine pur sans persistance.

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

- utilisation contextuelle des mémoires confirmées non construite ;
- contrats et moteur structuré des séances longues intégrés ; C0 de sécurité des données en candidate ; persistance storage-v5 et UI encore non intégrées ;
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

Relire, valider puis intégrer la candidate C0 selon `docs/SESSION_30_C0_DATA_SAFETY.md`. Ne commencer C1 — migration IndexedDB transactionnelle — qu'après cette intégration. Chaque incrément doit laisser une version publiée stable sur la même origine Replit et prouver la conservation des données. Ne pas introduire de provider ou de dialogue semi-structuré.

## 19. Historique des Builds intégrés

- BUILD-01 : socle PWA minimal, séance guidée, confidentialité locale et garde-fou.
- BUILD-02 : conversations persistantes locales, streaming interruptible, historique multi-conversations, migration versionnée et validation iPhone.
- BUILD-03 : séances structurées et mémoire contrôlée, intégré par la PR #53.
- V4 / BUILD-04 : intégrée dans `main` ; runtime natif stabilisé ensuite par la PR #122.
- SESSION-30-A : contrats de domaine intégrés par la PR #125.
- SESSION-30-B : moteur structuré local et définition S30-02 intégrés par la PR #129.
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
