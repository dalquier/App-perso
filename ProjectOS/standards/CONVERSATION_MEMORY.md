# ProjectOS — Mémoire conversationnelle

## 1. Objet

Ce standard organise la continuité entre les conversations ChatGPT, Codex et autres agents sans transformer l’historique conversationnel en source de vérité.

La mémoire conversationnelle sert à retrouver le contexte, les décisions, les travaux et les prochaines actions d’un projet. Elle reste secondaire par rapport au dépôt vivant, au manifeste, aux ADR, à la roadmap, à la documentation canonique et aux preuves GitHub.

## 2. Consentement et activation au démarrage

La mémoire conversationnelle n’est jamais activée silencieusement : elle repose soit sur un consentement permanent explicite et versionné, soit sur un consentement ponctuel.

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

Ce consentement couvre l’index, la chronologie, les synthèses de session et le transfert des décisions durables vers les références canoniques. Il ne déclenche pas automatiquement l’archivage du verbatim intégral : l’archive brute reste facultative, secondaire et dépend des capacités réelles d’export.

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

## 3. Effet d’une activation

Après une activation, automatique avec Codex ou ponctuelle après un `oui`, l’agent :

1. attribue un identifiant stable au format `SES-AAAAMMJJ-NNN` ;
2. confirme brièvement l’activation ;
3. charge, s’ils existent :
   - `memory/CONVERSATION_INDEX.md` ;
   - `memory/PROJECT_TIMELINE.md` ;
   - uniquement les synthèses de sessions pertinentes ;
4. crée ou prépare une entrée de session avec le statut `active` ;
5. conserve uniquement une mémoire structurée et utile ;
6. transfère les décisions durables vers les références canoniques appropriées.

L’activation ne vaut pas autorisation d’archiver des secrets, données personnelles sensibles, données médicales brutes ou contenus confidentiels inutiles.

## 4. Effet d’un non ou d’une révocation

Après un `non` dans un régime à consentement ponctuel :

- poursuivre normalement la conversation ;
- ne pas créer de synthèse de session ;
- ne pas modifier l’index conversationnel ;
- ne pas archiver la conversation brute ;
- continuer néanmoins à documenter dans GitHub toute décision ou livraison que la tâche exige indépendamment de la mémoire conversationnelle.

Le refus de mémoire ne bloque jamais le traitement du projet.

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
- état de l’archive brute : `non demandée`, `à exporter`, `archivée` ou `indisponible`.

## 10. Clôture

Pour une session enregistrée et significative, avant la réponse finale :

1. préparer ou mettre à jour la synthèse ;
2. mettre à jour l’index ;
3. mettre à jour la chronologie uniquement si un événement structurant a eu lieu ;
4. transférer les décisions durables vers le manifeste, une ADR, la roadmap ou la documentation ;
5. distinguer les faits vérifiés des hypothèses ;
6. indiquer ce qui n’a pas pu être archivé ou vérifié.

## 11. Conversation brute

La conversation brute est une archive secondaire facultative.

Stockages recommandés :

- iCloud Drive : boîte d’entrée depuis l’iPhone ;
- Google Drive : archive durable lorsqu’une exportation est disponible ;
- GitHub : index, chronologie et synthèses structurées uniquement.

Une archive brute ne doit jamais être nécessaire pour reprendre le projet.

## 12. Sécurité

Ne jamais conserver dans la mémoire :

- clé API, jeton, mot de passe ou secret ;
- donnée médicale détaillée non indispensable ;
- donnée personnelle brute inutile ;
- contenu confidentiel sans nécessité de projet.

En cas de doute, résumer ou masquer l’information sensible.
