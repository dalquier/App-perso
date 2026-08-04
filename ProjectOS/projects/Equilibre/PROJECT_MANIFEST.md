# Équilibre — Project Manifest

## Identité

- ID stable : `equilibre`
- Nom produit : Équilibre
- Alias historiques : TCC Budy, TCC Buddy, TCC_Budy, compagnon TCC
- Statut : reprise définie — préparation de BUILD-01
- Propriétaire : Damien

## Vision

Équilibre est un compagnon personnel assisté par IA, structuré par les thérapies cognitivo-comportementales, destiné d’abord à Damien. Il doit soutenir les situations quotidiennes, les échanges rapides et les séances approfondies, sans se présenter comme un thérapeute humain ni remplacer un professionnel de santé.

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

- Gouvernance, manifeste, ADR et spécifications : `dalquier/App-perso`, branche `main`, dossier `ProjectOS/projects/Equilibre/`.
- Script maître de construction : `ProjectOS/projects/Equilibre/MASTER_BUILD_PROMPT.md`.
- Code applicatif décidé : dépôt dédié `dalquier/Equilibre`, à matérialiser avant le premier commit de BUILD-01.
- Prototype historique en lecture seule : `dalquier/Scriptable`, dossiers `TCC_Budy` et instantanés horodatés associés.
- Branche de reprise documentaire : `equilibre/recovery-master-build`.

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

Les cinq axes historiques restent des dimensions obligatoires de revue :

1. Produit et UX ;
2. Mémoire et données ;
3. Moteur TCC ;
4. Architecture PWA/Replit/Pyto ;
5. Qualité, sécurité et validation.

Ils ne doivent pas être relancés comme cinq chantiers indépendants sans coordination. Leur convergence est portée par `MASTER_BUILD_PROMPT.md` et par une livraison commune avant BUILD-01.

## Prochain jalon

`BUILD-01 — PWA minimale testable` : matérialiser `dalquier/Equilibre`, créer une PWA installable sur iPhone, intégrer un simulateur local, une séance guidée courte, une persistance locale contrôlée, la reprise, les réglages de confidentialité et un garde-fou sensible.

## Définition de terminé de la reprise

- audit GitHub et Drive effectué ;
- prototype historique localisé et classé comme source de migration ;
- script maître reconstruit ;
- dépôt applicatif décidé ;
- branche et Pull Request documentaires créées ;
- prompt Codex de BUILD-01 défini ;
- aucune donnée personnelle réelle ajoutée.

## Risques ouverts

- dépôt `dalquier/Equilibre` décidé mais pas encore physiquement créé ;
- exigences cliniques et réglementaires à préciser avant diffusion à des tiers ;
- modèle de stockage et chiffrement à durcir après BUILD-01 ;
- scénarios sensibles à valider par des tests dédiés ;
- migration sélective du prototype Pyto à réaliser sans duplication inutile ;
- coûts et limites de la voix temps réel non évalués, fonctionnalité différée.
