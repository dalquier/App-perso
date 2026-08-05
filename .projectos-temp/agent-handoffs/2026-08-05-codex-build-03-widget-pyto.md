# Handoff — DeveloperOS Agent Usage BUILD-03 Widget Pyto

- Objectif : widget Pyto Calm Instrument en lecture seule.
- Dépôt : `dalquier/App-perso`.
- Branche : `developeros/agent-usage-build-03-widget-pyto`.
- Base distante réelle : `developeros/agent-usage-build-02-ios-import` au SHA `b4f64e6fbb7bdf5040b11fc2b607b559e88eca02`.
- Livraison : PR Draft empilée sur BUILD-02.

## Contenu

- reader BUILD-01 strictement sans écriture ;
- ViewModel éphémère avec snapshots observés et validés, fraîcheur, crédits `null`/zéro, prévision prudente, historique même cycle et tâches dédupliquées ;
- rendu small/medium/large Calm Instrument ;
- adaptateur Pyto réel utilisant `widgets.Widget` et `show_widget` ;
- jauge et historique Pillow en mémoire uniquement, avec fallback textuel ;
- demande de reload indicative à 45 minutes ;
- installation et recette physique documentées ;
- tests hors Pyto avec double du module `widgets`.

## Corrections de revue appliquées au patch Codex

- remplacement du simple affichage console par la construction effective des trois layouts Pyto ;
- suppression des écritures PNG dans le dossier courant ;
- conservation des graphiques uniquement en mémoire ;
- suppression du double appel identique dans le gestionnaire d’exception ;
- filtrage des snapshots non observés ou non validés ;
- masquage des prévisions obsolètes ou postérieures au reset ;
- historique coupé sur reset, correction, recharge ou hausse ;
- conservation des lignes valides avec signalement d’un journal corrompu ;
- détection des doublons d’identifiants ;
- aucune substitution silencieuse d’un `.bak`.

## Limites

Les tests physiques iPhone restent non exécutés : Pyto fermé, redémarrage, VoiceOver, grandes tailles, accès iCloud persistant, délai réel de refresh, liens et limites mémoire.
