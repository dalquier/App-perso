# Équilibre — Project Manifest

## Identité

- ID stable : `equilibre`
- Nom produit : Équilibre
- Alias historiques : TCC Budy, TCC Buddy, TCC_Budy, compagnon TCC
- Statut : initialisation documentaire — Vague 0
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
- Code applicatif : dépôt ou dossier à confirmer avant `BUILD-01`.
- Branche de Vague 0 : `equilibre/init-wave-0`.

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

## Chantiers parallèles de conception

1. Produit et UX ;
2. Mémoire et données ;
3. Moteur TCC ;
4. Architecture PWA/Replit/Pyto ;
5. Qualité, sécurité et validation.

Leur contrat commun est défini dans `PARALLEL_WORK_CONTRACT.md`.

## Prochain jalon

`MILESTONE-A` — produire cinq spécifications parallèles cohérentes, puis effectuer une revue de convergence avant tout code applicatif.

## Définition de terminé de la Vague 0

- registre unifié ;
- manifeste créé ;
- décisions structurantes enregistrées en ADR ;
- contrat de parallélisation publié ;
- roadmap initiale publiée ;
- Pull Request relue et fusionnée dans `main`.

## Risques ouverts

- dépôt canonique du code applicatif non encore choisi ;
- exigences cliniques et réglementaires à préciser avant diffusion à des tiers ;
- modèle de stockage et chiffrement non encore arbitré ;
- coûts et limites de la voix temps réel non encore évalués.
