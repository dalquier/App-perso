# DeveloperOS — MASTER_BUILD_PROMPT

Ce document est le script maître canonique de reprise et de construction de DeveloperOS. Toute conversation future charge d’abord `ProjectOS/BOOTSTRAP.md`, puis le manifeste, les ADR applicables et ce document.

## 1. Identité et vision
- ID : `developeros`.
- Produit : DeveloperOS.
- Vision : poste de pilotage simple, fiable, local-first et utilisable depuis l’iPhone pour reprendre chaque projet sans dépendre de la mémoire.
- Promesse : afficher rapidement le projet actif, sa source de vérité, son état, sa priorité et sa prochaine action.

## 2. Utilisateurs cibles
- Utilisateur V1 : Damien.
- Usage individuel, principalement sur iPhone.
- Équipes, comptes multiples et partage collaboratif hors V1.

## 3. Problème traité
Les informations sont dispersées entre GitHub, ProjectOS, ChatGPT, Codex, Replit, Pyto, Working Copy et parfois Drive. DeveloperOS crée un point de reprise persistant, explicite et compréhensible.

## 4. Périmètre V1
- Liste des projets et projet actif.
- Fiche projet.
- Création et modification.
- État et priorité via vrais contrôles fiables.
- Prochaine action, source canonique et dernier état connu.
- Dates de création et mise à jour.
- Recherche et filtre simples.
- Persistance locale.
- Export/import JSON versionné.
- PWA installable et utilisable hors connexion après premier chargement.

## 5. Hors-périmètre
- IA embarquée, agent autonome ou API OpenAI.
- Synchronisation automatique complète avec GitHub, ChatGPT, Codex, Drive ou Replit.
- RAG, plugins, multi-utilisateur et backend obligatoire.
- Plusieurs interfaces principales.

## 6. Architecture cible
- PWA TypeScript mobile-first.
- React + Vite par défaut, sauf raison technique vérifiée.
- IndexedDB derrière une interface repository.
- Schéma versionné et migrations explicites.
- Service worker et manifeste PWA.
- Export/import JSON.
- Replit Starter pour exécution, tests, preview et déploiement.
- Pyto optionnel comme compagnon local, sans dupliquer l’interface.

## 7. Dépôt canonique et branche principale
- Dépôt canonique unique : `dalquier/App-perso`.
- Branche principale : `main`.
- Gouvernance : `ProjectOS/projects/DeveloperOS/`.
- Code applicatif : `apps/developer-os/`.
- Dépôt historique en lecture seule : `dalquier/Scriptable`.
- Aucun dépôt séparé `dalquier/DeveloperOS` pour les premiers Builds.
- Branche logique BUILD-01 : `developeros/build-01-project-core`.

## 8. Rôle des outils
- ChatGPT : audit, architecture, spécification, revue et pilotage.
- Codex : développements substantiels, tests et préparation du diff.
- Interface Codex : publication native de la branche et de la Pull Request après la tâche lorsque le diff est compatible.
- GitHub : source de vérité.
- Replit Starter : exécution, tests fonctionnels, preview et déploiement du sous-dossier `apps/developer-os/`.
- Pyto : fonctions locales iPhone complémentaires uniquement.
- Working Copy : accès Git local contrôlé sur iPhone, application de patch de secours et publication des binaires canoniques lorsque nécessaire.
- Google Drive : seulement si explicitement référencé.

## 9. Modèle de données
Objet `Project` minimal :
- `id: string` UUID ;
- `schemaVersion: number` ;
- `name: string` ;
- `aliases: string[]` ;
- `status: idea | active | blocked | paused | review | completed | archived` ;
- `priority: low | normal | high | critical` ;
- `nextAction: string` ;
- `canonicalSourceType: github_repo | github_path | local_folder | replit | other` ;
- `canonicalSource: string` ;
- `lastKnownState: string` ;
- `isActive: boolean` ;
- `createdAt` et `updatedAt` au format ISO.

Contraintes : un seul projet actif ; nom obligatoire ; aucune suppression définitive dans BUILD-01, archivage seulement.

## 10. Liste des écrans
1. Liste / tableau de bord.
2. Fiche projet.
3. Création / modification.
4. Paramètres : export, import, version, diagnostic local et réinitialisation protégée.

## 11. Navigation
- Pile simple compatible retour navigateur et geste iOS.
- Liste vers fiche ou ajout.
- Fiche vers retour ou modification.
- Édition avec enregistrer ou annuler.
- Aucun modal bloquant sans fermeture visible.

## 12. Comportements UX obligatoires
- Mobile-first, safe areas iOS et mode sombre.
- Pages longues réellement défilables.
- Champs visibles avec clavier ouvert.
- Contrôles HTML natifs ou composants accessibles éprouvés.
- Aucun faux menu, clic inerte ou élément faussement actif.
- Retour toujours possible.
- Confirmation avant abandon de modifications.
- Erreurs compréhensibles et non destructives.
- Une seule décision importante mise en avant par écran.

## 13. Fonctionnalités existantes à préserver
- Persistance atomique.
- Historique borné.
- Champs branche, dernier commit, dernière PR et blocage pour Builds ultérieurs.
- Sauvegarde avant transformation.
- Diagnostics sûrs.
- Tests automatisés.
- Validation des chemins et interdiction des suppressions automatiques.

## 14. Composants réutilisables
- `dalquier/Scriptable/Scriptable/DeveloperOS/agent/state.py` comme référence d’état durable.
- `Scriptable/DeveloperOS/Builder/` pour sauvegarde, workspace et validation, sans orchestration OpenAI.
- PR `dalquier/Scriptable#5` pour discipline de configuration, diagnostic et tests, pas comme base frontend.
- Launcher Pro V9 à réévaluer pour registre atomique et import/export.

## 15. Bugs connus
- Vue non défilable.
- Clavier masquant les champs.
- Menus bloquants ou non fonctionnels.
- Fenêtre sans retour.
- Clics sans effet et vue inerte.
- WebView fragile.
- Données dispersées et source canonique ambiguë.
- CI du kernel historique non prouvée.
- Publication native Codex refusant certains fichiers binaires si aucune stratégie n’a été choisie avant leur création.

## 16. Décisions déjà prises
- DeveloperOS est un poste de pilotage, pas un agent autonome.
- PWA principale, local-first et hors connexion.
- Pyto compagnon optionnel.
- Aucun backend ni OpenAI dans BUILD-01.
- Monorepo `dalquier/App-perso`.
- Gouvernance et code séparés par chemins : `ProjectOS/projects/DeveloperOS/` et `apps/developer-os/`.
- Le kernel Python historique n’est pas fusionné tel quel.
- Les Builds Codex utilisent la publication native de l’interface après production d’un diff compatible.
- Les actifs binaires générables sont produits de manière déterministe à partir de sources textuelles versionnées.

## 17. Décisions ouvertes
- Wrapper IndexedDB natif ou dépendance légère.
- Nom public du déploiement Replit.
- Méthode ultérieure d’authentification GitHub dans l’application.
- Format des liens ChatGPT/Codex pour BUILD-02 ou ultérieur.

## 18. Règles de versionnement
- SemVer ; `0.1.0` pour BUILD-01 validé.
- Schéma de données versionné séparément.
- Une branche ou une Pull Request par Build.
- Commits focalisés.
- Une branche technique `codex/...` est acceptable si elle est liée à la tâche et cible `main`.
- Aucune fusion automatique.
- Changelog obligatoire.

## 19. Critères d’acceptation
- Créer, consulter et modifier un projet sur iPhone.
- Choisir état et priorité avec des contrôles fiables.
- Enregistrer prochaine action et source canonique.
- Persistance après fermeture et relance.
- Projet actif unique.
- Export puis import fidèle.
- Fonctionnement hors connexion.
- Aucun champ inaccessible, écran non défilable, clic inerte ou retour cassé.
- Tests automatisés verts avec preuves d’exécution.
- Diff compatible avec le canal de publication choisi.
- Actifs PWA obligatoires présents dans l’artefact final et reconstructibles.

## 20. Stratégie de tests
- Tests unitaires du modèle, validation et migrations.
- Tests repository IndexedDB.
- Tests composants du formulaire, select, validation et projet actif.
- Tests E2E mobiles : liste, création, édition, persistance, export/import et retour.
- Viewports iPhone étroit et standard.
- Audit accessibilité de base.
- Lint et build de production obligatoires.
- Contrôle du diff, des binaires et des artefacts générés.
- Validation réelle sur iPhone avant fusion.

## 21. Méthode de déploiement
- Construire dans Codex sur le sandbox lié à `dalquier/App-perso/main`.
- Choisir au début le mode de livraison défini dans `CODEX_NATIVE_PUBLISHING.md`.
- Publier la branche et la Pull Request par le menu GitHub natif de Codex seulement si le diff est compatible.
- Utiliser Working Copy ou un client Git compatible si un binaire canonique doit être versionné.
- Importer ensuite `dalquier/App-perso` dans Replit Starter.
- Configurer les commandes dans `apps/developer-os/` : installation, tests, build et preview/deploy.
- Aucun secret pour BUILD-01.
- Preview avant validation iPhone ; stable seulement après revue et fusion.

## 22. Plan de retour arrière
- Ne jamais écraser les prototypes historiques.
- Export JSON avant migration de schéma.
- Revenir au dernier tag stable en cas de régression.
- Replit n’est pas une sauvegarde ; tout déploiement doit être reproductible depuis GitHub.
- En cas d’échec de publication Codex, conserver le diff, identifier si la cause est le canal ou un binaire, puis utiliser la stratégie compatible sans reconstruire le Build.

## 23. Prochain Build exact
`BUILD-01 — Project Core`

Livrables sous `apps/developer-os/` : PWA TypeScript installable, modèle Project, IndexedDB, liste, fiche, formulaire, paramètres, recherche/filtre, projet actif, export/import, offline, tests et documentation.

## 24. Actifs PWA et publication Codex

Les icônes PNG requises par iOS et la PWA doivent être obtenues par une génération déterministe à partir d’une source textuelle versionnée lorsque la tâche utilise la publication native Codex.

Les PNG générés :

- ne sont pas suivis par Git ;
- sont produits avant les tests PWA et le build ;
- doivent être présents dans l’artefact `dist/` ;
- sont contrôlés pour leurs dimensions, formats, noms et chemins ;
- sont documentés avec leur commande de génération.

Si une ressource binaire doit être versionnée, la tâche annonce avant implémentation que la publication utilisera un client Git prenant en charge les binaires.

Avant la réponse finale, contrôler la nature du diff avec les références réellement disponibles. Utiliser une référence de base locale fiable si elle existe ; sinon employer `git diff --numstat`, `git diff --cached --numstat` et un inventaire des extensions. Indiquer les commandes exécutées, les fichiers binaires détectés, leur stratégie, le canal de publication et les limites du contrôle.

## 25. Prompt Codex prêt à lancer

```text
Nom de la discussion : DeveloperOS — BUILD-01 — Project Core — construire

POS = Active ProjectOS depuis `dalquier/App-perso`.

L’environnement Codex est relié au dépôt GitHub `dalquier/App-perso` avec `main` comme branche de base.

Travaille dans le sandbox fourni par Codex.
Ne vérifie pas GH_TOKEN ou GITHUB_TOKEN.
Ne lance pas gh auth login.
Ne tente pas git push depuis le terminal.
Ne considère pas l’absence de remote origin, d’upstream, de origin/main ou de credentials Git dans le terminal comme bloquante.
Ne demande pas au sandbox de prouver que les boutons de publication de l’interface existent.
Produis les modifications, exécute les tests et prépare un diff propre.
La publication de la branche et de la Pull Request sera réalisée avec le mécanisme natif de Codex après la tâche si le diff est compatible.
Ne modifie jamais directement main.
Ne fusionne jamais la Pull Request.

Charge :
- `ProjectOS/BOOTSTRAP.md` ;
- toutes les références obligatoires qu’il désigne ;
- `ProjectOS/standards/CODEX_NATIVE_PUBLISHING.md` ;
- `ProjectOS/projects/DeveloperOS/PROJECT_MANIFEST.md` ;
- `ProjectOS/projects/DeveloperOS/MASTER_BUILD_PROMPT.md` ;
- `ProjectOS/projects/DeveloperOS/ADR/ADR-001-TARGET-ARCHITECTURE.md` ;
- `ProjectOS/projects/DeveloperOS/ADR/ADR-002-APP-PERSO-MONOREPO.md` ;
- `ProjectOS/projects/DeveloperOS/docs/RECOVERY_AUDIT.md`.

Vérifie uniquement que :
1. le dépôt et la branche de base indiqués par l’environnement correspondent au projet ;
2. les références attendues sont présentes ;
3. l’arbre de travail initial est propre ou les changements préexistants sont identifiés ;
4. le périmètre autorisé est compris ;
5. les dépendances et tests nécessaires sont exécutables ;
6. les fichiers attendus sont inventoriés, les formats binaires sont identifiés et le mode `codex-native-text`, `codex-native-generated-assets` ou `git-binary-capable` est choisi avant création.

Construis uniquement `BUILD-01 — Project Core` sous `apps/developer-os/`.

Utilise une PWA TypeScript mobile-first, local-first et installable, de préférence React + Vite. Implémente IndexedDB derrière un repository, un schéma versionné, la liste, la fiche, la création et modification, de vrais contrôles d’état et priorité, la prochaine action, la source canonique, le projet actif unique, la persistance, la recherche, le filtre, l’export/import JSON, le service worker et les états d’erreur.

Pour les icônes PNG iOS/PWA en publication native Codex, versionne une source textuelle et un script déterministe ; génère les PNG avant tests/build, ignore-les dans Git et vérifie leur présence dans `dist/`.

Ajoute et exécute les tests unitaires, composants, repository IndexedDB et E2E mobiles. Vérifie lint, TypeScript, build de production, PWA, fonctionnement hors connexion et ressources générées. Documente les commandes Replit en ciblant `apps/developer-os/`.

Ne configure aucun secret et n’ajoute ni OpenAI, ni synchronisation distante, ni RAG, ni plugin, ni seconde interface.

Avant la réponse finale, crée le handoff temporaire ProjectOS requis. Contrôle la nature du diff avec les références réellement disponibles : utilise une référence de base locale fiable si elle existe, sinon `git diff --numstat`, `git diff --cached --numstat` et un inventaire des extensions. Termine avec :
- le résumé complet ;
- les fichiers modifiés ;
- les tests réellement exécutés et leurs résultats ;
- les limites restantes ;
- les commandes de contrôle du diff réellement exécutées ;
- les fichiers binaires prévus ou détectés, leur stratégie et le canal compatible ;
- le nom logique de branche `developeros/build-01-project-core` ;
- un titre et un corps complets de Pull Request vers `main` ;
- l’indication que le diff est prêt à être publié par le canal identifié.
```

## 26. Ne pas faire
- Ne pas modifier `main` directement.
- Ne pas créer un dépôt séparé `dalquier/DeveloperOS`.
- Ne pas placer le code applicatif dans `ProjectOS/projects/DeveloperOS/`.
- Ne pas fusionner la PR historique `dalquier/Scriptable#5` comme solution applicative.
- Ne pas reconstruire la Draft autonome ou le Builder OpenAI.
- Ne pas créer simultanément une app Pyto, Swift et PWA.
- Ne pas utiliser une WebView Pyto comme interface principale.
- Ne pas rendre Google Drive ou Replit indispensable aux données.
- Ne pas commettre de clé, `.env`, donnée personnelle, export réel, journal utilisateur ou capture sensible dans le dépôt public.
- Ne pas supprimer, renommer ou écraser les prototypes historiques.
- Ne pas bloquer un Build Codex Cloud à cause de l’absence de remote, d’upstream, de credentials Git ou de référence de base exploitable dans le sandbox.
- Ne pas ajouter de binaire au diff natif Codex sans stratégie compatible.
- Ne pas encoder un binaire en Base64 pour contourner le canal de publication.
