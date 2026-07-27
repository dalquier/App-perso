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

La documentation doit décrire la réalité vérifiée. Une référence remplacée doit être mise à jour ou archivée, jamais laissée comme règle active contradictoire.
