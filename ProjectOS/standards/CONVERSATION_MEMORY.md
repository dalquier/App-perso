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

Ce consentement couvre l’index, la chronologie, les synthèses de session et le transfert des décisions durables vers les références canoniques. L’archivage Drive est limité à ces conversations ProjectOS enregistrées, lorsque le verbatim ou les fichiers associés sont réellement accessibles. Il ne déclenche jamais un export global des conversations du compte OpenAI.

Le consentement permanent est révocable à tout moment. Une révocation doit être appliquée immédiatement, versionnée dans ProjectOS et ne supprime pas rétroactivement les synthèses ou archives existantes sauf demande explicite de Damien.

### 2.2 Consentement ponctuel pour les autres outils

Pour ChatGPT et tout autre outil ne bénéficiant pas d’un consentement permanent versionné, la première réponse ProjectOS doit se terminer par la question exacte :

```text
Enregistrer la conversation ?
```

Aucun texte ne doit suivre cette ligne.

Réponses attendues :

- `oui` : activer la mémoire de cette conversation et rendre son archivage sélectif admissible ;
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
6. transfère les décisions durables vers les références canoniques appropriées ;
7. prépare, si les éléments sont accessibles, l’archive Drive sélective de cette session et de ses fichiers associés non canoniques.

L’activation ne vaut pas autorisation d’archiver des secrets, données personnelles sensibles, données médicales brutes ou contenus confidentiels inutiles.

## 4. Effet d’un non ou d’une révocation

Après un `non` dans un régime à consentement ponctuel :

- poursuivre normalement la conversation ;
- ne pas créer de synthèse de session ;
- ne pas modifier l’index conversationnel ;
- ne pas archiver la conversation brute ni ses pièces jointes ;
- continuer néanmoins à documenter dans GitHub toute décision ou livraison que la tâche exige indépendamment de la mémoire conversationnelle.

Le refus de mémoire ne bloque jamais le traitement du projet.

## 5. Hiérarchie et statut

La mémoire conversationnelle :

- aide à comprendre l’historique ;
- n’atteste pas qu’un changement existe dans GitHub ;
- ne remplace pas une branche, un commit, une Pull Request ou un test ;
- ne prévaut jamais sur une référence canonique plus récente ;
- doit signaler les contradictions et éléments devenus obsolètes.

Une archive Drive est une preuve de conservation, pas une source canonique de projet.

## 6. Structure par projet

Chemins recommandés :

```text
ProjectOS/projects/<Projet>/memory/
├── CONVERSATION_INDEX.md
├── PROJECT_TIMELINE.md
└── SESSION_SUMMARIES/
```

L’absence du dossier n’empêche pas l’amorçage. Après activation, il peut être initialisé sur une branche dédiée lorsque la tâche autorise une modification GitHub.

## 7. Chargement sélectif et récupération

Après activation, ne jamais charger tout l’historique par défaut.

Sélectionner uniquement les synthèses liées :

- au projet et au jalon ;
- à l’axe ou la mission ;
- à la branche ou Pull Request ;
- aux fichiers, fonctionnalités ou décisions concernés ;
- à la période utile.

Ordre de récupération :

1. rechercher dans l’index et la chronologie GitHub ;
2. ouvrir la synthèse de session ;
3. consulter les références canoniques ;
4. accéder à l’archive Drive privée seulement si la synthèse est insuffisante ;
5. charger uniquement les fichiers nécessaires.

## 8. Sessions à mémoriser et à archiver

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

L’archive Drive ne concerne que les sessions enregistrées. Elle peut contenir :

- le verbatim exporté, s’il est disponible ;
- les pièces jointes fournies ou produites pendant la session ;
- les livrables non canoniques nécessaires à une reprise ;
- une copie de la synthèse et un manifeste d’intégrité.

Le code, la documentation et les autres fichiers canoniques restent dans GitHub. Ils peuvent être référencés par le manifeste mais ne sont pas déplacés hors du dépôt pour libérer de l’espace.

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
- statut d’archive Drive : `non requise`, `à préparer`, `partielle`, `vérifiée`, `indisponible` ou `supprimée` ;
- lien du dossier Drive privé, nombre de fichiers, taille, SHA-256 du bundle et éléments indisponibles, lorsque ces données existent.

## 10. Clôture

Pour une session enregistrée et significative, avant la réponse finale :

1. préparer ou mettre à jour la synthèse ;
2. mettre à jour l’index ;
3. mettre à jour la chronologie uniquement si un événement structurant a eu lieu ;
4. transférer les décisions durables vers le manifeste, une ADR, la roadmap ou la documentation ;
5. distinguer les faits vérifiés des hypothèses ;
6. préparer l’archive Drive si les fichiers sont accessibles ;
7. vérifier l’existence du dossier, l’inventaire, la taille et l’empreinte du bundle avant de marquer l’archive `vérifiée` ;
8. indiquer ce qui n’a pas pu être exporté, archivé ou vérifié.

L’absence d’export disponible ne bloque pas la clôture : le statut devient `indisponible` ou `partielle` et la lacune est explicitée.

## 11. Répartition des données

### GitHub

GitHub conserve :

- index et chronologie ;
- synthèses structurées ;
- décisions durables et documentation canonique ;
- statut, lien Drive privé et métadonnées minimales de l’archive.

GitHub ne conserve pas le verbatim, les exports complets ni les pièces jointes non canoniques uniquement destinées à l’archive.

### Google Drive

Google Drive conserve, pour les seules conversations ProjectOS enregistrées :

- verbatim exporté réellement disponible ;
- pièces jointes et livrables non canoniques ;
- manifeste d’archive ;
- bundle optionnel et empreintes d’intégrité.

Le dossier reste privé. Aucun lien public n’est créé.

### iCloud Drive

iCloud sert de boîte d’entrée ou de transit depuis l’iPhone et les applications qui exportent vers Fichiers. Il ne constitue pas une archive durable et n’est pas synchronisé bidirectionnellement avec GitHub ou Drive.

Une copie de transit ne peut être supprimée qu’après vérification de Drive et action explicite. La suppression doit rester récupérable lorsque la plateforme le permet.

### Lien entre les espaces

L’identifiant `SES-AAAAMMJJ-NNN` relie l’index GitHub, la synthèse, le dossier Drive et le manifeste. Les chemins, tailles et SHA-256 permettent la vérification sans dupliquer les archives dans GitHub.

## 12. États de l’archive

- `non requise` : aucun verbatim ou fichier associé utile à conserver.
- `à préparer` : éléments disponibles mais pas encore téléversés et vérifiés.
- `partielle` : archive vérifiée pour les éléments disponibles, avec des éléments manquants documentés.
- `vérifiée` : dossier, inventaire, accès privé et intégrité contrôlés.
- `indisponible` : la plateforme ne permet pas d’obtenir les éléments attendus.
- `supprimée` : archive supprimée sur demande explicite, avec mise à jour de l’index.

Un simple lien ou un téléversement non contrôlé ne suffit pas pour le statut `vérifiée`.

## 13. Limites d’automatisation

L’automatisation peut préparer un bundle, calculer les empreintes, téléverser vers Drive, vérifier les métadonnées et mettre à jour l’index lorsque les fichiers sont accessibles.

Elle ne doit pas prétendre exporter automatiquement un verbatim ou des pièces jointes que l’interface ChatGPT ou Codex ne rend pas accessibles. Elle ne parcourt jamais l’ensemble du compte OpenAI.

Le mode opératoire détaillé est défini dans `../guides/CONVERSATION_ARCHIVING.md`.

## 14. Sécurité

Ne jamais conserver dans la mémoire ou l’archive :

- clé API, jeton, mot de passe ou secret ;
- donnée médicale détaillée non indispensable ;
- donnée personnelle brute inutile ;
- contenu confidentiel sans nécessité de projet.

En cas de doute, résumer, masquer ou exclure l’information sensible. Les liens Drive restent privés et les droits d’accès sont vérifiés avant clôture.
