# <Projet> — Replit Runtime Contract

## Identité

- ProjectOS ID : `<id>`
- Nom produit : `<nom>`
- Replit app name : `<nom Replit>`
- Runtime mode : `GITHUB_IMPORTED_RUNTIME | REPLIT_NATIVE_RUNTIME`
- Ingress/setup method : `EXISTING_RUNTIME | GITHUB_IMPORT | ZIP_IMPORT | BLANK_APP | OTHER`

## Source canonique

- Repository : `<owner/repo>`
- Canonical ref : `<main|branch>`
- Application path : `<path>`
- Runtime version proof : `SHA GitHub exact obligatoire`

## Replit Import/Setup Capability Gate

- Replit behavior verified from current UI/docs : `YES | NO`
- Agent automatically started or required : `YES | NO | UNKNOWN`
- Agent can be declined without blocking nominal Run/Preview : `YES | NO | UNKNOWN`
- Import/setup mutates launch configuration before first Run : `YES | NO | UNKNOWN`
- Canonical launch command remains authoritative after setup : `YES | NO | UNKNOWN`
- Artifact/generated website created as substitute product : `YES | NO | UNKNOWN`
- No-Agent policy compatible : `YES | NO`
- Capability Gate verdict : `ADMISSIBLE | AGENT_EXCEPTION_REQUIRED | INCOMPATIBLE | UNKNOWN`
- Evidence/date : `<UI observation / current Replit documentation / date>`

`UNKNOWN` et `INCOMPATIBLE` interdisent la recette nominale. Une exception Agent exige l'autorisation ponctuelle prévue par `TOOLCHAIN_POLICY.md`.

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

Le Direct Run Smoke valide le lanceur hors Replit ; il ne remplace pas la preuve que le flux d'import/setup Replit laisse réellement ce lanceur gouverner le Run nominal.

## PWA / cache

- PWA : `YES | NO`
- Service worker : `<path|N/A>`
- Cache version strategy : `<règle|N/A>`
- Old cache cleanup : `<règle|N/A>`
- Preview reset procedure : `<règle|N/A>`

## Synchronisation Git

Avant recette :

- Capability Gate admissible ;
- worktree clean ;
- local ref vérifiée ;
- `ahead = 0` sauf dérogation explicitement revue ;
- `behind = 0` ;
- aucun changement durable propre à Replit.

Si divergence ou contamination :

1. arrêter le test ;
2. classer les changements locaux ;
3. préserver tout travail unique ;
4. avant de recréer/importer, refaire le Replit Import/Setup Capability Gate ;
5. réaligner ou recréer le runtime uniquement par un chemin admissible ;
6. refaire le Replit Runtime Preflight.

## Fallbacks interdits

- répéter un import dont le Capability Gate est `INCOMPATIBLE` ;
- utiliser un import ZIP comme contournement sans requalification du setup ;
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
- Import/Setup Capability Gate = `ADMISSIBLE` ou exception Agent explicitement autorisée et terminée ;
- Direct Run Smoke vert ;
- Replit Runtime Preflight = READY ;
- Preview native fonctionne ;
- aucun Artifact/Workflow manuel requis pour le lancement nominal ;
- runtime recréable depuis ce contrat par un chemin qualifié.
