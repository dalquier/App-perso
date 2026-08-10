# ProjectOS — Design System

Ce dossier contient l’identité visuelle, les design tokens et les règles de composants partagés par les applications pilotées par ProjectOS.

## Autorité

- `DESIGN_DNA.md` définit l’identité commune et les principes verrouillés.
- `tokens/design-tokens.json` expose les fondations machine-readable.
- `COMPONENT_ARCHITECTURE.md` définit les composants, variantes, états et patterns UX.
- `PLAYGROUND_BUILD_SPEC.md` définit le Build C1 du Playground Storybook destiné à valider les composants sur iPhone avant toute bibliothèque partagée.

GitHub `dalquier/App-perso`, branche `main`, reste la source de vérité après fusion explicite de la Pull Request correspondante.

## Gouvernance

- Une valeur marquée **verrouillée** ne change qu’après décision explicite et mise à jour versionnée.
- Une valeur marquée **candidate** peut évoluer pendant la validation des composants.
- Les applications héritent du socle commun et peuvent ajouter une couleur secondaire, des illustrations et des éléments métier sans casser le langage commun.
- Les décisions d’accessibilité et de comportement iPhone doivent rester conformes à `ProjectOS/standards/QUALITY_UX_SECURITY.md`.
- Les évolutions durables passent par branche dédiée et Pull Request ; `main` n’est jamais modifiée directement.
- Le Playground n’est pas une seconde source de vérité : il consomme les références canoniques de ce dossier et matérialise leurs conséquences visuelles.

## État v0.1

Les fondations sont verrouillées. La phase active est `C1 — Core UI` via un Playground Storybook autonome sous `apps/design-system/`.

Séquence :

1. construire C1 avec Codex sur une branche dédiée basée sur `projectos/design-system-v0-1` tant que la PR #121 n’est pas intégrée ;
2. publier une Draft PR C1 empilée ;
3. valider le build Storybook et la conformité du diff ;
4. choisir séparément un canal de Preview iPhone qui ne modifie ni ne concurrence le runtime racine d’Équilibre ;
5. valider visuellement les composants sur iPhone ;
6. promouvoir seulement ensuite les valeurs candidates réellement validées ;
7. décider le mode de publication permanent après validation C1.

Le `.replit` racine est une ressource logique partagée liée au runtime Équilibre et reste hors périmètre C1. Figma reste optionnel et n’est pas requis pour construire ou valider C1.
