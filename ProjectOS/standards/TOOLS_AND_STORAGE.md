# Outils et stockages

## Rôles permanents

- ChatGPT : architecture, raisonnement, recherche, cadrage, pilotage, revue et petits changements.
- Codex : outil obligatoire pour les nouveaux Builds, les projets multi-fichiers, les changements de code importants, les refactorings, les migrations, le débogage transversal, les tests et les Pull Requests associées.
- GitHub : source de vérité de tout contenu versionnable et lieu canonique de livraison.
- Working Copy : client Git principal sur iPhone.
- Replit Starter : environnement cloud d’exécution, de test, de stockage de travail, d’hébergement et de déploiement. Son agent IA n’est pas un outil de développement par défaut. Tout projet utilisant Replit applique `REPLIT_RUNTIME_CONTRACT.md`.
- iCloud Drive / `ProjectOS Workspace` : espace local de réception, travail, échange et sortie pour les fichiers non encore canoniques, régi par `WORKSPACE_AND_FILE_LIFECYCLE.md`.
- Pyto : compagnon permanent pour fonctions iPhone natives, automatisations locales, accès Fichiers/iCloud et utilitaires.
- Scriptable : widgets et automatisations iOS simples lorsque JavaScript est le meilleur choix.
- Google Drive : documents collaboratifs, sauvegardes et archives conversationnelles intégrales privées ; jamais source canonique du code.
- Canva : production et modification de supports visuels.
- AppDeploy : création rapide d’applications web publiques lorsque pertinent.
- OpenAI API : uniquement dans les applications créées ; ne remplace pas l’application ChatGPT ni Codex pendant le développement.

## Règles de stockage

1. Tout code et toute règle durable sont commités dans GitHub.
2. Tout nouveau projet doit disposer d’un dépôt ou dossier canonique déclaré dans `PROJECT_REGISTRY.md` et son manifeste avant une livraison substantielle.
3. Les fichiers complets d’un Build sont créés ou modifiés directement dans le dépôt canonique sur une branche dédiée.
4. Les secrets restent dans les gestionnaires de secrets des plateformes.
5. `iCloud Drive/ProjectOS Workspace` reçoit les téléchargements, brouillons, échanges et livrables locaux qui n’ont pas encore de destination canonique. Son cycle de vie est défini dans `WORKSPACE_AND_FILE_LIFECYCLE.md`.
6. Un fichier temporaire ne doit jamais être placé dans Working Copy ou un dépôt Git uniquement pour faciliter un téléchargement, un transfert ou un échange entre outils.
7. iCloud peut contenir d’autres données locales et échanges Pyto selon les besoins des projets, sans devenir une seconde branche éditable du code ni un transit obligatoire pour les conversations.
8. Drive reçoit des archives horodatées, les documents Google natifs et les archives conversationnelles directes définies dans `CONVERSATION_ARCHIVE_PIPELINE.md`.
9. Les fichiers volumineux sont indexés ; seuls les fragments utiles sont chargés.
10. Toute migration conserve une copie de retour arrière.
11. Un ZIP, un export Pyto, un artefact Replit ou une copie locale est un moyen d’installation, de test, de transit ou de sauvegarde, jamais la livraison canonique.
12. Tout changement durable effectué pendant un test Replit doit être reversé dans GitHub.
13. Pour une conversation enregistrée, GitHub ne reçoit que l’index et la synthèse ; le verbatim et les fichiers vont directement dans `App-perso/ProjectOS/Conversation-Archives/<Projet>/<année>/<Session>/` sur Drive.
14. Un runtime Replit doit être considéré comme jetable : il ne doit contenir aucun travail unique nécessaire à la continuité du projet.
15. Un Replit `dirty`, `ahead` ou `diverged` n’est pas synchronisé tant que les changements locaux ne sont pas classés ; `Pull`, `Sync` et `Push` sont interdits par défaut jusqu’à résolution.
16. `Open Artifact`, un Workflow manuel ou le panneau Validation ne remplacent jamais la vraie Preview/Webview du produit canonique sauf contrat explicite contraire.
17. Un fichier généré par ChatGPT ou un outil ProjectOS qui n’a pas encore de destination durable est classé après téléchargement dans `30_OUTPUT/<Projet>` ; s’il sert uniquement de transit vers un autre outil, utiliser `20_EXCHANGE`.
18. `00_INBOX`, `20_EXCHANGE` et `90_TRASH_7D` ne sont jamais des sources de vérité et ne sont pas sauvegardés par défaut par ProjectOS Backup.

## Routage des développements

Appliquer `CODE_WORK_ROUTING.md` et `TOOLCHAIN_POLICY.md` avant toute implémentation :

- changement limité, local et réversible : ChatGPT peut l’exécuter directement dans GitHub ;
- nouveau Build, projet multi-fichiers, architecture, refactoring substantiel, migration ou validation approfondie : Codex obligatoire ;
- exécution, test fonctionnel, hébergement et déploiement : Replit lorsque pertinent, après `REPLIT RUNTIME PREFLIGHT` ;
- fonctions natives iPhone et tests locaux : Pyto ou Scriptable selon la technologie.

Codex travaille contre le dépôt et la branche canoniques. Sa sortie attendue est une livraison GitHub vérifiable, pas un texte à recopier manuellement.

Pour un nouveau projet destiné à Replit, le `REPLIT_RUNTIME_CONTRACT.md` spécifique au projet doit être créé avant la première recette Replit. Pour une évolution qui modifie build, serveur, port, PWA, service worker, racine monorepo ou configuration Replit, ce contrat doit être relu et éventuellement mis à jour dans la même livraison.

Pour toute tâche créant, téléchargeant, transmettant ou nettoyant des fichiers locaux, appliquer `WORKSPACE_AND_FILE_LIFECYCLE.md` avant de choisir un emplacement iCloud, Drive ou GitHub.

## Maîtrise des crédits Replit

Les crédits IA Replit sont réservés à une capacité propre à Replit qui ne peut raisonnablement être traitée par ChatGPT ou Codex. Toute exception doit être annoncée et justifiée avant consommation. La génération ordinaire de code, les correctifs, refactorings et tests ne constituent pas une exception.

Un Agent Replit ne doit jamais être utilisé pour reconstruire un produit déjà canonique dans GitHub. Une exception limitée à la configuration propre au runtime Replit reste possible sous les conditions de `TOOLCHAIN_POLICY.md`, et ne doit produire aucun changement métier durable uniquement dans Replit.

## Choix d’outil

Choisir l’outil qui réduit le plus les manipulations manuelles tout en gardant GitHub comme référence. Ne pas imposer Replit, Pyto ou une WebView lorsque la plateforme ne convient pas au besoin. Ne pas contourner Codex pour un travail substantiel en fragmentant artificiellement la livraison dans la conversation.

Lorsque plusieurs surfaces Replit coexistent, identifier d’abord la surface réellement utilisée : `Preview/Webview`, `Artifact`, `Workflow`, `Validation` ou Agent. Ne jamais déduire que l’une exécute le produit canonique sans preuve du runtime et du SHA.
