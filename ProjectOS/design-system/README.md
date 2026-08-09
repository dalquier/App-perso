# ProjectOS — Design System

Ce dossier contient l’identité visuelle, les design tokens et les règles de composants partagés par les applications pilotées par ProjectOS.

## Autorité

- `DESIGN_DNA.md` définit l’identité commune et les principes verrouillés.
- `tokens/design-tokens.json` expose les fondations machine-readable.
- `COMPONENT_ARCHITECTURE.md` définit la prochaine couche : composants, variantes, états et patterns UX.

GitHub `dalquier/App-perso`, branche `main`, reste la source de vérité après fusion explicite de la Pull Request correspondante.

## Gouvernance

- Une valeur marquée **verrouillée** ne change qu’après décision explicite et mise à jour versionnée.
- Une valeur marquée **candidate** peut évoluer pendant la validation des composants.
- Les applications héritent du socle commun et peuvent ajouter une couleur secondaire, des illustrations et des éléments métier sans casser le langage commun.
- Les décisions d’accessibilité et de comportement iPhone doivent rester conformes à `ProjectOS/standards/QUALITY_UX_SECURITY.md`.
- Les évolutions durables passent par branche dédiée et Pull Request ; `main` n’est jamais modifiée directement.

## État v0.1

Les fondations sont verrouillées. La phase suivante est la validation des composants et patterns UX avant toute bibliothèque de code partagée.