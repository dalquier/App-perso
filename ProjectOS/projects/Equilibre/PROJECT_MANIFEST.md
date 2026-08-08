# Équilibre — Project Manifest

## Identité

- ID stable : `equilibre`
- Nom produit : Équilibre
- Alias historiques : TCC Budy, TCC Buddy, TCC_Budy, compagnon TCC
- Statut : BUILD-01, BUILD-02, BUILD-03 et BUILD-04 intégrés dans `main` ; runtime Replit natif et recette iPhone finale encore à stabiliser selon le contrat dédié
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

Les cinq axes suivants restent obligatoires dans chaque revue : produit et UX ; mémoire et données ; moteur TCC ; architecture PWA/Replit/Pyto ; qualité, sécurité et validation. Ils convergent dans un livrable commun piloté par `MASTER_BUILD_PROMPT.md`.

Toute évolution touchant build, serveur, port, service worker, PWA, racine monorepo ou configuration Replit doit relire `docs/REPLIT_RUNTIME_CONTRACT.md`, exécuter le `REPLIT RUNTIME PREFLIGHT` et conserver le Direct Run Smoke.

## État des jalons

- BUILD-01 : intégré, socle PWA et séance historique de compatibilité.
- BUILD-02 : intégré, conversations persistantes locales ; recette iPhone historique validée.
- BUILD-03 : intégré par la PR #53 ; séances structurées et mémoire locale explicitement proposée, confirmable, corrigeable et supprimable.
- BUILD-04 : intégré dans `main` ; deux protocoles versionnés, stockage v4, gates de sécurité transverses, cache `equilibre-shell-v6`, Run Replit versionné, serveur statique Node dédié, Direct Run Smoke CI et polish UX compact.

## Prochain jalon

Stabiliser le runtime Replit natif `Équilibre` depuis `main` conformément au contrat dédié, obtenir une Preview native sans Artifact ni Workflow manuel, rattacher la recette iPhone au SHA canonique, puis préparer les évolutions conversationnelles, protocoles longs et voix selon les analyses dédiées.

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
- runtime Replit natif encore à stabiliser sur iPhone selon le contrat dédié ;
- recette iPhone physique post-BUILD-04 à rattacher au SHA canonique final ;
- scénarios sensibles à valider par des tests dédiés ;
- migration sélective du prototype Pyto à réaliser sans duplication inutile.
