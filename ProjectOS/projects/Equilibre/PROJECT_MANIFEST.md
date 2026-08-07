# Équilibre — Project Manifest

## Identité

- ID stable : `equilibre`
- Nom produit : Équilibre
- Alias historiques : TCC Budy, TCC Buddy, TCC_Budy, compagnon TCC
- Statut : BUILD-01, BUILD-02 et BUILD-03 intégrés ; BUILD-04 en validation avant intégration
- Propriétaire : Damien

## Vision

Équilibre est un compagnon personnel assisté par IA, structuré par les thérapies cognitivo-comportementales, destiné d’abord à Damien. Il soutient les situations quotidiennes, les échanges rapides et les séances approfondies, sans se présenter comme un thérapeute humain ni remplacer un professionnel de santé.

## Principes structurants

- personal-first, anonymisable et généralisable ensuite ;
- séparation stricte entre produit, protocoles et données personnelles ;
- aucune donnée personnelle réelle dans GitHub, les tests ou les journaux ;
- mémoire explicable, corrigeable, désactivable et supprimable ;
- PWA iPhone comme interface cible ;
- Replit Starter comme environnement d'exécution et de recette, jamais source de vérité ;
- Pyto comme compagnon local iPhone pour fichiers, sauvegardes, exports et utilitaires ;
- OpenAI API uniquement comme composant futur derrière une interface fournisseur ;
- sécurité psychologique et confidentialité intégrées dès la conception.

## Références canoniques

- Dépôt unique et source de vérité : `dalquier/App-perso`, branche `main`.
- Gouvernance, manifeste, ADR et spécifications : `ProjectOS/projects/Equilibre/`.
- Script maître : `ProjectOS/projects/Equilibre/MASTER_BUILD_PROMPT.md`.
- Code applicatif : `apps/equilibre/`.
- Prototype historique en lecture seule : `dalquier/Scriptable`, dossiers `TCC_Budy` et instantanés horodatés associés.

## Périmètre V1

- échange rapide écrit ;
- séance structurée et historique ;
- historique et reprise ;
- mémoire personnelle contrôlée ;
- deux premiers protocoles guidés versionnés ;
- PWA installable sur iPhone ;
- garde-fous pour situations sensibles ;
- migration, rollback, effacement et fonctionnement hors ligne préparés.

## Hors périmètre initial

- diagnostic médical ;
- remplacement d’un thérapeute ;
- multi-utilisateur actif ;
- voix temps réel complète ;
- application native Swift ;
- analyse clinique automatique ;
- synchronisation cloud sensible ;
- intégration à DeveloperOS.

## Builds

- BUILD-01 : intégré — shell PWA, séance legacy, persistance, réglages, garde-fou.
- BUILD-02 : intégré — conversations persistantes et streaming local.
- BUILD-03 : intégré via PR #53 — séances structurées et mémoire contrôlée.
- BUILD-04 : en validation — protocoles versionnés, stockage v4, sécurité transversale, UI protocoles et service worker renforcé.

BUILD-04 ne doit être déclaré intégré qu'après convergence finale, suite automatisée verte sur le SHA candidat et recettes manuelles requises.

## Prochain jalon

Clore BUILD-04 : convergence C1+C2+C3, validation GitHub commune, recette Replit sans IA, recette iPhone Safari/PWA et vérification du rollback. Le jalon suivant ne doit être cadré qu'après cette clôture.

## Risques ouverts

- dépôt public : interdiction stricte de versionner données réelles, secrets, historiques ou exports ;
- garde-fou déterministe non exhaustif et non médical ;
- stockage local navigateur non chiffré ;
- Safari et PWA pouvant disposer de contextes de stockage distincts ;
- recettes physiques BUILD-04 non acquises tant qu'elles n'ont pas été exécutées sur le SHA final convergé.
