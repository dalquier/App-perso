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
- Branche BUILD-01 : `developeros/build-01-project-core`.

## 8. Rôle des outils
- ChatGPT : audit, architecture, spécification, revue et pilotage.
- Codex : développements substantiels, tests, commits et Pull Request.
- GitHub : source de vérité.
- Replit Starter : exécution, tests fonctionnels, preview et déploiement du sous-dossier `apps/developer-os/`.
- Pyto : fonctions locales iPhone complémentaires uniquement.
- Working Copy : accès Git local contrôlé sur iPhone.
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

## 16. Décisions déjà prises
- DeveloperOS est un poste de pilotage, pas un agent autonome.
- PWA principale, local-first et hors connexion.
- Pyto compagnon optionnel.
- Aucun backend ni OpenAI dans BUILD-01.
- Monorepo `dalquier/App-perso`.
- Gouvernance et code séparés par chemins : `ProjectOS/projects/DeveloperOS/` et `apps/developer-os/`.
- Le kernel Python historique n’est pas fusionné tel quel.

## 17. Décisions ouvertes
- Wrapper IndexedDB natif ou dépendance légère.
- Nom public du déploiement Replit.
- Méthode ultérieure d’authentification GitHub.
- Format des liens ChatGPT/Codex pour BUILD-02 ou ultérieur.

## 18. Règles de versionnement
- SemVer ; `0.1.0` pour BUILD-01 validé.
- Schéma de données versionné séparément.
- Une branche par Build.
- Commits focalisés.
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

## 20. Stratégie de tests
- Tests unitaires du modèle, validation et migrations.
- Tests repository IndexedDB.
- Tests composants du formulaire, select, validation et projet actif.
- Tests E2E mobiles : liste, création, édition, persistance, export/import et retour.
- Viewports iPhone étroit et standard.
- Audit accessibilité de base.
- Lint et build de production obligatoires.
- Validation réelle sur iPhone avant fusion.

## 21. Méthode de déploiement
- Développer sur branche GitHub.
- Importer `dalquier/App-perso` dans Replit Starter.
- Configurer les commandes dans `apps/developer-os/` : installation, tests, build et preview/deploy.
- Aucun secret pour BUILD-01.
- Preview avant validation iPhone ; stable seulement après revue et fusion.

## 22. Plan de retour arrière
- Ne jamais écraser les prototypes historiques.
- Export JSON avant migration de schéma.
- Revenir au dernier tag stable en cas de régression.
- Replit n’est pas une sauvegarde ; tout déploiement doit être reproductible depuis GitHub.

## 23. Prochain Build exact
`BUILD-01 — Project Core`

Livrables sous `apps/developer-os/` : PWA TypeScript installable, modèle Project, IndexedDB, liste, fiche, formulaire, paramètres, recherche/filtre, projet actif, export/import, offline, tests et documentation.

## 24. Prompt Codex prêt à lancer

Nom de la discussion : `DeveloperOS — BUILD-01 — Project Core — construire`

Active ProjectOS depuis `dalquier/App-perso`. Charge `ProjectOS/BOOTSTRAP.md`, puis `ProjectOS/projects/DeveloperOS/PROJECT_MANIFEST.md`, les ADR applicables, `docs/RECOVERY_AUDIT.md` et `MASTER_BUILD_PROMPT.md` depuis `main`.

Effectue le précontrôle GitHub obligatoire. Vérifie `origin/main`, le dépôt canonique `dalquier/App-perso`, la possibilité de publier une branche et une Pull Request, ainsi que l’absence de modifications non liées. Crée `developeros/build-01-project-core` depuis le dernier `origin/main`.

Construis uniquement `BUILD-01 — Project Core` dans `apps/developer-os/`. N’ajoute aucun code applicatif dans `ProjectOS/projects/DeveloperOS/`. Utilise une PWA TypeScript mobile-first, local-first et installable, de préférence React + Vite. Implémente IndexedDB derrière un repository, schéma versionné, liste, fiche, création/modification, vrais contrôles d’état et priorité, prochaine action, source canonique, projet actif unique, persistance, export/import JSON, service worker et états d’erreur.

Ajoute tests unitaires, composants et E2E. Vérifie lint, tests, build et scénarios mobiles. Documente les commandes Replit en ciblant `apps/developer-os/`. Ne configure aucun secret et n’ajoute ni OpenAI, ni synchronisation distante, ni RAG, ni plugin, ni seconde interface.

Publie tous les fichiers dans GitHub, ouvre une Pull Request vers `main`, ne la fusionne pas et fournis un handoff ProjectOS temporaire avec résultats, limites et prochaine validation iPhone.

## 25. Ne pas faire
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
