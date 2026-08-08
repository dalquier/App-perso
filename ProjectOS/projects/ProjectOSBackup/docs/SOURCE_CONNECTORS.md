# ProjectOS Backup — stratégie des sources externes

## Principe

L'application distingue les dossiers accessibles à Pyto via iCloud Drive, copiés directement dans le miroir, et les services cloud, capturés par un connecteur adapté avant d'être intégrés au même inventaire de restauration. Une source cloud ne doit jamais être simulée par une copie Working Copy ou un dossier iCloud potentiellement obsolète.

## GitHub

GitHub reste la source canonique du code. Le connecteur cible sauvegarde les dépôts explicitement sélectionnés avec la branche par défaut, les branches non fusionnées utiles, les références nécessaires à une restauration, les objets Git LFS éventuels et un inventaire des SHA capturés.

Le mécanisme recommandé est un workflow GitHub Actions manuel et planifié qui produit un clone miroir ou une archive restaurable, puis l'envoie au relais Drive avec un jeton stocké dans GitHub Secrets. Pyto affiche l'état de ce connecteur, mais ne clone pas tous les dépôts sur l'iPhone. Le dépôt `dalquier/Scriptable` reste exclu.

## Codex et ChatGPT

Le code produit par Codex n'est sauvegardé que lorsqu'il est publié dans une branche ou une Pull Request GitHub. Un fichier laissé uniquement dans un sandbox Codex reste temporaire.

Les conversations et fichiers joints relèvent du pipeline d'archive conversationnelle : Codex est capturé systématiquement selon le consentement permanent ProjectOS ; ChatGPT uniquement lorsque Damien choisit de l'enregistrer. La transcription intégrale et les fichiers accessibles passent d’abord par le tampon iCloud `ConversationBuffer`, puis vont dans `ConversationArchives` sur Google Drive après contrôle SHA-256. L'index et la synthèse vont dans GitHub. Les liens temporaires doivent être téléchargés immédiatement lorsqu'ils sont encore accessibles. Le tampon conserve indéfiniment toute archive non confirmée et 30 jours les archives confirmées.

L'export de données ChatGPT reste une sauvegarde de contrôle périodique, pas le mécanisme incrémental principal.

## Replit

Replit est un environnement d'exécution, de test et de déploiement, jamais la source canonique. Tout code durable est synchronisé vers GitHub. Les secrets restent dans Replit Secrets et sont inventoriés sans copier leur valeur. Les données d'exécution persistantes sont exportées séparément selon leur service de stockage. Les paramètres nécessaires à la reconstruction (`.replit`, dépendances et commandes) sont versionnés dans GitHub.

Le futur connecteur Replit est donc un contrôle d'écart et un export des données non Git, pas une seconde source de code concurrente.

## Ordre de réalisation

1. stabiliser l'application iPhone, la progression globale et les filtres ;
2. ajouter le connecteur GitHub cloud et sa restauration ;
3. relier l'état de l'archive Codex/ChatGPT à l'application — tampon et état intégrés ; automatisation de remise du paquet restant à connecter ;
4. ajouter l'audit Replit des fichiers non versionnés et des données persistantes ;
5. construire une vue « Couverture » indiquant pour chaque source le dernier succès, la fraîcheur, les éléments protégés et l'action corrective.

## Sécurité

- aucun token dans GitHub, les logs, le manifeste Drive ou le diagnostic UI ;
- aucun secret Replit copié en clair ;
- suppressions distantes interdites tant que le nouveau manifeste n'est pas vérifié ;
- une source inaccessible ne remplace jamais une sauvegarde valide.
