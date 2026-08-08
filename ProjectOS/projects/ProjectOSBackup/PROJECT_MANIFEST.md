# ProjectOS Backup — Manifeste

## Identité

- ID : `projectos-backup`
- Nom : ProjectOS Backup
- Alias : Projet 2, sauvegarde ProjectOS, backup de code
- Statut : BUILD-02.4 v0.4 en Draft — synchronisation résiliente, interface iPhone et recette requises

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
- exclusions paramétrables par dossier, nom de fichier et extension ; aucune extension exclue par défaut ;
- miroir incrémental `Current`, transaction de rollback et SHA-256 ;
- tampon iCloud résilient des conversations intégrales et pièces jointes avant archivage Drive append-only ;
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
3. Seuls les fichiers nouveaux ou modifiés sont lus ; les fichiers validés d’une exécution interrompue sont repris depuis `Resume/`.
4. Après validation globale, les changements et suppressions sont appliqués avec rollback.
5. Pyto inscrit les changements dans une session Drive persistante, puis les transmet par petits lots adaptatifs au relais Apps Script.
6. Chaque lot confirmé est enregistré ; après délai dépassé ou suspension iOS, Pyto interroge la session et reprend uniquement les opérations manquantes.
7. Les suppressions et le manifeste Drive final ne sont publiés qu'après confirmation de tous les envois ; le manifeste complet est ensuite relu et comparé au miroir local.
8. Un mécanisme cloud distinct capture la dernière branche `main` de `dalquier/App-perso`.
9. Les paquets de conversations suivent `Inbox → Pending → Uploading → Verified` et ne quittent le tampon qu’après preuve distante ; la copie vérifiée est conservée 30 jours.

## Contraintes

- fonctionnement 100 % iPhone pour la configuration et les déclenchements ;
- aucun effacement d'une source ;
- aucune publication directe sur `main` ;
- aucune dépendance à l'agent IA Replit ;
- l'échec d'une source ne doit jamais remplacer une sauvegarde valide ;
- une destination ne peut pas se trouver dans une source ;
- le chargement iCloud est demandé explicitement ; toute lecture impossible impose un échec sûr et visible.
- iOS ne garantit pas une exécution Pyto longue en arrière-plan : toute interruption doit être normale, persistée et reprenable sans double transfert.

## Jalons

- BUILD-01 : moteur Pyto et interface de sources dynamiques — construit.
- BUILD-01.1 : miroir incrémental, rollback et préchargement iCloud — en revue.
- BUILD-02.1 : test court de copie du dossier `Current` vers Google Drive par Raccourcis — prêt à exécuter.
- BUILD-02.2 : miroir incrémental vers Google Drive et automatisation personnelle par Raccourcis — intégré.
- BUILD-02.3 : interface native v0.3, mode local rapide, cache de reprise et lots Drive — intégré ; timeout Drive observé en recette iPhone.
- BUILD-02.4 : v0.4 — session Drive persistante, petits lots adaptatifs, reprise après timeout/suspension et synthèse finale — en construction.
- BUILD-02.4 UI2 : écran principal compact, Paramètres dédié, exclusions par lignes, diagnostic unifié et progression de phase cohérente — construit, recette iPhone requise.
- BUILD-03 : capture cloud de `dalquier/App-perso`, restauration guidée et recette de crise.
- BUILD-03.1 : connecteurs GitHub, archive Codex/ChatGPT et audit Replit selon `docs/SOURCE_CONNECTORS.md`.
- BUILD-03.1a : tampon iCloud et protocole Drive append-only des conversations — construit, recette iPhone requise.

## Définition de terminé

- ajout et retrait d'un dossier vérifiés sur iPhone ;
- sauvegarde réelle de tous les dossiers retenus ;
- transfert Drive vérifié ;
- reprise après timeout ou suspension vérifiée sans double envoi ;
- distinction visible entre miroir local sécurisé et Drive complètement vérifié ;
- synthèse finale persistante et bouton de fermeture vérifiés sur iPhone ;
- une seule sauvegarde courante ;
- simulation de restauration réussie ;
- aucune donnée du dépôt `dalquier/Scriptable` dans le backup ;
- documentation et preuves de recette à jour.
