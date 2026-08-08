# ProjectOS Backup — Manifeste

## Identité

- ID : `projectos-backup`
- Nom : ProjectOS Backup
- Alias : Projet 2, sauvegarde ProjectOS, backup de code
- Statut : BUILD-02.3 intégré — redéploiement Apps Script et recette iPhone v0.3 requis

## Objectif

Permettre à Damien de restaurer les derniers fichiers utiles de tous ses projets de code après une panne, sans conserver un historique de sauvegardes successives.

## Références canoniques

- dépôt : `dalquier/App-perso`
- branche par défaut : `main`
- code : `apps/projectos-backup/`
- documentation : `ProjectOS/projects/ProjectOSBackup/`
- destination privée : Google Drive `App-perso/ProjectOS-Backups`
- politique Workspace : `ProjectOS/standards/WORKSPACE_AND_FILE_LIFECYCLE.md`

## Périmètre

### Inclus

- GitHub `dalquier/App-perso` ;
- dossiers iCloud sélectionnés explicitement dans l'application ;
- `iCloud Drive/ProjectOS Workspace/10_WORK` lorsque Damien choisit de protéger les fichiers de travail uniques ;
- `iCloud Drive/ProjectOS Workspace/30_OUTPUT` lorsque des livrables locaux attendent encore leur destination définitive ;
- configuration dynamique : ajout, suspension et retrait de dossiers ;
- miroir incrémental `Current`, transaction de rollback et SHA-256 ;
- restauration directe, dossier par dossier.

### Exclus

- dépôt GitHub `dalquier/Scriptable` ;
- copie locale Working Copy du dépôt `Scriptable` ;
- `ProjectOS Workspace/00_INBOX` par défaut ;
- `ProjectOS Workspace/20_EXCHANGE` ;
- `ProjectOS Workspace/80_TO_ARCHIVE` par défaut ;
- `ProjectOS Workspace/90_TRASH_7D` ;
- dossiers personnels sans rapport avec le code ;
- historique de snapshots du système de backup ;
- secrets, jetons et identifiants privés dans GitHub.

Le dossier applicatif `iCloud Drive/Scriptable` reste inclus lorsqu'il est sélectionné par Damien ; il ne doit pas être confondu avec le dépôt GitHub/Working Copy `Scriptable` exclu.

Ne jamais sélectionner `ProjectOS Workspace` entier comme source par défaut : les zones temporaires et la corbeille ne doivent pas être promues implicitement dans la sauvegarde Drive.

## Architecture cible

1. Pyto gère la liste dynamique des dossiers et leurs bookmarks de sécurité iOS.
2. Le moteur scanne toutes les sources et demande à iOS de charger les éléments iCloud.
3. Seuls les fichiers nouveaux ou modifiés sont lus ; les fichiers validés d’une exécution interrompue sont repris depuis `Resume/`.
4. Après validation globale, les changements et suppressions sont appliqués avec rollback.
5. Pyto transmet les changements par lots à un relais Apps Script, puis relit et compare le manifeste Drive complet.
6. Un mécanisme cloud distinct capture la dernière branche `main` de `dalquier/App-perso`.
7. L’intégration Workspace repose sur les sources dynamiques existantes : aucune dépendance du moteur à un chemin iCloud fixe n’est ajoutée.

## Contraintes

- fonctionnement 100 % iPhone pour la configuration et les déclenchements ;
- aucun effacement d'une source ;
- aucune publication directe sur `main` ;
- aucune dépendance à l'agent IA Replit ;
- l'échec d'une source ne doit jamais remplacer une sauvegarde valide ;
- une destination ne peut pas se trouver dans une source ;
- le chargement iCloud est demandé explicitement ; toute lecture impossible impose un échec sûr et visible ;
- les zones Workspace jetables ne sont pas sauvegardées par défaut.

## Intégration ProjectOS Workspace

Configuration recommandée sur iPhone :

1. créer `iCloud Drive/ProjectOS Workspace` selon `ProjectOS/guides/WORKSPACE_IPHONE.md` ;
2. dans ProjectOS Backup, ajouter `10_WORK` comme source si nécessaire ;
3. ajouter séparément `30_OUTPUT` si nécessaire ;
4. vérifier les libellés et ne pas sélectionner la racine Workspace ;
5. exécuter une sauvegarde ;
6. contrôler que le bilan et le manifeste contiennent uniquement les zones sélectionnées.

Cette intégration ne requiert pas de modification du moteur : ProjectOS Backup sait déjà ajouter, suspendre et retirer des sources iCloud dynamiquement.

## Jalons

- BUILD-01 : moteur Pyto et interface de sources dynamiques — construit.
- BUILD-01.1 : miroir incrémental, rollback et préchargement iCloud — en revue.
- BUILD-02.1 : test court de copie du dossier `Current` vers Google Drive par Raccourcis — prêt à exécuter.
- BUILD-02.2 : miroir incrémental vers Google Drive et automatisation personnelle par Raccourcis — intégré.
- BUILD-02.3 : interface native v0.3, mode local rapide, cache de reprise et lots Drive — intégré ; recette iPhone requise.
- BUILD-03 : capture cloud de `dalquier/App-perso`, restauration guidée et recette de crise.

## Définition de terminé

- ajout et retrait d'un dossier vérifiés sur iPhone ;
- sauvegarde réelle de tous les dossiers retenus ;
- transfert Drive vérifié ;
- une seule sauvegarde courante ;
- simulation de restauration réussie ;
- aucune donnée du dépôt `dalquier/Scriptable` dans le backup ;
- aucune zone Workspace jetable sauvegardée par erreur ;
- documentation et preuves de recette à jour.
