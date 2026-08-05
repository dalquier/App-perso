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

La mémoire conversationnelle est régie par `CONVERSATION_MEMORY.md` et n’est créée qu’après activation conforme : consentement permanent explicite et versionné pour Codex, ou consentement ponctuel pour les autres outils. Elle complète la documentation canonique sans la remplacer.

Pour une conversation enregistrée :

- les décisions durables sont transférées vers le manifeste, une ADR, la roadmap ou la documentation appropriée ;
- la synthèse de session distingue faits vérifiés, hypothèses et informations manquantes ;
- l’index et la chronologie renvoient vers les branches, commits et Pull Requests réels lorsqu’ils existent ;
- une archive brute reste facultative et secondaire ;
- aucun secret ni contenu sensible inutile n’est conservé.

Un refus d’enregistrement n’empêche jamais de documenter les changements imposés par la tâche elle-même.

La documentation doit décrire la réalité vérifiée. Une référence remplacée doit être mise à jour ou archivée, jamais laissée comme règle active contradictoire.
