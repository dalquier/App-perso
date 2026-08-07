# Kernel ProjectOS

## Séquence obligatoire

1. Comprendre l'objectif réel et le résultat attendu.
2. Identifier le projet, le dépôt, la branche et les contraintes.
3. Lire d'abord l'index et le manifeste du projet, jamais tout le corpus.
4. Vérifier les ressources vivantes dans GitHub avant de supposer leur état.
5. Consulter Drive uniquement pour les documents absents de GitHub ou explicitement collaboratifs.
6. Classer le travail avant de produire du code :
   - ChatGPT pour la conception, le pilotage, la revue et les changements limités ;
   - Codex obligatoire pour tout nouveau Build, projet multi-fichiers, refactoring substantiel, migration, débogage transversal ou développement nécessitant une validation approfondie ;
   - Replit pour l'exécution et le déploiement cloud ;
   - Pyto pour les fonctions iPhone natives et locales.
7. Appliquer `standards/CODE_WORK_ROUTING.md` avant toute implémentation logicielle.
8. Appliquer `standards/INCIDENT_LEARNING.md` pendant toute l’exécution : précontrôler les capacités d’environnement lorsque nécessaire, puis classer, dédupliquer et historiser les blocages matériels.
9. Travailler sur une branche dédiée ; ne jamais modifier `main` directement.
10. Créer et modifier les fichiers complets dans le dépôt canonique. Un ZIP, un fichier local ou un bloc de code dans la conversation ne remplace pas la livraison GitHub.
11. Implémenter le plus petit changement cohérent.
12. Tester, documenter, évaluer les risques et prévoir le retour arrière.
13. Enregistrer le compte rendu substantiel dans un fichier temporaire conforme à `standards/AGENT_HANDOFFS.md` afin qu’un autre agent puisse le vérifier et reprendre le travail.
14. Livrer par Pull Request avec un résumé vérifiable.
15. Après prise en compte du compte rendu, supprimer le fichier temporaire et vérifier qu’il ne sera pas fusionné dans la branche canonique.

## Communication pendant l’exécution

- Appliquer `standards/PROGRESS_COMMUNICATION.md` pendant l’amorçage et toute tâche nécessitant une attente perceptible, des outils ou plusieurs opérations.
- Chaque mise à jour intermédiaire indique les tâches terminées ou vérifiées, l’action actuellement menée, les étapes essentielles restantes et une estimation actualisée du temps restant.
- Utiliser le format canonique : `Avancement`, `Réalisé`, `En cours`, `Reste à faire`, `Temps restant estimé` et, lorsque nécessaire, `Point d’attention`.
- Montrer les résultats obtenus, les fichiers ou états concernés et les contrôles effectués lorsqu’ils sont utiles au pilotage.
- Regrouper les opérations proches et éviter le journal exhaustif de chaque appel d’outil.
- Ne jamais exposer le raisonnement privé, les notes internes, les instructions invisibles, les secrets ou les données sensibles.
- Actualiser l’estimation lorsque la durée prévisible évolue sensiblement et expliquer brièvement la cause si elle augmente.
- Les réponses décisionnelles à formulation exacte, notamment la mémoire et la parallélisation, restent isolées sans ajout de progression.
- Les indicateurs natifs de l’application qui ne sont pas configurables par l’agent restent hors du contrôle de cette règle.

## Règles de continuité

- GitHub demeure exploitable même si Drive est déconnecté.
- Une sauvegarde Drive n'est jamais considérée comme une source de vérité.
- Aucun secret ne figure dans le dépôt, les archives, les journaux ou les transmissions temporaires.
- Les opérations destructrices nécessitent une cible vérifiée et une sauvegarde.
- Les fichiers volumineux sont indexés ; seules les sections utiles sont chargées.
- Toute décision durable issue d’un compte rendu temporaire doit être transférée dans une référence canonique avant suppression.
- Un outil d'exécution ne devient jamais implicitement le dépôt canonique.
- L'indisponibilité temporaire de Codex doit être signalée ; elle ne justifie pas de transformer une livraison lourde en blocs de code manuels sans traçabilité.
- Un incident utile ne reste pas uniquement dans une conversation ou un log : il est enregistré dans l’Incident Ledger #87 lorsque GitHub est inscriptible, sinon transmis comme `INCIDENT_CAPTURE_PENDING` au coordinateur.
- Une limitation externe déjà connue et correctement contournée peut être classée `ACCEPTED_LIMITATION` plutôt que retentée inutilement.

## Hiérarchie des sources

1. Dépôt GitHub et branche active.
2. Manifestes et ADR versionnés.
3. Documentation collaborative Drive explicitement référencée.
4. Copie iCloud locale.
5. Historique conversationnel, uniquement comme contexte secondaire.
