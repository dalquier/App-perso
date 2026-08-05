# Inventaire du prototype historique TCC_Budy

Audit en lecture seule réalisé le 4 août 2026 depuis `dalquier/Scriptable` (clone temporaire hors de ce dépôt). Aucun fichier historique n'a été modifié.

## Versions repérées

- `TCC_Budy/TCC Budy.zip` et son README : archive initiale compacte.
- `Scriptable/TCC_Budy_20260724_193859` : socle Pyto/WebView avec conversation, SQLite, migrations, simulateur et tests.
- `Scriptable/TCC_Budy_Phase_2_20260724_223240` : ajout d'une fabrique fournisseur, de configuration et d'un fournisseur OpenAI.
- `Scriptable/TCC_Budy_Phase_2_20260725_011427` : instantané intermédiaire avec tests de cœur enrichis.
- `Scriptable/TCC_Budy_Phase_2_1_20260725_014200` : instantané le plus récent repéré, avec couches application, domaine, providers, stockage, support et UI WebView.

## Matrice de migration

| Classement | Capacités historiques | Décision BUILD-01 |
|---|---|---|
| **Réutiliser** | séparation UI/application/domaine/providers/stockage ; contrat du simulateur ; migrations versionnées ; tests de cœur | Conserver les contrats et principes avec modules JavaScript et tests dédiés. |
| **Adapter** | création, historique, reprise et suppression ; erreurs ; clair/sombre ; clavier iOS | Réduire au dernier état local, reprise de séance, suppression globale confirmée et primitives PWA/iPhone. |
| **Réécrire** | WebView Pyto, SQLite, pont JavaScript/Python, CSS et orchestration Python | PWA autonome, `localStorage` versionné, service worker et UI responsive. Aucun code historique copié. |
| **Différer** | OpenAI, clé, mémoire avancée, export/restauration Pyto, voix, synchronisation | Hors BUILD-01 ; toute intégration distante future passera par un backend, jamais par une clé client. |
| **Archiver** | ancien nom TCC_Budy, ZIP initial, doublons et instantanés | Laisser intacts dans `dalquier/Scriptable` ; ne pas les importer dans l'application canonique. |

L'inventaire compare les capacités visibles, pas les données d'utilisation. Les archives n'ont pas été exécutées et aucune configuration personnelle n'a été ouverte ou transférée.
