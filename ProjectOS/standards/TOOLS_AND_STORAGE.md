# Outils et stockages

## Rôles permanents

- ChatGPT : architecture, raisonnement, recherche, cadrage, pilotage, revue et petits changements.
- Codex : outil obligatoire pour les nouveaux Builds, les projets multi-fichiers, les changements de code importants, les refactorings, les migrations, le débogage transversal, les tests et les Pull Requests associées.
- GitHub : source de vérité de tout contenu versionnable et lieu canonique de livraison.
- Working Copy : client Git principal sur iPhone.
- Replit Starter : environnement cloud d’exécution, de test, de stockage de travail, d’hébergement et de déploiement. Son agent IA n’est pas un outil de développement par défaut.
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
5. iCloud contient les données locales et les échanges avec Pyto, sans devenir une seconde branche éditable du code ni un transit obligatoire pour les conversations.
6. Drive reçoit des archives horodatées, les documents Google natifs et les archives conversationnelles directes définies dans `CONVERSATION_ARCHIVE_PIPELINE.md`.
7. Les fichiers volumineux sont indexés ; seuls les fragments utiles sont chargés.
8. Toute migration conserve une copie de retour arrière.
9. Un ZIP, un export Pyto, un artefact Replit ou une copie locale est un moyen d’installation, de test ou de sauvegarde, jamais la livraison canonique.
10. Tout changement durable effectué pendant un test Replit doit être reversé dans GitHub.
11. Pour une conversation enregistrée, GitHub ne reçoit que l’index et la synthèse ; le verbatim et les fichiers vont directement dans `App-perso/ProjectOS/Conversation-Archives/<Projet>/<année>/<Session>/` sur Drive.

## Routage des développements

Appliquer `CODE_WORK_ROUTING.md` et `TOOLCHAIN_POLICY.md` avant toute implémentation :

- changement limité, local et réversible : ChatGPT peut l’exécuter directement dans GitHub ;
- nouveau Build, projet multi-fichiers, architecture, refactoring substantiel, migration ou validation approfondie : Codex obligatoire ;
- exécution, test fonctionnel, hébergement et déploiement : Replit lorsque pertinent ;
- fonctions natives iPhone et tests locaux : Pyto ou Scriptable selon la technologie.

Codex travaille contre le dépôt et la branche canoniques. Sa sortie attendue est une livraison GitHub vérifiable, pas un texte à recopier manuellement.

## Maîtrise des crédits Replit

Les crédits IA Replit sont réservés à une capacité propre à Replit qui ne peut raisonnablement être traitée par ChatGPT ou Codex. Toute exception doit être annoncée et justifiée avant consommation. La génération ordinaire de code, les correctifs, refactorings et tests ne constituent pas une exception.

## Choix d’outil

Choisir l’outil qui réduit le plus les manipulations manuelles tout en gardant GitHub comme référence. Ne pas imposer Replit, Pyto ou une WebView lorsque la plateforme ne convient pas au besoin. Ne pas contourner Codex pour un travail substantiel en fragmentant artificiellement la livraison dans la conversation.