# Équilibre — SESSION-30-C0 — Sécurité des données

## Statut

Candidate isolée. Non intégrée dans `main`, non publiée sur l'origine Replit stable et sans migration de stockage.

## Objectif

C0 prépare les montées de version C1–C4 sans rendre les séances longues visibles. La version stable actuelle reste utilisable pendant la revue de cette candidate.

## Périmètre livré

- identité de release `equilibre-session30-c0@1.0.0`, visible dans Confidentialité ;
- inventaire local par nombres et identifiants, sans recopier le contenu des messages ou mémoires ;
- export JSON portable versionné, limité à 5 Mo et protégé par une empreinte SHA-256 ;
- feuille de partage native iPhone lorsqu'elle accepte les fichiers, avec téléchargement JSON en repli ;
- restauration seulement après contrôle du format, de l'empreinte, de l'inventaire et confirmation utilisateur ;
- snapshot local de l'état courant avant remplacement ;
- verrou v4 en lecture seule lorsque le futur marqueur storage-v5 est actif ;
- suppression globale étendue au snapshot de restauration ;
- tests de succès, altération, taille, erreur d'écriture, anti-résurrection et ancien writer.

## Frontières

C0 ne contient ni IndexedDB, ni activation storage-v5, ni persistance de `LongSessionRun`, ni écran SESSION-30, ni provider distant, ni nouvelle mémoire, ni voix. Le stockage autoritaire reste la v4 locale actuelle.

Le fichier exporté contient les données privées en clair. L'interface le signale avant l'export ; aucun export réel ne doit entrer dans GitHub, les tests ou les journaux.

## Contrats

### Export

Le format `equilibre-portable-backup@1` contient :

- date de création et identité du writer ;
- inventaire des collections ;
- état v4 normalisé ;
- empreinte SHA-256 du corps canonique.

Les drapeaux d'erreur propres au runtime ne sont pas exportés.

### Restauration

La restauration remplace l'état local ; elle ne fusionne jamais deux états. Avant le remplacement, le writer conserve l'état courant sous la clé de snapshot v4. Une écriture principale refusée laisse l'état courant autoritaire.

### Futur writer v5

Lorsque `equilibre.local.v1.v5.active` existe, le writer v4 peut présenter la v4 encore lisible mais refuse `save`, `restore` et `clear`. C0 ne crée jamais ce marqueur : son activation appartient exclusivement à C1.

## Preuves automatisées de la candidate

- `npm test` : 239 tests sur 239, 11 fichiers sur 11 ;
- `npm run build` : build Vite production réussi ;
- `PORT=5187 ./start-equilibre.sh` : installation déterministe, build, serveur `0.0.0.0`, marqueur `EQUILIBRE_READY` ;
- HTTP `/`, manifeste et service worker : réponses 200 ;
- cache PWA inchangé `equilibre-shell-v6`, car C0 ne modifie pas le service worker.

## Gate avant intégration

- diff et frontières relus ;
- CI verte sur le SHA exact ;
- aucune donnée réelle ni secret ;
- export et restauration validés avec fixtures fictives ;
- aucune modification de schéma ou de l'origine stable ;
- PR explicitement autorisée à fusionner.

Après intégration de C0, C1 pourra construire storage-v5/IndexedDB sur une nouvelle branche. La promotion Replit reste une opération séparée : même origine publiée, export de sécurité et contrôle des données avant/après.
