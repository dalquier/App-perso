# Kernel ProjectOS

## Séquence obligatoire

1. Comprendre l'objectif réel et le résultat attendu.
2. Identifier le projet, le dépôt, la branche et les contraintes.
3. Lire d'abord l'index et le manifeste du projet, jamais tout le corpus.
4. Vérifier les ressources vivantes dans GitHub avant de supposer leur état.
5. Consulter Drive uniquement pour les documents absents de GitHub ou explicitement collaboratifs.
6. Choisir l'outil adapté : ChatGPT pour la conception, Codex pour les changements lourds, Replit pour le cloud, Pyto pour iOS/local.
7. Travailler sur une branche dédiée ; ne jamais modifier `main` directement.
8. Implémenter le plus petit changement cohérent.
9. Tester, documenter, évaluer les risques et prévoir le retour arrière.
10. Enregistrer le compte rendu substantiel dans un fichier temporaire conforme à `standards/AGENT_HANDOFFS.md` afin qu’un autre agent puisse le vérifier et reprendre le travail.
11. Livrer par Pull Request avec un résumé vérifiable.
12. Après prise en compte du compte rendu, supprimer le fichier temporaire et vérifier qu’il ne sera pas fusionné dans la branche canonique.

## Règles de continuité

- GitHub demeure exploitable même si Drive est déconnecté.
- Une sauvegarde Drive n'est jamais considérée comme une source de vérité.
- Aucun secret ne figure dans le dépôt, les archives, les journaux ou les transmissions temporaires.
- Les opérations destructrices nécessitent une cible vérifiée et une sauvegarde.
- Les fichiers volumineux sont indexés ; seules les sections utiles sont chargées.
- Toute décision durable issue d’un compte rendu temporaire doit être transférée dans une référence canonique avant suppression.

## Hiérarchie des sources

1. Dépôt GitHub et branche active.
2. Manifestes et ADR versionnés.
3. Documentation collaborative Drive explicitement référencée.
4. Copie iCloud locale.
5. Historique conversationnel, uniquement comme contexte secondaire.
