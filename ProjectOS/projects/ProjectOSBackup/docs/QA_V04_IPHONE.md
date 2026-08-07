# ProjectOS Backup v0.4 — Recette iPhone

## But et prérequis

Prouver que la v0.4 sécurise d'abord le miroir local, reprend Drive sans doublon après interruption et n'annonce un succès qu'après comparaison des manifestes.

Prérequis : `main` à jour dans Working Copy, dossier `apps/projectos-backup/` remplacé dans Pyto, `Code.gs` v0.4 redéployé sur l'URL existante, configuration Drive conservée. Ne pas utiliser de dossier contenant un secret.

## Matrice QA

| ID | Action iPhone | Résultat attendu | Preuve courte |
|---|---|---|---|
| Q1 | Lancer sans modifier les sources | Miroir local rapide ; aucun fichier inchangé renvoyé ; Drive vérifié | Synthèse finale et compteurs |
| Q2 | Ajouter un petit fichier, relancer | Un ajout local puis un seul envoi confirmé | Fichier visible dans `Current` local et Drive |
| Q3 | Modifier ce fichier, relancer | Une modification transférée ; contenu et SHA concordent | Synthèse + contenu Drive |
| Q4 | Supprimer ce fichier, relancer | Suppression distante seulement après la phase d'envoi | Fichier absent des deux miroirs, succès final |
| Q5 | Pendant un transfert, changer d'app puis revenir | L'interface reste active ou indique une reprise sûre | Progression ou état `Drive en attente` |
| Q6 | Interrompre Pyto pendant Drive, puis relancer | Même session reprise ; éléments confirmés non renvoyés | Compteur `repris` et progression non remise à zéro |
| Q7 | Couper le réseau pendant un lot, le rétablir et relancer | Aucun succès prématuré ; interrogation distante puis reprise ciblée | Erreur complète, puis synthèse vérifiée |
| Q8 | Test automatisé : simuler un timeout après application distante | État distant interrogé ; lot réduit ou repris ; aucune suppression prématurée | Test d'intégration vert |
| Q9 | Fermer l'interface | Fermeture immédiate ; état conservé | Bouton `Fermer`, puis même état au lancement |
| Q10 | Ouvrir l'app après succès | Dernière synthèse toujours consultable | Date, durées et compteurs visibles |

## Critère de validation

La recette est réussie si Q1 à Q10 sont conformes et si `Current/MANIFEST.json` local et Drive décrivent les mêmes chemins, tailles et SHA-256. Un miroir local terminé avec Drive en attente est un état sûr, mais ne valide pas Q1 ni la sauvegarde complète.

Consigner pour la PR : version Pyto/iOS, SHA testé, URL de déploiement masquée, durée de la première synchronisation, durée d'une synchronisation sans changement, IDs réussis/échoués et captures utiles. Ne jamais joindre le jeton.

## Retour arrière

En cas de défaut bloquant, arrêter les relances, conserver `Current` et la file de session, puis revenir au déploiement Apps Script précédent. Ne supprimer aucune session ou copie Drive avant analyse.
