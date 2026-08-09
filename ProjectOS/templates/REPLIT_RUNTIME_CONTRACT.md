# <Projet> — Replit Runtime Contract

## Identité

- ProjectOS ID : `<id>`
- Nom produit : `<nom>`
- Replit canonical app name : `<nom Replit>`
- Replit canonical app ID : `<identifiant>`
- Runtime mode : `GITHUB_IMPORTED_RUNTIME | REPLIT_NATIVE_RUNTIME`
- Runtime lifecycle : `EXISTING_CANONICAL | INITIAL_CREATION | EXCEPTIONAL_RECREATION`
- Initial/recreation ingress method : `GITHUB_IMPORT | ZIP_IMPORT | BLANK_APP | OTHER`
- Ordinary update method : `GIT_SYNC`

## Source canonique

- Repository : `<owner/repo>`
- Canonical ref : `<main|branch>`
- Application path : `<path>`
- Runtime version proof : `SHA GitHub exact obligatoire`
- Stable Last Known Good : `<tag + SHA | N/A_INITIAL>`

## Replit Import/Setup Capability Gate

À compléter uniquement pour `INITIAL_CREATION` ou `EXCEPTIONAL_RECREATION`. Pour `EXISTING_CANONICAL`, indiquer `NOT_REQUIRED_EXISTING` et appliquer le Runtime Preflight après synchronisation Git.

- Gate applicability : `NOT_REQUIRED_EXISTING | REQUIRED`
- Replit behavior verified from current UI/docs : `YES | NO`
- Agent automatically started or required : `YES | NO | UNKNOWN`
- Agent can be declined without blocking nominal Run/Preview : `YES | NO | UNKNOWN`
- Import/setup mutates launch configuration before first Run : `YES | NO | UNKNOWN`
- Canonical launch command remains authoritative after setup : `YES | NO | UNKNOWN`
- Artifact/generated website created as substitute product : `YES | NO | UNKNOWN`
- No-Agent policy compatible : `YES | NO`
- Capability Gate verdict : `ADMISSIBLE | AGENT_EXCEPTION_REQUIRED | INCOMPATIBLE | UNKNOWN`
- Evidence/date : `<UI observation / current Replit documentation / date>`

Un verdict `ADMISSIBLE` exige `Replit behavior verified from current UI/docs: YES` et une preuve datée. `NO`, `UNKNOWN` et `INCOMPATIBLE` interdisent une création/recréation nominale. Une exception Agent exige l'autorisation ponctuelle prévue par `TOOLCHAIN_POLICY.md`. Un projet existant se met à jour par Git et ne relance pas ce gate à chaque version.

## Lancement

- Launch command : `<commande versionnée>`
- Working directory : `<path>`
- Bind address : `0.0.0.0`
- Port policy : `<$PORT|auto-detected|documented fixed port>`
- Readiness signal : `<signal/log/HTTP>`
- Expected HTTP : `200`

## Version stable, candidate et données

- Published state : `NOT_YET_PUBLISHED | STABLE_PUBLISHED`
- Stable published URL : `<https://...replit.app|custom domain|N/A_INITIAL>`
- Stable deployment type : `<Static|Autoscale|Reserved VM|autre|N/A_INITIAL>`
- Stable Last Known Good : `<tag + SHA|N/A_INITIAL>`
- Candidate ref/SHA : `<branche + SHA>`
- Candidate Preview URL : `<URL temporaire>`
- Real data used only by stable published version : `YES`
- Candidate data : `FICTITIOUS | ISOLATED`
- Pre-migration backup/export : `<procédure|N/A>`
- Migration inventory before/after : `<procédure|N/A>`
- Rollback code/data : `<procédure et compatibilité>`

Pour `INITIAL_CREATION`, utiliser `NOT_YET_PUBLISHED` et `N/A_INITIAL` jusqu’à la validation de la première candidate. Le Runtime Preflight peut alors être `READY` pour la Preview et la recette ; après la première publication, renseigner immédiatement l’URL et le Last Known Good puis passer à `STABLE_PUBLISHED`.

Une candidate ultérieure ne remplace pas la version publiée tant que CI, Preview, recette applicable, conservation des données et rollback ne sont pas prouvés sur le même SHA.

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

- application Replit canonique et SHA attendus identifiés ;
- `GIT_SYNC` utilisé pour une application existante, sans nouvel import ;
- Capability Gate admissible uniquement si création/recréation ;
- version publiée stable laissée inchangée, ou `NOT_YET_PUBLISHED` explicitement déclaré pour la création initiale ;
- données de candidate fictives ou isolées ;
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

- créer une deuxième application Replit pour mettre à jour ou tester une version ordinaire ;
- réimporter le dépôt au lieu d’utiliser Git dans l’application canonique ;
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
- application Replit canonique, URL publiée stable et méthode `GIT_SYNC` connues ;
- `Published state = STABLE_PUBLISHED` ; `NOT_YET_PUBLISHED` permet la première Preview/recette mais pas ce statut final ;
- Import/Setup Capability Gate = `NOT_REQUIRED_EXISTING`, `ADMISSIBLE` ou exception Agent explicitement autorisée et terminée ;
- version publiée stable, candidate, frontière de données et rollback documentés ;
- Direct Run Smoke vert ;
- Replit Runtime Preflight = READY ;
- Preview native fonctionne ;
- aucun Artifact/Workflow manuel requis pour le lancement nominal ;
- runtime recréable depuis ce contrat par un chemin qualifié.
