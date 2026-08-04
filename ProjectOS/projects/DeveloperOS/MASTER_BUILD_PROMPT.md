# DeveloperOS — MASTER_BUILD_PROMPT

Ce document est le script maître canonique de reprise et de construction de DeveloperOS. Il complète `PROJECT_MANIFEST.md`, l’audit de reprise et les ADR applicables. Toute conversation future doit charger ProjectOS depuis `ProjectOS/BOOTSTRAP.md`, puis ce document avant un Build substantiel.

## 1. Identité et vision
- ID ProjectOS : `developeros`.
- Produit : DeveloperOS.
- Vision : poste de pilotage simple, fiable, local-first et utilisable depuis l’iPhone pour reprendre chaque projet sans dépendre de la mémoire de l’utilisateur.
- Promesse : en moins de quelques secondes, afficher quel projet est actif, où se trouve sa source de vérité, son état, sa priorité et sa prochaine action.

## 2. Utilisateurs cibles
- Utilisateur V1 : Damien, créateur et pilote de plusieurs projets depuis l’iPhone.
- Usage principal : individuel.
- Les équipes, comptes multiples, droits et partage collaboratif sont hors V1.

## 3. Problème traité
Les informations de pilotage sont dispersées entre GitHub, ProjectOS, ChatGPT, Codex, Replit, Pyto, Working Copy et parfois Drive. Les anciennes reprises ont dépendu de conversations introuvables, de copies locales ambiguës et d’interfaces fragiles. DeveloperOS doit créer un point de reprise persistant et compréhensible.

## 4. Périmètre V1
- Liste des projets.
- Projet actif.
- Fiche projet.
- Création et modification.
- État et priorité via vrais contrôles fiables.
- Prochaine action.
- Source canonique.
- Dernier état connu.
- Dates de création et mise à jour.
- Persistance locale après fermeture.
- Recherche et filtre simples.
- Export et import JSON versionnés.
- PWA installable et utilisable hors connexion après premier chargement.

## 5. Hors-périmètre
- IA embarquée ou agent autonome.
- API OpenAI dans le noyau.
- Synchronisation automatique complète GitHub, ChatGPT, Codex, Drive ou Replit.
- RAG et mémoire vectorielle.
- Récupération automatique des conversations.
- Plugins.
- Multi-utilisateur.
- Plusieurs interfaces principales.
- Backend obligatoire pour BUILD-01.

## 6. Architecture cible
- PWA TypeScript principale.
- Interface responsive mobile-first.
- Stockage local structuré dans IndexedDB.
- Couche repository séparant l’interface du stockage.
- Schéma versionné et migrations explicites.
- Service worker et manifeste PWA.
- Export/import JSON comme sauvegarde et voie de migration.
- Replit Starter pour exécution, tests fonctionnels, preview et déploiement.
- Pyto optionnel sous forme de compagnon local, sans dupliquer l’interface.

## 7. Dépôt canonique et branche principale
- Gouvernance : `dalquier/App-perso/main`, dossier `ProjectOS/projects/DeveloperOS/`.
- Dépôt applicatif cible : `dalquier/DeveloperOS`.
- Branche principale applicative : `main` protégée.
- Le dépôt cible doit être créé explicitement après validation de la PR documentaire ; ne jamais le supposer créé.
- Dépôt historique à conserver en lecture et pour extraction : `dalquier/Scriptable`.

## 8. Rôle des outils
- ChatGPT : audit, clarification, architecture, spécification, revue et pilotage.
- Codex : développements substantiels, tests, branche GitHub, commits et Pull Request.
- GitHub : source de vérité du code, de la documentation versionnable, des branches et PR.
- Replit Starter : exécution, tests fonctionnels, preview, hébergement et déploiement ; pas de reconstruction via agent IA.
- Pyto : fonctions locales iPhone ou import/export complémentaires uniquement.
- Working Copy : accès Git local sur iPhone, inspection et opérations contrôlées.
- Google Drive : uniquement pour une ressource explicitement référencée ; jamais requis au fonctionnement.

## 9. Modèle de données
Objet `Project` minimal :
- `id: string` UUID.
- `schemaVersion: number`.
- `name: string`.
- `aliases: string[]`.
- `status: ProjectStatus`.
- `priority: ProjectPriority`.
- `nextAction: string`.
- `canonicalSourceType: github_repo | github_path | local_folder | replit | other`.
- `canonicalSource: string`.
- `lastKnownState: string`.
- `isActive: boolean`.
- `createdAt: ISODateTime`.
- `updatedAt: ISODateTime`.

Enums initiaux :
- états : `idea`, `active`, `blocked`, `paused`, `review`, `completed`, `archived` ;
- priorités : `low`, `normal`, `high`, `critical`.

Contraintes :
- un seul projet actif à la fois dans BUILD-01 ;
- nom obligatoire ;
- prochaine action et source canonique facultatives mais clairement signalées lorsqu’absentes ;
- aucune suppression définitive dans BUILD-01 : archivage seulement.

## 10. Liste des écrans
1. Liste / tableau de bord des projets.
2. Fiche projet.
3. Création / modification.
4. Paramètres minimaux : export, import, version, diagnostic local et réinitialisation protégée.

## 11. Navigation
- Navigation à pile simple, compatible bouton retour navigateur et geste iOS.
- Depuis la liste : ouverture d’une fiche ou ajout.
- Depuis une fiche : retour liste ou modification.
- Depuis l’édition : enregistrer ou annuler sans perdre silencieusement les changements.
- Aucun modal plein écran bloquant sans fermeture visible.

## 12. Comportements UX obligatoires
- Mobile-first pour iPhone récent et largeur réduite.
- Toutes les pages longues sont réellement défilables.
- Les champs restent visibles lorsque le clavier est ouvert.
- Utiliser des contrôles HTML natifs ou composants accessibles éprouvés.
- Aucun faux menu déroulant.
- Cible tactile minimale confortable.
- État focus, pressed, disabled, loading et erreur visible.
- Aucun élément ne paraît cliquable sans action.
- Retour arrière toujours possible.
- Confirmation avant abandon de modifications non enregistrées.
- Messages d’erreur compréhensibles, sans perte de données.
- Respect des safe areas iOS et du mode sombre.
- Une seule décision importante mise en avant par écran.

## 13. Fonctionnalités existantes à préserver
À préserver comme principes ou composants après extraction contrôlée :
- persistance atomique ;
- historique borné ;
- champs branche, dernier commit, dernière PR et blocage pour Builds ultérieurs ;
- sauvegarde avant transformation ;
- diagnostics sûrs ;
- tests automatisés ;
- validation des chemins et interdiction des suppressions automatiques.

## 14. Composants réutilisables
- `Scriptable/DeveloperOS/agent/state.py` : référence pour état durable et historique.
- `Scriptable/DeveloperOS/Builder/` : références pour sauvegarde, workspace et validation, sans reprendre l’orchestration OpenAI.
- PR `dalquier/Scriptable#5` : références pour configuration, santé, diagnostic, logging et discipline de tests, pas comme base directe du frontend.
- Launcher Pro V9 : registre atomique et import/export à réévaluer, sans fusion de produit.

## 15. Bugs connus
- Vue non défilable.
- Clavier masquant les champs.
- Menus de statut non fonctionnels ou bloquants.
- Fenêtre de sélection sans retour.
- Clics sans effet et interface inerte.
- WebView fragile.
- Absence de source canonique claire.
- Données dispersées.
- CI BUILD-1 non prouvée par une exécution GitHub Actions.

## 16. Décisions déjà prises
- DeveloperOS est un poste de pilotage, pas un agent autonome.
- PWA principale avec compagnon Pyto optionnel.
- Local-first et hors connexion.
- Aucun backend nécessaire au premier Build.
- Aucun appel OpenAI dans BUILD-01.
- Le kernel Python historique n’est pas fusionné tel quel.
- Le futur code applicatif doit vivre dans un dépôt dédié après validation.

## 17. Décisions ouvertes
- Framework TypeScript exact : choisir le plus simple permettant tests, accessibilité et PWA robuste ; préférence à React + Vite sauf preuve contraire lors du précontrôle Codex.
- Bibliothèque IndexedDB : native ou wrapper léger ; justifier toute dépendance.
- Nom public du déploiement Replit.
- Méthode ultérieure d’authentification GitHub.
- Format des liens ChatGPT/Codex dans BUILD-02 ou ultérieur.

## 18. Règles de versionnement
- SemVer pour l’application.
- `0.1.0` pour BUILD-01 validé.
- Schéma de données versionné séparément.
- Une branche par Build : `developeros/build-01-project-core`.
- Commits focalisés et descriptifs.
- Aucune fusion automatique.
- Changelog obligatoire.

## 19. Critères d’acceptation
- Créer, consulter et modifier un projet sur iPhone.
- Choisir état et priorité avec des contrôles fiables.
- Enregistrer une prochaine action et une source canonique.
- Données présentes après fermeture et relance.
- Un seul projet actif, avec changement contrôlé.
- Export JSON puis import restaurant fidèlement les données.
- Fonctionnement hors ligne après premier chargement.
- Aucun champ inaccessible à cause du clavier.
- Aucun écran non défilable.
- Retour et annulation fiables.
- Aucun clic inerte.
- Tests automatisés verts et preuves d’exécution documentées.

## 20. Stratégie de tests
- Tests unitaires du modèle, validation et migrations.
- Tests du repository IndexedDB avec environnement simulé adapté.
- Tests composants : formulaire, select, validation, état actif.
- Tests end-to-end mobile : liste, création, édition, persistance, export/import, retour arrière.
- Viewports iPhone étroit et standard.
- Tests clavier/scroll par scénarios E2E lorsque l’outil le permet, complétés par validation réelle sur iPhone.
- Audit accessibilité de base.
- Build de production et lint obligatoires.

## 21. Méthode de déploiement
- Développer et valider sur branche GitHub.
- Importer le dépôt dans Replit Starter.
- Configurer uniquement les commandes d’installation, test, build et preview/deploy.
- Ne pas stocker de secret pour BUILD-01.
- Déployer une preview de PR ou un environnement de validation distinct.
- Déployer la version stable seulement après validation iPhone et fusion revue.

## 22. Plan de retour arrière
- Ne jamais écraser les prototypes historiques.
- Export JSON avant toute migration de schéma.
- Migration réversible lorsque possible ; sinon conserver une copie exportée et documenter la rupture.
- En cas de régression, revenir au dernier tag stable et réimporter les données exportées.
- Replit n’est pas la sauvegarde : le déploiement doit être reproductible depuis GitHub.

## 23. Prochain Build exact
`BUILD-01 — Project Core`

Livrables :
- PWA TypeScript installable ;
- modèle `Project` ;
- IndexedDB ;
- liste, fiche, formulaire et paramètres ;
- recherche/filtre simples ;
- projet actif unique ;
- export/import JSON ;
- offline ;
- tests et documentation ;
- preview Replit après publication de la branche.

## 24. Prompt Codex prêt à lancer

Nom de la discussion : `DeveloperOS — BUILD-01 — Project Core — construire`

Active ProjectOS depuis `dalquier/App-perso`. Charge la dernière version de `ProjectOS/BOOTSTRAP.md`, puis `ProjectOS/projects/DeveloperOS/PROJECT_MANIFEST.md`, `ADR/ADR-001-TARGET-ARCHITECTURE.md`, `docs/RECOVERY_AUDIT.md` et `MASTER_BUILD_PROMPT.md` depuis `main` après fusion de leur Pull Request.

Effectue le précontrôle GitHub obligatoire. Vérifie que le dépôt canonique applicatif `dalquier/DeveloperOS` existe, que `origin/main` est accessible et que tu peux publier une branche et une Pull Request. Si le dépôt n’existe pas ou si la publication n’est pas possible, arrête-toi avant de produire du code et donne le blocage précis.

Crée la branche `developeros/build-01-project-core` depuis le dernier `origin/main`. Construis uniquement `BUILD-01 — Project Core` conformément au script maître. Utilise une PWA TypeScript mobile-first, local-first et installable. Préfère React + Vite sauf raison technique vérifiée et documentée. Implémente IndexedDB derrière une interface repository, un schéma versionné, la liste, la fiche, la création/modification, les vrais contrôles d’état et de priorité, la prochaine action, la source canonique, le projet actif unique, la persistance, l’export/import JSON, le service worker et les états d’erreur.

Ajoute les tests unitaires, composants et end-to-end nécessaires. Vérifie lint, tests, build de production et scénarios mobiles. Documente les commandes, l’architecture, les critères d’acceptation et les preuves d’exécution. Ne configure aucun secret et n’ajoute aucune API OpenAI, synchronisation distante, RAG, plugin ou seconde interface.

Publie tous les fichiers dans GitHub, ouvre une Pull Request vers `main`, ne la fusionne pas et fournis un handoff ProjectOS temporaire avec résultats, limites, captures ou preuves disponibles et prochaine validation iPhone.

## 25. Ne pas faire
- Ne pas modifier `main` directement.
- Ne pas fusionner la PR historique `dalquier/Scriptable#5` comme solution applicative.
- Ne pas reconstruire la Draft autonome ou le Builder OpenAI.
- Ne pas créer simultanément une app Pyto, Swift et PWA.
- Ne pas utiliser une WebView Pyto comme interface principale.
- Ne pas inventer une intégration ChatGPT/Codex non disponible.
- Ne pas rendre Google Drive ou Replit indispensable aux données.
- Ne pas supprimer, renommer ou écraser les prototypes historiques.
- Ne pas ajouter de backend, authentification ou synchronisation avant validation du noyau.
- Ne pas considérer un test déclaré comme preuve sans résultat vérifiable.
