# ProjectOS — Incident Analyzer

`ProjectOS/scripts/incident_analyzer.py` produit à la demande une synthèse factuelle et un prompt d’audit à transmettre à ChatGPT ou Codex.

## Entrées

Par défaut, l’Analyzer lit les 30 derniers jours du Ledger #87. Les filtres peuvent limiter le périmètre à un projet, certaines gravités ou certains statuts. Un fichier JSON de commentaires permet aussi un fonctionnement hors ligne et des tests déterministes.

## Sorties

- synthèse des incidents uniques, occurrences, actifs, récurrents, gravités, couvertures et types principaux ;
- liste priorisée des incidents à examiner lorsqu’ils sont récurrents, non couverts, partiellement couverts ou associés à une évolution candidate ;
- prompt analytique complet destiné à ChatGPT, Codex ou à une revue indépendante ;
- export JSON facultatif de la synthèse ;
- export texte facultatif du prompt.

## Garde-fous du prompt généré

Le prompt impose une mission exclusivement analytique : aucune modification, branche ou PR. Il demande de distinguer limitations externes, défauts d’environnement/outils/processus et défauts applicatifs ; d’éviter la sur-ingénierie ; de classer les actions `P0`, `P1`, `P2` ou `NO_ACTION` ; et de fournir pour toute évolution ProjectOS un bénéfice, un coût, un risque et un critère d’acceptation observable.

L’Analyzer ne modifie jamais automatiquement ProjectOS. Toute recommandation reste soumise au cycle normal branche → PR → Reliability/Merge Gate.
