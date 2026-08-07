# Équilibre — Project Manifest

## Identité

- ID stable : `equilibre`
- Nom produit : Équilibre
- Alias historiques : TCC Budy, TCC Buddy, TCC_Budy, compagnon TCC
- Statut : BUILD-01, BUILD-02 et BUILD-03 intégrés ; V4 / BUILD-04 construite sur `equilibre/build-04-main-integration`, non intégrée à `main`, QA iPhone requise
- Propriétaire : Damien

## Vision

Équilibre est un compagnon personnel assisté par IA, structuré par les thérapies cognitivo-comportementales, destiné d’abord à Damien. Il soutient les situations quotidiennes, les échanges rapides et les séances approfondies, sans se présenter comme un thérapeute humain ni remplacer un professionnel de santé.

## Principes structurants

- personal-first, anonymisable et généralisable ensuite ;
- séparation stricte entre produit, protocoles et données personnelles ;
- aucune donnée personnelle réelle dans GitHub, les tests ou les journaux ;
- mémoire explicable, corrigeable, désactivable et supprimable ;
- PWA iPhone comme interface cible ;
- Replit Starter comme environnement cloud et de déploiement par défaut ;
- Pyto comme compagnon local iPhone pour fichiers, sauvegardes, exports et utilitaires ;
- OpenAI API uniquement comme composant de l’application ;
- sécurité psychologique et confidentialité intégrées dès la conception.

## Références canoniques

- Dépôt unique et source de vérité : `dalquier/App-perso`, branche `main`.
- Gouvernance, manifeste, ADR et spécifications : `ProjectOS/projects/Equilibre/`.
- Script maître : `ProjectOS/projects/Equilibre/MASTER_BUILD_PROMPT.md`.
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

## État des jalons

- BUILD-01 : intégré, socle PWA et séance historique de compatibilité.
- BUILD-02 : intégré, conversations persistantes locales ; recette iPhone historique validée.
- BUILD-03 : intégré par la PR #53 ; séances structurées et mémoire locale explicitement proposée, confirmable, corrigeable et supprimable.
- V4 / BUILD-04 : reconstruite sémantiquement sur la `main` au SHA `3c1d372d81b3007caf34f05aaedb0df1a49e2ed0`. La branche candidate ajoute deux protocoles versionnés, le stockage v4, les gates de sécurité transverses, le cache `equilibre-shell-v5` et un lancement Replit reproductible. Elle reste non intégrée tant que sa Draft PR n'est pas fusionnée.

## Prochain jalon

Exécuter la recette iPhone physique sur le SHA final de la Draft PR BUILD-04, rattacher les preuves au même SHA, puis appliquer le Merge Gate ProjectOS sans fusion automatique.

## Définition de terminé de la reprise

- audit GitHub et Drive effectué ;
- prototype historique localisé et classé comme source de migration ;
- script maître reconstruit ;
- monorepo et chemin applicatif décidés ;
- branche et Pull Request documentaires créées ;
- prompt Codex de BUILD-01 défini ;
- aucune donnée personnelle réelle ajoutée.

## Risques ouverts

- dépôt `dalquier/App-perso` public : interdiction stricte de versionner données réelles, secrets, historiques ou exports ;
- exigences cliniques et réglementaires à préciser avant diffusion à des tiers ;
- chiffrement et synchronisation sensible restent à cadrer avant toute diffusion ou stockage distant ;
- recette iPhone physique BUILD-04 non observée sur le SHA candidat final ;
- scénarios sensibles à valider par des tests dédiés ;
- migration sélective du prototype Pyto à réaliser sans duplication inutile.
