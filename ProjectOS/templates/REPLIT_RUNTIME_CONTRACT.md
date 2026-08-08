# <Projet> — Replit Runtime Contract

## Identité

- ProjectOS ID : `<id>`
- Nom produit : `<nom>`
- Replit app name : `<nom Replit>`
- Runtime mode : `GITHUB_IMPORTED_RUNTIME | REPLIT_NATIVE_RUNTIME`

## Source canonique

- Repository : `<owner/repo>`
- Canonical ref : `<main|branch>`
- Application path : `<path>`
- Runtime version proof : `SHA GitHub exact obligatoire`

## Lancement

- Launch command : `<commande versionnée>`
- Working directory : `<path>`
- Bind address : `0.0.0.0`
- Port policy : `<$PORT|auto-detected|documented fixed port>`
- Readiness signal : `<signal/log/HTTP>`
- Expected HTTP : `200`

## Surface d’exécution

- Nominal surface : `Replit native Preview/Webview`
- Artifact required : `NO`
- Manual Workflow required : `NO`
- Validation tool required to start product : `NO`

## CI runtime gate

- Direct Run Smoke : `<workflow/test>`
- Same launch command as Replit : `YES | STRICTLY_EQUIVALENT`
- Browser smoke : `<workflow/test|N/A>`
- Product identity assertions : `<titre/routes/invariants>`

## PWA / cache

- PWA : `YES | NO`
- Service worker : `<path|N/A>`
- Cache version strategy : `<règle|N/A>`
- Old cache cleanup : `<règle|N/A>`
- Preview reset procedure : `<règle|N/A>`

## Synchronisation Git

Avant recette :

- worktree clean ;
- local ref vérifiée ;
- `ahead = 0` sauf dérogation explicitement revue ;
- `behind = 0` ;
- aucun changement durable propre à Replit.

Si divergence ou contamination :

1. arrêter le test ;
2. classer les changements locaux ;
3. préserver tout travail unique ;
4. réaligner ou recréer le runtime depuis GitHub ;
5. refaire le Replit Runtime Preflight.

## Fallbacks interdits

- considérer `Open Artifact` comme preuve du produit canonique ;
- créer un Workflow manuel uniquement pour contourner un lancement nominal cassé sans corriger le contrat ;
- utiliser un ancien serveur/Preview comme preuve du nouveau SHA ;
- pousser automatiquement des commits locaux créés par un setup Agent/Replit ;
- modifier le métier dans Replit pour contourner un problème de runtime.

## Smoke manuel minimal iPhone

- Preview native ouverte ;
- identité produit correcte ;
- navigation principale accessible ;
- parcours nominal minimal réussi ;
- aucune page blanche ;
- aucun chevauchement majeur de safe area ;
- fermeture/réouverture conforme si persistance/PWA concernée.

## Definition of Runtime Ready

`RUNTIME READY` uniquement si :

- source canonique et SHA connus ;
- Direct Run Smoke vert ;
- Replit Runtime Preflight = READY ;
- Preview native fonctionne ;
- aucun Artifact/Workflow manuel requis pour le lancement nominal ;
- runtime recréable depuis ce contrat.
