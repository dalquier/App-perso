# ProjectOS — Documentation

Chaque projet doit disposer d’un manifeste à jour décrivant son objectif, son dépôt canonique, son état, ses contraintes, son architecture, ses outils, ses données, ses risques et son prochain jalon.

Les décisions durables ou difficiles à inverser doivent être consignées dans une ADR. Les instructions d’installation, d’exécution, de test, de sauvegarde et de restauration doivent être directement applicables.

Toute livraison doit préciser :
- ce qui a changé ;
- pourquoi ;
- les fichiers concernés ;
- les tests réalisés ;
- les limites connues ;
- le retour arrière ;
- la prochaine action utile.

Pour toute tâche logicielle substantielle, ChatGPT, Codex ou l’agent exécutant doit également créer un compte rendu temporaire conforme à `AGENT_HANDOFFS.md`. Ce fichier sert à la vérification croisée et à la reprise par un autre agent. Son chemin exact doit être communiqué dans la réponse finale, puis le fichier doit être supprimé après prise en compte. Les informations durables doivent être reportées dans la documentation canonique avant cette suppression.

## Mémoire conversationnelle

La mémoire conversationnelle complète la documentation sans la remplacer. Elle est régie par `CONVERSATION_MEMORY.md`.

- l’index recense les sessions significatives ;
- la chronologie conserve uniquement les événements structurants ;
- les synthèses de sessions facilitent la reprise sans dépendre de la conversation source ;
- les archives brutes restent secondaires et ne constituent jamais une règle active.

Toute décision durable identifiée dans une synthèse doit être transférée vers le manifeste, une ADR, la roadmap ou la documentation appropriée. Toute affirmation sur une branche, un commit, une Pull Request, un test ou un fichier doit être confrontée à l’état GitHub vivant.

La documentation doit décrire la réalité vérifiée. Une référence remplacée doit être mise à jour ou archivée, jamais laissée comme règle active contradictoire.
