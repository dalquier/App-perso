# ProjectOS — Mémoire conversationnelle

## 1. Objet

Ce standard organise la continuité entre les conversations ChatGPT, Codex et autres agents sans transformer l’historique conversationnel en source de vérité.

La mémoire conversationnelle sert à retrouver le contexte, les décisions, les travaux et les prochaines actions d’un projet. Elle reste secondaire par rapport au dépôt vivant, au manifeste, aux ADR, à la roadmap, à la documentation canonique et aux preuves GitHub.

## 2. Consentement et activation au démarrage

La mémoire conversationnelle n’est jamais activée silencieusement : elle repose soit sur un consentement permanent explicite et versionné, soit sur un consentement ponctuel, soit sur une directive explicite de désactivation pour la conversation courante.

### 2.1 Consentement permanent spécifique à Codex

Damien a donné le 5 août 2026 un consentement permanent pour enregistrer toutes les conversations ProjectOS exécutées avec Codex.

En conséquence, au démarrage de chaque conversation ProjectOS avec Codex, l’agent :

1. active automatiquement l’enregistrement structuré ;
2. attribue un identifiant stable au format `SES-AAAAMMJJ-NNN` ;
3. charge sélectivement l’index, la chronologie et les synthèses pertinentes ;
4. termine sa première réponse par la ligne exacte :

```text
Mémoire Codex : enregistrement activé.
```

Aucune nouvelle question de consentement n’est requise avec Codex tant que cette décision n’est pas révoquée explicitement.

Ce consentement couvre l’index, la chronologie, les synthèses, le transfert des décisions durables et l’archive intégrale définie dans `CONVERSATION_ARCHIVE_PIPELINE.md`. Pour Codex, le verbatim visible et tous les fichiers accessibles sont enregistrés directement dans Google Drive ; aucun export tardif ni transit iCloud n’est requis.

Le consentement permanent est révocable à tout moment. Une révocation doit être appliquée immédiatement, versionnée dans ProjectOS et ne supprime pas rétroactivement les synthèses existantes sauf demande explicite de Damien.

### 2.2 Consentement ponctuel pour les autres outils

Pour ChatGPT et tout autre outil ne bénéficiant pas d’un consentement permanent versionné, la première réponse ProjectOS doit se terminer par la question exacte :

```text
Enregistrer la conversation ?
```

Aucun texte ne doit suivre cette ligne.

Réponses attendues :

- `oui` : activer la mémoire de cette conversation ;
- `non` : ne créer ni index, ni synthèse, ni archive pour cette conversation.

Une réponse équivalente et non ambiguë peut être comprise. Tant que Damien n’a pas répondu, l’état est `consentement-en-attente` et aucun artefact permanent de mémoire ne doit être créé.

### 2.3 Directive explicite `MEMORY = OFF`

Une conversation peut porter la directive explicite suivante :

```text
MEMORY = OFF — Ne mémorise ni n’archive cette conversation. Ne pose pas la question « Enregistrer la conversation ? ». Après l’amorçage ProjectOS, commence directement la mission demandée.
```

Cette directive vaut instruction explicite de Damien pour la conversation courante.

Effets :

- aucune question `Enregistrer la conversation ?` ;
- aucun identifiant de session mémoire ;
- aucun index, aucune synthèse et aucune archive Drive de conversation ;
- aucun chargement de mémoire conversationnelle au seul titre de la continuité ;
- poursuite immédiate vers la mission après l’amorçage ;
- aucun effet sur les artefacts GitHub, PR, documents, tests ou livrables exigés indépendamment de la mémoire.

Pour Codex, `MEMORY = OFF` suspend le consentement permanent uniquement pour cette conversation précise. Le consentement permanent reste actif pour les autres conversations qui ne portent pas cette directive.

### 2.4 Prompts générés automatiquement par les scripts MAÎTRE

Tout script, analyseur, orchestrateur ou autre générateur ProjectOS qui produit un prompt opérationnel contenant une activation `POS =` ou `RPOS =` doit insérer immédiatement après cette activation la directive canonique `MEMORY = OFF` de la section 2.3.

C’est le régime par défaut des prompts générés automatiquement : ils ne doivent jamais interrompre la mission pour demander `Enregistrer la conversation ?`.

Cette règle s’applique notamment aux scripts sous `ProjectOS/scripts/**`, aux futurs scripts MAÎTRE, aux générateurs de prompts DeveloperOS et aux générateurs d’audit, QA, build ou analyse d’incidents.

Un générateur ne peut utiliser un autre régime que si sa fonction exige explicitement une conversation enregistrée ; dans ce cas, il doit déclarer ce régime dans le prompt au lieu de retomber implicitement sur une question de consentement.

Les tests d’un générateur contenant `POS =` ou `RPOS =` doivent vérifier la présence de `MEMORY = OFF` avant le début de la mission.

## 3. Effet d’une activation

Après une activation, automatique avec Codex ou ponctuelle après un `oui`, l’agent :

1. attribue un identifiant stable au format `SES-AAAAMMJJ-NNN` ;
2. confirme brièvement l’activation ;
3. charge, s’ils existent :
   - `memory/CONVERSATION_INDEX.md` ;
   - `memory/PROJECT_TIMELINE.md` ;
   - uniquement les synthèses de sessions pertinentes ;
4. initialise le dossier Drive et son manifeste selon `CONVERSATION_ARCHIVE_PIPELINE.md` ;
5. crée ou prépare une entrée de session avec le statut `active` ;
6. capture ensuite chaque tour visible et chaque fichier accessible ;
7. conserve dans GitHub uniquement l’index, la synthèse et les décisions durables ;
8. transfère les décisions durables vers les références canoniques appropriées.

L’activation ne vaut pas autorisation d’archiver des secrets, données personnelles sensibles, données médicales brutes ou contenus confidentiels inutiles.

## 4. Effet d’un non, de `MEMORY = OFF` ou d’une révocation

Après un `non` dans un régime à consentement ponctuel ou lorsque `MEMORY = OFF` est présent :

- poursuivre normalement la conversation ;
- ne pas créer de synthèse de session ;
- ne pas modifier l’index conversationnel ;
- ne pas archiver la conversation brute ;
- continuer néanmoins à documenter dans GitHub toute décision ou livraison que la tâche exige indépendamment de la mémoire conversationnelle.

Le refus ou la désactivation de mémoire ne bloque jamais le traitement du projet.

## 5. Hiérarchie et statut

La mémoire conversationnelle :

- aide à comprendre l’historique ;
- n’atteste pas qu’un changement existe dans GitHub ;
- ne remplace pas une branche, un commit, une Pull Request ou un test ;
- ne prévaut jamais sur une référence canonique plus récente ;
- doit signaler les contradictions et éléments devenus obsolètes.

## 6. Structure par projet

Chemins recommandés :

```text
ProjectOS/projects/<Projet>/memory/
├── CONVERSATION_INDEX.md
├── PROJECT_TIMELINE.md
└── SESSION_SUMMARIES/
```

L’absence du dossier n’empêche pas l’amorçage. Après activation, il peut être initialisé sur une branche dédiée lorsque la tâche autorise une modification GitHub.

## 7. Chargement sélectif

Après activation, ne jamais charger tout l’historique par défaut.

Sélectionner uniquement les synthèses liées :

- au projet et au jalon ;
- à l’axe ou la mission ;
- à la branche ou Pull Request ;
- aux fichiers, fonctionnalités ou décisions concernés ;
- à la période utile.

Avec `MEMORY = OFF`, ne pas charger ces éléments uniquement pour recréer le contexte conversationnel ; les documents canoniques explicitement nécessaires à la mission restent consultables normalement.

## 8. Sessions à mémoriser

Une session mérite une synthèse lorsqu’elle produit au moins un élément structurant :

- décision ;
- spécification ;
- audit ou diagnostic ;
- modification ou livraison ;
- branche, commit ou Pull Request ;
- résultat de test ;
- changement de trajectoire ;
- clarification importante ;
- prochaine action structurante.

Les échanges triviaux ou purement pratiques peuvent rester sans synthèse même après activation, à condition que l’index indique `aucune synthèse nécessaire` si une session avait été ouverte.

## 9. Contenu minimal d’une synthèse

Une synthèse autonome comprend :

- identifiant de session ;
- date ;
- projet ;
- outil ou agent ;
- nom de discussion ;
- objectif ;
- état initial vérifié ;
- références consultées ;
- décisions et hypothèses ;
- actions réalisées ;
- fichiers concernés ;
- branches, commits et Pull Requests ;
- tests et contrôles exécutés ;
- résultats ;
- limites, risques et contradictions ;
- prochaine action ;
- références canoniques mises à jour ;
- dossier Drive privé, compteurs et état d’archive : `initializing`, `active`, `complete`, `partial`, `error` ou `revoked`.

## 10. Clôture

Pour une session enregistrée et significative, avant la réponse finale :

1. préparer ou mettre à jour la synthèse ;
2. mettre à jour l’index ;
3. mettre à jour la chronologie uniquement si un événement structurant a eu lieu ;
4. transférer les décisions durables vers le manifeste, une ADR, la roadmap ou la documentation ;
5. distinguer les faits vérifiés des hypothèses ;
6. indiquer ce qui n’a pas pu être archivé ou vérifié.

Aucune clôture mémoire n’est exécutée pour une conversation `MEMORY = OFF`.

## 11. Archive intégrale

L’archive intégrale est une archive secondaire de continuité, jamais une source de vérité.

Répartition obligatoire :

- GitHub : index, chronologie, synthèses et décisions durables uniquement ;
- Google Drive : `conversation.jsonl`, `conversation.md`, `MANIFEST.json`, `attachments/` et `deliverables/` ;
- iCloud Drive : aucun transit requis.

La capture commence dès l’activation et s’effectue tour par tour selon `CONVERSATION_ARCHIVE_PIPELINE.md`. Elle contient les messages visibles exacts, toutes les pièces jointes réellement accessibles et les livrables générés. Les raisonnements internes et instructions invisibles sont exclus.

Une archive n’est `complete` que si la transcription depuis l’activation et tous les fichiers accessibles ont été vérifiés. Toute limite d’accès, panne de connecteur ou perte d’historique impose `partial` ou `error`, avec cause explicite. Une archive intégrale ne doit jamais être nécessaire pour reprendre le projet.

`MEMORY = OFF` interdit l’initialisation de cette archive pour la conversation concernée.

## 12. Sécurité

Ne jamais conserver dans la mémoire :

- clé API, jeton, mot de passe ou secret ;
- donnée médicale détaillée non indispensable ;
- donnée personnelle brute inutile ;
- contenu confidentiel sans nécessité de projet.

En cas de doute, résumer ou masquer l’information sensible.
