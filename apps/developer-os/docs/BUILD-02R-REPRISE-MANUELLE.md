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

DeveloperOS utilise désormais IndexedDB en version 3, avec les stores `projects`, `codexConversations` et `conversation-runs`. BUILD-02R n’ajoute aucun store ni aucune nouvelle montée de version : les nouvelles données restent contenues dans les records `Project` du store `projects`. Le schéma et la création non destructive des stores restent centralisés dans `indexedDbSchema.ts`.

`normalizeProject` ajoute en mémoire des valeurs vides aux anciens records dépourvus des nouveaux champs ; elle est idempotente et appliquée aux lectures et sauvegardes. Une base legacy v2 est migrée vers v3 sans destruction des projets ni des conversations Codex, et le store `conversation-runs` est créé par le schéma vivant.

Le contrat d’export projet reste au schéma 1 afin que les anciens exports restent importables. À l’import, les champs absents sont normalisés, les champs BUILD-02R sont validés intégralement, et le remplacement atomique concerne uniquement le store `projects`. Les stores `codexConversations` et `conversation-runs` ne participent jamais à cette transaction et restent intacts.

## Tests automatisés

- domaine Project : limites 99→100 et 100→101, ordre, dates, immutabilité, doublon, archive ;
- validation des URL et références ;
- composants Reprise et Références, double clic, attributs d’ouverture et confirmation de suppression ;
- repository : migration legacy v2 vers v3, normalisation et conservation de `codexConversations` et `conversation-runs` ;
- exports BUILD-01 et BUILD-02R ;
- suites Conversations Codex, Conversation Orchestrator, PWA, build et E2E mobile.

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
11. Vérifier qu’une Conversation Codex préexistante et un `conversation-run` préexistant sont toujours présents après l’import.

## Risques et rollback

Les données locales réelles ne sont pas incluses dans Git. Avant recette, exporter les projets et les Conversations Codex via leurs écrans respectifs. Le rollback code consiste à revenir le commit BUILD-02R ; les champs additionnels restent ignorables par le code antérieur. Un export créé avec BUILD-02R ne doit toutefois pas être réimporté dans une version antérieure stricte sans conserver une copie. Risques résiduels : recette tactile/Safari réelle et limites physiques du stockage IndexedDB.

## Différence avec BUILD-02 perdu

Cette reconstruction prend pour base le schéma IndexedDB v3 et les modules Conversations Codex / Conversation Orchestrator déjà présents. Elle choisit volontairement une extension du record `Project`, sans nouveau store ni nouvelle montée de version IndexedDB, et démontre la non-destruction de `codexConversations` et `conversation-runs`. Elle prouve la valeur attendue actuelle ; elle ne prétend ni retrouver ni reproduire l’implémentation disparue.
