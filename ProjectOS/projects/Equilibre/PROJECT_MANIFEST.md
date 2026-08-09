# Équilibre — Project Manifest

## Identité

- ID stable : `equilibre`
- Nom produit : Équilibre
- Alias historiques : TCC Budy, TCC Buddy, TCC_Budy, compagnon TCC
- Statut : BUILD-01 à BUILD-04 et SESSION-30-A/B intégrés dans `main` ; runtime Replit natif stabilisé ; préparation de `SESSION-30-C`
- Propriétaire : Damien

## Vision

Équilibre est un compagnon personnel assisté par IA, structuré par les thérapies cognitivo-comportementales, destiné d’abord à Damien. Il soutient les situations quotidiennes, les échanges rapides et les séances approfondies, sans se présenter comme un thérapeute humain ni remplacer un professionnel de santé.

## Principes structurants

- personal-first, anonymisable et généralisable ensuite ;
- séparation stricte entre produit, protocoles et données personnelles ;
- aucune donnée personnelle réelle dans GitHub, les tests ou les journaux ;
- mémoire explicable, corrigeable, désactivable et supprimable ;
- PWA iPhone comme interface cible ;
- Replit Starter comme environnement cloud et de déploiement par défaut, régi par `docs/REPLIT_RUNTIME_CONTRACT.md` ;
- Pyto comme compagnon local iPhone pour fichiers, sauvegardes, exports et utilitaires ;
- OpenAI API uniquement comme composant de l’application ;
- sécurité psychologique et confidentialité intégrées dès la conception.

## Références canoniques

- Dépôt unique et source de vérité : `dalquier/App-perso`, branche `main`.
- Gouvernance, manifeste, ADR et spécifications : `ProjectOS/projects/Equilibre/`.
- Script maître : `ProjectOS/projects/Equilibre/MASTER_BUILD_PROMPT.md`.
- Contrat runtime Replit : `ProjectOS/projects/Equilibre/docs/REPLIT_RUNTIME_CONTRACT.md`.
- Architecture conversationnelle consolidée : `ProjectOS/projects/Equilibre/docs/CONVERSATIONAL_ARCHITECTURE_CONVERGENCE.md`.
- Code applicatif : `apps/equilibre/`.
- Prototype historique en lecture seule : `dalquier/Scriptable`, dossiers `TCC_Budy` et instantanés horodatés associés.
- Branche de reprise documentaire : `equilibre/recovery-master-build-clean`.

## Périmètre V1

- échange rapide écrit ;
- séance TCC structurée ;
- historique et reprise ;
- mémoire personnelle contrôlée ;
- premiers protocoles TCC versionnés ;
- PWA installable sur iPhone ;
- garde-fous pour situations sensibles ;
- export et sauvegarde préparés.

## Hors périmètre initial

- diagnostic médical ;
- remplacement d’un thérapeute ;
- multi-utilisateur actif ;
- voix temps réel complète ;
- application native Swift ;
- analyse clinique automatique ;
- intégration à DeveloperOS.

## Conception et convergence

La convergence conversationnelle du Jalon G est canonique dans `docs/CONVERSATIONAL_ARCHITECTURE_CONVERGENCE.md`. Elle relie rôle, sécurité, backend, contexte, mémoire, protocoles courts, séances longues, évaluations, QA et voix future. Les décisions durables de frontière sont consignées dans l'ADR-006.

Toute évolution touchant build, serveur, port, service worker, PWA, racine monorepo ou configuration Replit doit relire `docs/REPLIT_RUNTIME_CONTRACT.md`, exécuter le `REPLIT RUNTIME PREFLIGHT` et conserver le Direct Run Smoke.

## État des jalons

- BUILD-01 : intégré, socle PWA et séance historique de compatibilité.
- BUILD-02 : intégré, conversations persistantes locales ; recette iPhone historique validée.
- BUILD-03 : intégré par la PR #53 ; séances structurées et mémoire locale explicitement proposée, confirmable, corrigeable et supprimable.
- BUILD-04 : intégré dans `main` ; deux protocoles versionnés, stockage v4, gates de sécurité transverses, cache `equilibre-shell-v6`, Run Replit versionné, serveur statique Node dédié, Direct Run Smoke CI et polish UX compact.
- SESSION-30-A : contrats de domaine des séances longues intégrés par la PR #125 au commit `2eaa9425a421967558fd64d1b1f6822f626d872c`.
- SESSION-30-B : moteur structuré local, sept phases, temps actif, pause/reprise, safety et définition S30-02 intégrés par la PR #129, sans persistance ni UI.

## Prochain jalon

Préparer `SESSION-30-C — Persistance et UX iPhone` : arbitrer le stockage des longs transcripts, définir migration et rollback, puis brancher le moteur structuré dans une interface iPhone avec reprise foreground/background. `SessionRecord`, mémoire, provider et voix restent hors de cet incrément.

## Définition de terminé de la reprise

- audit GitHub et Drive effectué ;
- prototype historique localisé et classé comme source de migration ;
- script maître reconstruit ;
- monorepo et chemin applicatif décidés ;
- BUILD-01 à BUILD-04 intégrés ;
- Runtime Contract Replit versionné ;
- aucune donnée personnelle réelle ajoutée.

## Risques ouverts

- dépôt `dalquier/App-perso` public : interdiction stricte de versionner données réelles, secrets, historiques ou exports ;
- exigences cliniques et réglementaires à préciser avant diffusion à des tiers ;
- chiffrement et synchronisation sensible restent à cadrer avant toute diffusion ou stockage distant ;
- browser/offline/accessibilité automatisés à prouver dans un environnement disposant d'un navigateur réel ;
- décision storage-v5/IndexedDB à prendre avant `SESSION-30-C`, sans bloquer `SESSION-30-A` ;
- scénarios sensibles à valider par des tests dédiés ;
- migration sélective du prototype Pyto à réaliser sans duplication inutile.
