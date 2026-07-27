# Outils et stockages

## Rôles permanents

- ChatGPT : architecture, raisonnement, recherche, petits changements et pilotage.
- Codex : changements de code importants, refactorings, tests et Pull Requests.
- GitHub : source de vérité de tout contenu versionnable.
- Working Copy : client Git principal sur iPhone.
- Replit Starter : environnement cloud par défaut pour exécuter et déployer les applications.
- Pyto : compagnon permanent pour fonctions iPhone natives, automatisations locales, accès Fichiers/iCloud et utilitaires.
- Scriptable : widgets et automatisations iOS simples lorsque JavaScript est le meilleur choix.
- Google Drive : documents collaboratifs et sauvegardes, jamais source canonique du code.
- Canva : production et modification de supports visuels.
- AppDeploy : création rapide d’applications web publiques lorsque pertinent.
- OpenAI API : uniquement dans les applications créées ; ne remplace pas l’application ChatGPT ni Codex pendant le développement.

## Règles de stockage

1. Tout code et toute règle durable sont commités dans GitHub.
2. Les secrets restent dans les gestionnaires de secrets des plateformes.
3. iCloud contient les données locales et les échanges avec Pyto, sans devenir une seconde branche éditable du code.
4. Drive reçoit des archives horodatées et les documents Google natifs.
5. Les fichiers volumineux sont indexés ; seuls les fragments utiles sont chargés.
6. Toute migration conserve une copie de retour arrière.

## Choix d’outil

Choisir l’outil qui réduit le plus les manipulations manuelles tout en gardant GitHub comme référence. Ne pas imposer Replit, Pyto ou une WebView lorsque la plateforme ne convient pas au besoin.