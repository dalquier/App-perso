# Safari Manager — BUILD-01

Safari Web Extension MV3, sans framework, backend, API distante, télémétrie ni dépendance de production. Elle inventorie les onglets accessibles, recherche, active, sélectionne et ferme avec confirmation. Les doublons ne sont proposés que si leur URL prudemment normalisée est identique.

## Permissions et confidentialité

- `tabs` est nécessaire pour interroger, activer et fermer les onglets.
- `<all_urls>` permet de lire les titres et URL des sites autorisés. Les données restent dans le popup et ne sont ni collectées ni transmises.
- Sur l’iPhone, ouvrir **Réglages > Safari > Extensions > Safari Manager**, activer l’extension puis autoriser les sites nécessaires.
- Si l’accès à un site est refusé, Safari peut masquer son titre ou son URL : l’interface le signale sans inventer de donnée. Les opérations peuvent donc porter uniquement sur les onglets accessibles.
- La navigation privée peut exiger une autorisation distincte ou rester inaccessible selon la version et les réglages de Safari. BUILD-01 ne contourne pas cette restriction.
- `browser.windows` est facultatif, détecté à l’exécution et utilisé seulement en lecture. L’inventaire principal repose sur `browser.tabs.query({})` et conserve chaque `windowId` disponible.

## Développement et validation

Prérequis : Node.js 20+ et Python 3.11+. Aucune installation npm n’est requise.

```bash
cd apps/safari-manager
npm test
npm run check
python3 -m json.tool extension/manifest.json >/dev/null
python3 scripts/package_extension.py
unzip -l dist/safari-manager-extension.zip
```

Le ZIP déterministe est généré dans `dist/`, ignoré par Git, avec `manifest.json` directement à sa racine. Le script valide le JSON et les ressources référencées, puis écrit également `safari-manager-extension.zip.sha256`.

## Parcours complet sans Mac

1. Dans GitHub Actions, ouvrir le workflow **Safari Manager** et récupérer l’artefact ZIP.
2. Ouvrir App Store Connect.
3. Créer l’enregistrement de l’application iOS.
4. Ouvrir Safari Web Extension Packager dans App Store Connect.
5. Envoyer le ZIP contenant `manifest.json` à sa racine.
6. Attendre le traitement du Build par Apple et traiter toute validation signalée.
7. Activer le Build dans TestFlight et ajouter les testeurs voulus.
8. Installer l’application depuis TestFlight sur l’iPhone.
9. Activer Safari Manager dans **Réglages > Safari > Extensions**.
10. Accorder les permissions de sites nécessaires.
11. Ouvrir Safari, ouvrir le menu Extensions puis lancer **Safari Manager**.

Le sandbox Codex ne peut pas exécuter Safari iOS, App Store Connect, le packager Apple ni TestFlight. Ces étapes restent une recette manuelle obligatoire et ce dépôt ne prétend pas les avoir validées.

## Recette TestFlight iPhone

Vérifier sur un iPhone : écran étroit et mode sombre ; inventaire de plusieurs fenêtres ; titre/URL refusés ; recherche ; activation ; persistance d’une sélection après actualisation ; annulation puis confirmation d’une fermeture ; échec partiel ; présentation et fermeture des doublons avec conservation de l’actif ; comportement en navigation privée.

## Retour arrière

Retirer le Build de TestFlight ou désactiver Safari Manager dans Réglages. Côté dépôt, annuler le commit BUILD-01 dans une nouvelle Pull Request. Aucun backend ni format de données utilisateur ne nécessite de migration.
