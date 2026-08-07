# DeveloperOS — BUILD-02R — Reprise manuelle et références sécurisées

## Périmètre et reconstruction

BUILD-02R reconstruit sur la `main` vivante la valeur du BUILD-02 perdu, sans réutiliser d’ancien SHA ni reproduire un diff inconnu. Depuis la fiche d’un projet non archivé, l’utilisateur enregistre un point de reprise, consulte au plus 100 entrées horodatées, et gère jusqu’à 100 références manuelles. Aucune navigation principale, backend, synchronisation ou fonction Conversations Codex n’est modifiée.

## Architecture et modèle

Les données restent imbriquées dans le record `Project` :

- `resumeText` et `resumeUpdatedAt` décrivent la reprise courante ;
- `resumeHistory[]` contient `id`, `text`, `createdAt`, plus récent en tête ;
- `references[]` contient `id`, `label`, `url`, `createdAt`, `updatedAt`.

`addResume` centralise trim, validation, absence de doublon consécutif, immutabilité, mise à jour de `updatedAt` et élagage déterministe à 100. `addReference`, `removeReference` et `validateReferenceUrl` centralisent les références. Les projets archivés sont en lecture seule jusqu’à restauration.

## Sécurité URL

Une référence doit être une URL absolue analysable par `URL`, de protocole strictement `https:`, sans nom d’utilisateur ni mot de passe. Les URL relatives et protocoles `http:`, `javascript:`, `data:`, `file:` ou autres sont refusés avec un message lisible. L’interface ne charge aucun contenu distant et n’ouvre un lien qu’après clic sur `Ouvrir`, dans un nouvel onglet avec `rel="noopener noreferrer"`.

## Persistance, migration et compatibilité

IndexedDB reste en version 2 : les données sont contenues dans `projects`, donc aucun store ou index supplémentaire n’est requis. `normalizeProject` ajoute en mémoire des valeurs vides aux records BUILD-01 dépourvus des nouveaux champs ; elle est idempotente et appliquée à chaque lecture et sauvegarde. Aucun store n’est supprimé ni recréé.

Le contrat d’export projet reste au schéma 1 afin que les anciens exports restent importables. À l’import, les champs absents sont normalisés, les champs BUILD-02R sont validés intégralement, et le remplacement atomique ne concerne que `projects`. Une sauvegarde JSON est proposée avant confirmation. Le store `codexConversations` n’entre jamais dans la transaction de remplacement : les conversations restent intactes. Leur export/import dédié continue d’utiliser une fusion par identifiant où seule une version importée plus récente remplace la locale.

## Tests automatisés prévus

- domaine Project : limites 99→100 et 100→101, ordre, dates, immutabilité, doublon, archive ;
- validation des URL et références ;
- composants Reprise et Références, double clic, attributs d’ouverture et confirmation de suppression ;
- repository : normalisation legacy, persistance et conservation de `codexConversations` ;
- exports BUILD-01 et BUILD-02R ;
- suites Codex existantes, PWA, build et E2E mobile.

## Recette Replit Starter, sans agent IA

1. Importer la branche de la PR dans Replit Starter.
2. Dans `apps/developer-os`, exécuter `npm ci`, puis `npm run check`.
3. Exécuter `npm run build`, puis `npm run preview -- --port 4173`.
4. Exécuter `npm run test:e2e` contre le preview.
5. Vérifier dans DevTools > Application que la base `developeros` reste v2 et contient les stores `projects` et `codexConversations`.
6. Ne déployer qu’après réussite et conserver l’export JSON pré-recette.

## Recette iPhone

1. Ouvrir une fiche projet non archivée.
2. Saisir et enregistrer un point dans **Reprise**.
3. Recharger Safari ou relancer la PWA.
4. Vérifier la reprise courante et l’historique du plus récent au plus ancien.
5. Ajouter un libellé et une URL HTTPS dans **Références**.
6. Toucher explicitement **Ouvrir** et vérifier l’ouverture dans Safari.
7. Toucher **Supprimer**, annuler une première fois, puis confirmer.
8. Vérifier lisibilité et contrastes en mode sombre.
9. Avec le clavier ouvert, vérifier que champs, bouton, historique et retour restent accessibles par scroll.
10. Exporter depuis Paramètres, puis réimporter après avoir conservé la sauvegarde préalable ; vérifier reprise et références.
11. Ouvrir Conversations Codex et vérifier qu’une conversation préexistante est toujours présente.

## Risques et rollback

Les données locales réelles ne sont pas incluses dans Git. Avant recette, exporter les projets et les Conversations Codex via leurs écrans respectifs. Le rollback code consiste à revenir le commit BUILD-02R ; les champs additionnels restent ignorables par le code antérieur. Un export créé avec BUILD-02R ne doit toutefois pas être réimporté dans une version antérieure stricte sans conserver une copie. Risques résiduels : recette tactile/Safari réelle, comportement de téléchargement PWA iOS et limite physique du stockage IndexedDB.

## Différence avec BUILD-02 perdu

Cette reconstruction prend pour base le schéma v2 et le module Conversations Codex déjà présents. Elle choisit volontairement une extension du record `Project`, sans nouveau store ni montée de version IndexedDB, et démontre la non-destruction du store Codex. Elle prouve la valeur attendue actuelle ; elle ne prétend ni retrouver ni reproduire l’implémentation disparue.
