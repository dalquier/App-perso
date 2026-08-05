# ProjectOS Backup — Manifeste

## Identité

- ID : `projectos-backup`
- Nom : ProjectOS Backup
- Alias : Projet 2, sauvegarde ProjectOS, backup de code
- Statut : BUILD-01 construit — recette Pyto et BUILD-02 Raccourcis requis

## Objectif

Permettre à Damien de restaurer les derniers fichiers utiles de tous ses projets de code après une panne, sans conserver un historique de sauvegardes successives.

## Références canoniques

- dépôt : `dalquier/App-perso`
- branche par défaut : `main`
- code : `apps/projectos-backup/`
- documentation : `ProjectOS/projects/ProjectOSBackup/`
- destination privée : Google Drive `App-perso/ProjectOS-Backups`

## Périmètre

### Inclus

- GitHub `dalquier/App-perso` ;
- dossiers iCloud sélectionnés explicitement dans l'application ;
- configuration dynamique : ajout, suspension et retrait de dossiers ;
- miroir incrémental `Current`, transaction de rollback et SHA-256 ;
- restauration directe, dossier par dossier.

### Exclus

- dépôt GitHub `dalquier/Scriptable` ;
- copie locale Working Copy du dépôt `Scriptable` ;
- dossiers personnels sans rapport avec le code ;
- historique de snapshots du système de backup ;
- secrets, jetons et identifiants privés dans GitHub.

Le dossier applicatif `iCloud Drive/Scriptable` reste inclus lorsqu'il est sélectionné par Damien ; il ne doit pas être confondu avec le dépôt GitHub/Working Copy `Scriptable` exclu.

## Architecture cible

1. Pyto gère la liste dynamique des dossiers et leurs bookmarks de sécurité iOS.
2. Le moteur scanne toutes les sources et demande à iOS de charger les éléments iCloud.
3. Seuls les fichiers nouveaux ou modifiés sont préparés dans `Transaction`.
4. Après validation globale, les changements et suppressions sont appliqués avec rollback.
5. Raccourcis reproduit ce miroir vers Google Drive.
6. Un mécanisme cloud distinct capture la dernière branche `main` de `dalquier/App-perso`.

## Contraintes

- fonctionnement 100 % iPhone pour la configuration et les déclenchements ;
- aucun effacement d'une source ;
- aucune publication directe sur `main` ;
- aucune dépendance à l'agent IA Replit ;
- l'échec d'une source ne doit jamais remplacer une sauvegarde valide ;
- une destination ne peut pas se trouver dans une source ;
- le chargement iCloud est demandé explicitement ; toute lecture impossible impose un échec sûr et visible.

## Jalons

- BUILD-01 : moteur Pyto et interface de sources dynamiques — construit.\n- BUILD-01.1 : miroir incrémental, rollback et préchargement iCloud — en revue.
- BUILD-02 : Raccourci iOS vers Google Drive, remplacement vérifié et automatisation personnelle.
- BUILD-03 : capture cloud de `dalquier/App-perso`, restauration guidée et recette de crise.

## Définition de terminé

- ajout et retrait d'un dossier vérifiés sur iPhone ;
- sauvegarde réelle de tous les dossiers retenus ;
- transfert Drive vérifié ;
- une seule sauvegarde courante ;
- simulation de restauration réussie ;
- aucune donnée du dépôt `dalquier/Scriptable` dans le backup ;
- documentation et preuves de recette à jour.

