# Équilibre — BUILD-04 — Architecture et validation

Statut : BUILD-04 en validation. Ce document ne déclare pas le Build intégré dans `main`.

## Objet

BUILD-04 introduit exactement deux protocoles guidés locaux et versionnés :

- `equilibre.protocol.clarify-situation@1.0.0` — Clarifier une situation ;
- `equilibre.protocol.take-small-step@1.0.0` — Faire un petit pas.

Les définitions publiques, les exécutions utilisateur, les `sessionRecords`, la mémoire personnelle et le garde-fou restent séparés.

## Architecture

- `src/protocols/catalog.js` : définitions publiques immuables et registre versionné ;
- `src/protocols/digest.js` : représentation canonique et empreinte SHA-256 ;
- `src/protocols/engine.js` : cycle de vie déterministe des `ProtocolRun` ;
- `src/safety/textGate.js` : normalisation et porte de sécurité avant mutation ;
- `src/storage/localStore.js` : stockage v4, migration, sauvegardes, rollback et anti-résurrection ;
- `src/app.js` : orchestration UI et handlers d'intégration ;
- `src/domain/memory.js` : propositions explicites et provenance de mémoire ;
- `public/sw.js` : shell local hors ligne, sans donnée utilisateur en cache.

Aucun fournisseur IA distant n'est nécessaire à BUILD-04.

## Stockage v4

Clé principale : `equilibre.local.v1`.

Le schéma v4 ajoute `storageRevision` et `protocolRuns`. Il préserve conversations, séance historique, `sessionRecords`, `memoryEntries` et réglages.

Sauvegardes applicatives :

- `equilibre.local.v1.build01.backup` ;
- `equilibre.local.v1.v2.backup` ;
- `equilibre.local.v1.v3.backup` ;
- `equilibre.local.v1.v4.rollback.backup`.

Une donnée inconnue ou un JSON non vide corrompu bloque les écritures au lieu d'être remplacé silencieusement.

## Migration v3 vers v4

1. Lire la valeur brute v3.
2. Transformer et valider le futur état v4 sans modifier la valeur principale.
3. Conserver la valeur brute v3 dans la sauvegarde dédiée si elle n'existe pas déjà.
4. Écrire seulement ensuite l'état v4.
5. Une seconde lecture v4 ne relance pas la migration.

Les anciennes séances BUILD-01 ne sont pas converties automatiquement en protocoles BUILD-04.

## Rollback v4 vers v3

Le rollback technique est réservé au diagnostic ou au retour à BUILD-03 :

1. vérifier qu'une sauvegarde v3 valide existe ;
2. sauvegarder la valeur v4 brute dans `equilibre.local.v1.v4.rollback.backup` ;
3. restaurer la sauvegarde brute v3 dans la clé principale ;
4. remettre en service le bundle BUILD-03 ;
5. vérifier conversations, séances et mémoires ;
6. ne pas injecter les `protocolRuns` v4 dans le schéma v3.

## Sécurité

Toute entrée textuelle pouvant produire un effet doit être normalisée et contrôlée avant mutation. Un contenu bloqué ne doit entrer ni dans l'état, ni dans le stockage, ni dans un résultat, ni dans un record, ni dans une mémoire, ni être transmis à un fournisseur.

Le garde-fou reste local, déterministe, limité et non médical. L'orientation humaine ne constitue pas un diagnostic.

## Service worker BUILD-04

Le cache actif est `equilibre-shell-v5`.

Le worker :

- traite uniquement les requêtes GET same-origin ;
- ne met en cache que les réponses réseau réussies ;
- privilégie le réseau puis le cache ;
- utilise le fallback `/` uniquement pour une navigation ;
- ne transforme pas une ressource manquante en HTML 200 ;
- supprime les anciens caches à l'activation ;
- ne place aucune donnée utilisateur dans Cache Storage.

## Recette Replit sans IA

À exécuter sur le SHA candidat exact :

```bash
cd apps/equilibre
npm ci
npm test
npm run build
npm run dev -- --host 0.0.0.0
```

Puis vérifier : catalogue à deux protocoles, parcours complet des deux protocoles, fermeture/reprise d'un brouillon, abandon, résultat, absence de mémoire automatique, proposition explicite, garde-fou fictif, migration d'une fixture v3, effacement, fonctionnement hors ligne après amorçage.

Aucun agent IA Replit ni Secret Replit n'est requis.

## Recette iPhone physique

Tester séparément Safari et la PWA installée :

1. ouvrir le catalogue et vérifier exactement deux protocoles ;
2. démarrer un protocole et contrôler clavier, scroll, compteur, safe areas ;
3. fermer de force puis reprendre explicitement ;
4. revenir à une étape précédente ;
5. abandonner un brouillon ;
6. terminer un protocole et vérifier résumé/action ;
7. fermer/réouvrir et retrouver le record ;
8. vérifier qu'aucune mémoire n'a été créée automatiquement ;
9. proposer explicitement l'action puis confirmer, corriger et supprimer ;
10. utiliser une fixture sensible fictive et vérifier son absence dans l'historique ;
11. passer en mode Avion, fermer puis relancer la PWA ;
12. exécuter un protocole hors ligne ;
13. revenir en ligne sans doublon ;
14. désactiver/réactiver la persistance et vérifier l'absence de résurrection ;
15. effacer toutes les données dans chaque contexte Safari/PWA ;
16. contrôler clair/sombre/système, grande taille de texte et VoiceOver.

## Preuves attendues avant intégration

- suite automatisée complète verte sur le SHA candidat ;
- build Vite vert ;
- ProjectOS Quality vert ;
- recette Replit réellement exécutée ;
- recette iPhone physique réellement exécutée ;
- rollback réellement exercé dans un environnement de test ;
- absence de secret et de donnée personnelle réelle ;
- risques résiduels documentés.

Les preuves Replit et iPhone restent `NON OBSERVÉES` tant qu'elles n'ont pas été exécutées sur le SHA final convergé.
