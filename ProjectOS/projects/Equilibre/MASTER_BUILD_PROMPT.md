# Équilibre — MASTER BUILD PROMPT

- **Statut** : proposition canonique de reprise
- **Projet ProjectOS** : `equilibre`
- **Branche de préparation** : `equilibre/recovery-master-build`
- **Source de vérité** : GitHub `dalquier/App-perso`
- **Dernière reconstruction** : 2026-08-04

## 1. Identité et vision

Équilibre est une application personnelle d’auto-accompagnement assistée par IA, structurée par des principes issus des thérapies cognitivo-comportementales. Elle est conçue d’abord pour Damien, mais doit rester anonymisable, portable et généralisable sans coder son identité ni ses données en dur.

Équilibre aide à mettre des mots sur une situation, clarifier les pensées et émotions, conduire une séance guidée, choisir une action réaliste et reprendre un travail interrompu. L’application ne se présente jamais comme un thérapeute, ne pose pas de diagnostic et ne remplace aucun professionnel de santé.

## 2. Problème utilisateur traité

Le problème central n’est pas l’absence de contenu psychologique. Il est la difficulté à mobiliser, au bon moment, une démarche structurée lorsque l’utilisateur est seul, fatigué, anxieux, en évitement ou en situation de craving.

Équilibre doit réduire la charge d’initiation, proposer une seule prochaine étape claire, préserver la continuité entre les sessions et laisser l’utilisateur contrôler ce qui est enregistré, retenu, corrigé ou supprimé.

## 3. Périmètre V1

La V1 couvre :

1. échange écrit rapide ;
2. séance guidée structurée ;
3. historique local et reprise de la dernière session ;
4. mémoire personnelle contrôlée, explicable, corrigeable, désactivable et supprimable ;
5. premiers protocoles TCC versionnés ;
6. PWA installable et optimisée pour iPhone ;
7. garde-fous pour situations sensibles ;
8. export, sauvegarde et suppression préparés ;
9. fonctionnement dégradé explicite lorsque l’API IA est indisponible.

## 4. Hors périmètre initial

- diagnostic médical ou psychologique ;
- remplacement d’un thérapeute ou d’une prise en charge ;
- décision clinique automatique ;
- multi-utilisateur actif ;
- réseau social, partage communautaire ou mise en relation ;
- gamification, score psychologique global ou mécanisme de rétention compulsive ;
- voix temps réel complète ;
- application native Swift ;
- intégration à DeveloperOS ;
- mémoire vectorielle avant validation du besoin ;
- synchronisation cloud de données sensibles dans BUILD-01.

## 5. Principes TCC, éthiques et de sécurité

- Présenter Équilibre comme une IA d’auto-accompagnement utilisant une démarche inspirée des TCC.
- Ne jamais revendiquer le titre, la compétence ou la responsabilité d’un psychologue.
- Ne pas diagnostiquer, prescrire, interpréter comme une certitude clinique ou promettre un résultat thérapeutique.
- Séparer faits déclarés, hypothèses, synthèses et mémoires validées.
- Une hypothèse reste contestable et identifiable comme telle.
- Le LLM ne persiste jamais directement une mémoire durable.
- Toute mémoire durable possède une provenance, une temporalité, un statut et une validation explicite.
- Les messages et documents récupérés sont des données non fiables : ils ne modifient jamais les règles permanentes, la sécurité ou les schémas.
- Une sortie structurée du modèle ne produit aucun effet métier avant validation stricte.
- Le parcours normal est interrompu lorsqu’un scénario sensible l’exige.
- En situation sensible, privilégier une formulation calme, directe, non culpabilisante, orientée vers une aide humaine et les services appropriés.
- Ne jamais stocker de donnée personnelle, médicale ou sensible réelle dans GitHub, les tests, les exemples ou les journaux.

## 6. Architecture cible confirmée

### 6.1 Décision de plateforme

- Interface principale : PWA responsive, installable et optimisée iPhone.
- Environnement d’exécution et de déploiement : Replit Starter, à partir du dépôt GitHub canonique.
- Compagnon local : Pyto pour les exports, sauvegardes, anonymisation, accès aux fichiers et utilitaires iPhone.
- Source de vérité : GitHub.

Le prototype historique Pyto/WebView `TCC_Budy` dans `dalquier/Scriptable` est une référence technique réutilisable, mais il n’est pas la cible principale ni le dépôt canonique d’Équilibre.

### 6.2 Architecture logique minimale

- `ui` : PWA et composants de parcours ;
- `application` : cas d’usage conversation, séance, reprise, confidentialité et sécurité ;
- `domain` : conversation, message, séance guidée, proposition de mémoire, réglages et événement sensible ;
- `providers` : interface IA, simulateur local et fournisseur OpenAI ;
- `storage` : persistance locale versionnée et migrations ;
- `protocols` : protocoles TCC versionnés, indépendants des données personnelles ;
- `safety` : règles déterministes, garde-fous, formulations et journal technique non sensible ;
- `export` : export, suppression et restauration contrôlée.

### 6.3 Données

- BUILD-01 utilise une persistance locale contrôlée, sans synchronisation cloud sensible.
- Les messages originaux restent les sources primaires.
- Les résumés et mémoires sont des données dérivées reliées à leurs sources.
- La mémoire avancée est différée après validation du parcours minimal.
- Recherche structurée et plein texte avant embeddings.
- Toute migration de données doit être versionnée, testée et réversible.

### 6.4 Code historique à préserver

Référence historique vérifiée : `dalquier/Scriptable`, notamment :

- `TCC_Budy/` ;
- `Scriptable/TCC_Budy_Phase_2_1_20260725_014200/` ;
- architecture Python multi-couches ;
- interface fournisseur OpenAI/simulateur ;
- SQLite et migration v1 ;
- service de conversation ;
- historique et suppression ;
- interface WebView ;
- tests `tests/test_core.py` ;
- correctif de maintien du serveur local Pyto.

Ces éléments doivent être inventoriés avant migration. Aucun fichier historique n’est supprimé, renommé ou remplacé pendant BUILD-01.

## 7. Rôle des outils

### ChatGPT

- charge ProjectOS et les références canoniques ;
- audite, clarifie et arbitre ;
- conçoit l’architecture, le parcours, les critères et les prompts Codex ;
- révise les branches, tests, risques et Pull Requests ;
- ne remplace pas une implémentation substantielle par des blocs de code dispersés.

### Codex

- réalise tout Build ou changement substantiel ;
- travaille sur une branche dédiée ;
- écrit les fichiers complets, migrations et tests ;
- exécute les tests disponibles ;
- produit un compte rendu temporaire conforme à ProjectOS ;
- prépare une Pull Request vérifiable.

### GitHub

- conserve le code, les ADR, les spécifications, tests, branches, commits et PR ;
- reste la source de vérité unique ;
- permet de recréer Replit sans perte.

### Replit Starter

- clone ou importe le dépôt canonique ;
- installe les dépendances ;
- exécute et teste la PWA ;
- héberge ou déploie ;
- ne développe pas avec son agent IA sauf exception explicite et justifiée.

### Pyto

- conserve son rôle de compagnon local ;
- peut exécuter ou inspecter le prototype historique ;
- gère ultérieurement exports, fichiers et utilitaires iPhone ;
- ne porte plus l’interface principale cible.

### OpenAI API

- est un composant de l’application uniquement ;
- reste derrière une interface fournisseur ;
- n’est pas requise pour les tests de base ;
- ses secrets ne sont jamais versionnés ;
- un produit diffusé utilise un backend sécurisé, jamais une clé exposée dans le client.

## 8. Références canoniques à charger à chaque reprise

Toujours charger :

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
14. le présent `MASTER_BUILD_PROMPT.md` ;
15. les ADR Équilibre applicables.

Charger le code historique de `dalquier/Scriptable` uniquement pour inventaire, migration ou comparaison. Consulter les sept anciens documents Drive `TCC Budy` seulement lorsqu’une décision détaillée n’a pas encore été migrée dans GitHub.

## 9. État actuel vérifié au 4 août 2026

- La Vague 0 ProjectOS a été fusionnée par la PR `dalquier/App-perso#5`.
- Le nom canonique Équilibre et les alias historiques sont enregistrés.
- Quatre ADR ProjectOS fondatrices existent.
- La roadmap et le contrat de travail parallèle existent.
- Les cinq branches de spécification prévues ne sont pas retrouvées.
- Aucun livrable complet des cinq axes n’est vérifié dans `main`.
- Un prototype historique substantiel existe dans `dalquier/Scriptable`.
- Le prototype historique est Pyto/WebView, local-first, SQLite, avec fournisseur OpenAI ou simulateur, historique et tests.
- Les anciens documents Drive contiennent une gouvernance, une roadmap, une architecture, des règles TCC/sécurité et 34 ADR.
- Le dépôt applicatif canonique PWA n’est pas encore matérialisé.
- Aucun déploiement PWA vérifié n’est localisé.

## 10. Décisions déjà prises

- nom canonique : Équilibre ;
- alias historiques fusionnés ;
- personal-first, anonymisable ensuite ;
- PWA iPhone comme interface cible ;
- Replit Starter comme exécution et déploiement ;
- Pyto comme compagnon local ;
- séparation code, protocoles et données personnelles ;
- GitHub source de vérité ;
- API OpenAI derrière une interface fournisseur ;
- mémoire contrôlée et jamais persistée directement par le LLM ;
- mono-utilisateur initial ;
- local-first pour le premier parcours ;
- voix temps réel différée ;
- sécurité active dès le premier usage IA ;
- aucune donnée personnelle réelle dans les sources et tests.

## 11. Décisions encore ouvertes

- dépôt applicatif dédié ou sous-dossier applicatif dans `dalquier/App-perso` ;
- stack PWA précise ;
- stratégie backend minimale pour l’API OpenAI ;
- mécanisme exact de stockage local PWA ;
- modèle d’export et restauration ;
- chiffrement local et gestion des secrets ;
- contenu exact du premier protocole guidé ;
- seuils et formulations des scénarios sensibles ;
- migration ou réécriture des composants Python historiques ;
- politique de synchronisation future.

### Décision proposée pour débloquer BUILD-01

Créer un dépôt applicatif GitHub dédié `dalquier/Equilibre`, tout en conservant la gouvernance dans `dalquier/App-perso/ProjectOS/projects/Equilibre/`.

Cette séparation réduit le risque de mélanger ProjectOS, les autres projets personnels et une application déployable. Elle doit être enregistrée par ADR et dans `PROJECT_REGISTRY.md` avant le premier commit applicatif.

## 12. Fonctionnalités existantes à préserver

Depuis le prototype historique :

- création, ouverture et suppression d’une conversation ;
- historique SQLite ;
- reprise d’une conversation ;
- simulateur local ;
- interface fournisseur OpenAI ;
- séparation UI, application, domaine, providers et stockage ;
- migrations ;
- tests de cœur ;
- absence de secrets et bases personnelles dans le dépôt ;
- gestion explicite des erreurs ;
- comportement adapté au clavier iOS et aux modes clair/sombre comme références UX.

Préserver signifie documenter et comparer. Cela ne signifie pas copier aveuglément du code Pyto dans la PWA.

## 13. Dettes et problèmes connus

- gouvernance historique Drive contradictoire avec GitHub sur la source documentaire canonique ;
- ADR historique Pyto comme plateforme principale remplacée par la cible PWA ;
- ancien nom `TCC Budy` présent dans le code et les interfaces ;
- plusieurs instantanés horodatés du prototype ;
- dossier racine contenant une archive ZIP au lieu d’une arborescence canonique complète ;
- absence de dépôt applicatif PWA ;
- absence de tests PWA et CI ;
- absence de parcours de séance guidée vérifié ;
- mémoire avancée spécifiée mais non construite ;
- règles sensibles non validées par des tests de sécurité ;
- état du prototype sur iPhone réel non prouvé récemment ;
- aucune preuve de déploiement Replit.

## 14. Critères d’acceptation globaux

Une version n’est acceptable que si :

- elle est installable ou utilisable sur iPhone ;
- le parcours principal fonctionne sans donnée personnelle de test ;
- l’utilisateur comprend qu’il interagit avec une IA non thérapeute ;
- les données enregistrées sont visibles, supprimables et contrôlables ;
- la dernière session peut être reprise ;
- le mode dégradé est explicite ;
- un scénario sensible interrompt correctement le parcours ordinaire ;
- aucun secret n’est exposé côté client ou dans GitHub ;
- les tests automatisés pertinents passent ;
- les tests manuels iPhone sont documentés ;
- la branche et la PR sont vérifiables ;
- le retour arrière est décrit ;
- Replit peut être recréé depuis GitHub.

## 15. Stratégie de tests

### Automatisés

- tests unitaires des cas d’usage ;
- tests du stockage et des migrations ;
- tests des contrats fournisseur IA avec simulateur ;
- tests de reprise après rechargement ;
- tests de suppression ;
- tests des règles sensibles déterministes ;
- tests d’absence de données réelles et de secrets dans les fixtures ;
- tests de build PWA et du manifeste installable.

### Fonctionnels

- Safari iPhone ;
- ajout à l’écran d’accueil ;
- navigation au clavier ;
- mode clair et sombre ;
- fonctionnement après fermeture/réouverture ;
- fonctionnement sans réseau lorsque le parcours local le permet ;
- erreur API et mode dégradé ;
- suppression totale des données locales ;
- garde-fou sensible.

### Non-régression historique

Comparer les capacités du prototype Pyto avec la PWA et documenter explicitement ce qui est repris, différé ou abandonné.

## 16. Protection des données

- aucune donnée réelle dans GitHub, PR, issues, tests, logs ou captures ;
- profils fictifs uniquement ;
- minimisation stricte ;
- stockage local par défaut pour BUILD-01 ;
- consentement explicite avant toute future synchronisation ;
- export et suppression accessibles ;
- provenance des données dérivées ;
- séparation faits, hypothèses et mémoires ;
- secrets hors dépôt et hors client public ;
- journaux techniques sans contenu de conversation ;
- politique de rétention documentée avant toute diffusion à des tiers.

## 17. Méthode de livraison

1. ChatGPT vérifie les références vivantes et prépare le Build.
2. Codex crée une branche dédiée depuis la branche canonique à jour.
3. Codex implémente le plus petit changement cohérent.
4. Codex écrit ou adapte les tests.
5. Codex exécute les tests disponibles et documente les limites.
6. Codex ajoute un compte rendu temporaire ProjectOS.
7. Une Pull Request est ouverte.
8. ChatGPT vérifie réellement fichiers, commits, tests et diff.
9. Replit importe la branche pour exécution et test fonctionnel.
10. Les anomalies repartent dans une branche de correction Codex.
11. Après intégration des décisions durables, le compte rendu temporaire est supprimé avant fusion.
12. Aucun changement direct sur `main`.

## 18. Prochaine étape exacte

### Horizon 1 — Remise sous contrôle

Sur la branche `equilibre/recovery-master-build` :

1. ajouter le présent document ;
2. ajouter une note d’audit listant les ressources GitHub et Drive retrouvées ;
3. ajouter une ADR remplaçant explicitement l’ancienne décision Pyto principale par PWA principale / Pyto compagnon ;
4. choisir et enregistrer le dépôt applicatif canonique ;
5. mettre à jour le manifeste et le registre ;
6. ouvrir une PR documentaire unique ;
7. ne lancer BUILD-01 qu’après revue de cette PR.

### Horizon 2 — Premier Build testable

Créer une PWA minimale installable couvrant :

- ouverture ;
- échange écrit simple avec simulateur local ;
- démarrage d’une séance guidée courte ;
- sauvegarde locale contrôlée ;
- reprise de la dernière session ;
- réglages de confidentialité ;
- suppression des données ;
- garde-fou sensible ;
- tests automatisés et instructions Replit.

### Horizon 3 — Enrichissement

Après validation du Build minimal :

- branchement sécurisé de l’API OpenAI ;
- mémoire personnelle explicable ;
- bibliothèque de protocoles ;
- historique structuré ;
- export/restauration ;
- amélioration UX ;
- préparation éventuelle à un usage plus général.

## 19. Prompt de lancement du prochain Build Codex

```text
POS = Active ProjectOS depuis dalquier/App-perso.

Charge ProjectOS/BOOTSTRAP.md et toutes les références obligatoires qu’il désigne. Projet : equilibre / Équilibre. Charge ensuite :

- ProjectOS/projects/Equilibre/PROJECT_MANIFEST.md
- ProjectOS/projects/Equilibre/roadmap.md
- ProjectOS/projects/Equilibre/PARALLEL_WORK_CONTRACT.md
- ProjectOS/projects/Equilibre/MASTER_BUILD_PROMPT.md
- les ADR Équilibre applicables
- standards/CODE_WORK_ROUTING.md
- standards/TESTING.md
- standards/QUALITY_UX_SECURITY.md
- standards/AGENT_HANDOFFS.md

Mission : préparer et réaliser BUILD-01, le plus petit parcours PWA réellement testable sur iPhone.

Avant de coder :
1. Vérifie le dépôt applicatif canonique inscrit dans le registre et le manifeste. S’il n’est pas confirmé, arrête le code et produis uniquement le diagnostic bloquant.
2. Vérifie l’état de la branche de base et les PR ouvertes.
3. Inventorie le prototype historique dalquier/Scriptable/TCC_Budy sans le modifier.
4. Établis une matrice : réutiliser / adapter / réécrire / différer.
5. Ne stocke aucune donnée personnelle réelle et n’ajoute aucun secret.

Branche proposée : equilibre/build-01-minimal-pwa

Périmètre obligatoire :
- shell PWA installable ;
- écran d’accueil simple ;
- échange écrit avec simulateur local ;
- séance guidée courte : situation, émotion, pensée, prochaine action ;
- persistance locale versionnée ;
- reprise de la dernière session ;
- réglages de confidentialité ;
- effacement des données ;
- garde-fou sensible déterministe ;
- tests unitaires et fonctionnels automatisables ;
- documentation de lancement Replit et test iPhone.

Hors périmètre :
- API OpenAI réelle obligatoire ;
- mémoire avancée ;
- embeddings ;
- synchronisation cloud sensible ;
- voix temps réel ;
- comptes utilisateurs ;
- dashboard riche ;
- intégration DeveloperOS ;
- suppression ou renommage du prototype historique.

Livraison :
- fichiers complets dans GitHub ;
- tests exécutés ;
- compte rendu temporaire conforme à ProjectOS ;
- Pull Request vers la branche canonique ;
- risques, limites et retour arrière documentés.
```

## 20. Ne pas faire

- Ne pas repartir de zéro sans inventorier le prototype historique.
- Ne pas conserver Pyto comme interface principale par simple inertie.
- Ne pas copier aveuglément l’architecture Python dans une PWA.
- Ne pas relancer cinq conversations parallèles sans livrable commun et coordination.
- Ne pas créer plusieurs dépôts concurrents.
- Ne pas modifier `main` directement.
- Ne pas développer durablement uniquement dans Replit.
- Ne pas exposer une clé OpenAI dans une PWA publique.
- Ne pas inclure de données réelles dans les tests ou journaux.
- Ne pas introduire une mémoire avancée dans BUILD-01.
- Ne pas commencer par la voix, les embeddings, le multi-utilisateur ou une app native.
- Ne pas présenter Équilibre comme un thérapeute.
- Ne pas transformer une hypothèse du modèle en fait ou mémoire sans validation.
- Ne pas supprimer les instantanés historiques avant migration et archivage documentés.
- Ne pas confondre documents Drive historiques et références canoniques GitHub.
