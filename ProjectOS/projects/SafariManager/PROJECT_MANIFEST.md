# Safari Manager — manifeste ProjectOS

- **ID :** `safarimanager`
- **Nom :** Safari Manager
- **Alias :** Safari Manager ; Gestionnaire Safari ; gestionnaire d’onglets Safari ; fenêtres Safari ; onglets Safari
- **Dépôt canonique :** `dalquier/App-perso`
- **Branche par défaut :** `main`
- **Dossier applicatif :** `apps/safari-manager/`
- **Plateforme initiale :** iPhone uniquement
- **État :** BUILD-01 construit ; validation App Store Connect/TestFlight/iPhone requise
- **Objectif :** gérer prudemment les onglets Safari accessibles depuis une interface française adaptée à l’iPhone.
- **Architecture :** Safari Web Extension MV3 en HTML/CSS/JavaScript natifs ; APIs `browser.tabs` et lecture facultative de `browser.windows` ; aucun backend ou service distant.
- **Données :** aucune collecte ; aucun compte ; aucun stockage requis par BUILD-01 ; données d’onglets conservées uniquement en mémoire pendant l’ouverture du popup.
- **Contraintes :** permissions Safari explicites, visibilité potentiellement partielle, conditionnement final contrôlé par Apple.
- **Risques :** différences d’implémentation Safari MV3, permissions de sites ou privées refusées, refus partiels d’activation/fermeture.
- **Prochain jalon :** recette du ZIP dans App Store Connect, TestFlight puis iPhone réel.

## Références

- [ADR-001](ADR/ADR-001-IOS-SAFARI-WEB-EXTENSION.md)
- [Spécification BUILD-01](docs/BUILD-01-SPEC.md)
- [Roadmap](roadmap.md)
