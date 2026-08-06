# Safari Manager — spécification BUILD-01

## Périmètre livré

- inventaire via `browser.tabs.query({})`, fenêtres multiples et propriétés optionnelles défensives ;
- recherche instantanée sans casse sur titre, domaine et URL ;
- activation explicite avec erreur compréhensible ;
- sélection individuelle, filtrée et désélection globale, conservée après rafraîchissement si l’onglet existe ;
- fermeture après dialogue donnant quantité et domaines, avec résultat partiel ;
- groupes de doublons visibles avant action et conservation de l’actif, sinon du premier ;
- popup français étroit, tactile, accessible, sombre et sans interaction au survol ;
- packaging ZIP déterministe et workflow sans secret.

## États attendus

Chargement, liste vide, aucun résultat, permission insuffisante, URL partiellement accessibles, erreur Safari, succès et fermeture partielle sont rendus explicitement. Aucune fausse URL ou fermeture implicite n’est admise.

## Hors périmètre vérifiable dans Codex

Safari iOS réel, navigation privée, Safari Web Extension Packager, App Store Connect et TestFlight. La recette manuelle est canonique dans `apps/safari-manager/README.md`.

## Retour arrière

Désactiver l’extension ou retirer le Build TestFlight ; annuler le commit BUILD-01 par Pull Request. Aucune donnée serveur ne doit être restaurée.
