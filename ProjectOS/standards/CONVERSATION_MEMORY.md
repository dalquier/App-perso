# ProjectOS — Mémoire conversationnelle

## Objet

La mémoire permet de retrouver les conversations, décisions, travaux et prochaines actions sans faire de l’historique une source de vérité. Les règles et décisions durables restent dans GitHub ; le verbatim et les fichiers restent dans Google Drive.

## Consentement

### Codex

Le consentement permanent donné le 5 août 2026 couvre toutes les conversations ProjectOS exécutées avec Codex. Au démarrage, l’agent :

1. attribue un identifiant `SES-AAAAMMJJ-NNN` ;
2. crée l’archive Drive et active la capture incrémentale ;
3. charge les seules mémoires pertinentes ;
4. termine sa première réponse par `Mémoire Codex : enregistrement activé.`

Aucune question supplémentaire n’est requise jusqu’à révocation explicite.

### ChatGPT et autres outils

La première réponse se termine exactement par :

`Enregistrer la conversation ?`

Aucun texte ne suit. Avant un `oui`, aucun artefact permanent de mémoire n’est créé. Après `oui`, l’identifiant et l’archive sont initialisés avant de poursuivre. Après `non`, la conversation continue sans index, synthèse ni archive.

## Contenu et emplacement

GitHub ne reçoit que :

- l’entrée d’index ;
- la synthèse ;
- les décisions durables transférées dans les références canoniques ;
- l’identifiant ou l’URL privée du dossier Drive, son statut et ses compteurs.

Google Drive reçoit directement :

- `conversation.jsonl`, journal machine incrémental ;
- `conversation.md`, transcription lisible de tous les messages visibles ;
- `attachments/`, toutes les pièces jointes accessibles ;
- `deliverables/`, tous les fichiers générés accessibles ;
- `MANIFEST.json`, inventaire, intégrité, manques et état.

Les raisonnements internes, messages système non visibles, secrets et données sensibles inutiles sont exclus.

## Capture

Chaque tour activé est enregistré avant l’envoi de la réponse : message utilisateur visible, réponse assistant visible, références des fichiers et état du manifeste. Le protocole détaillé est défini dans `CONVERSATION_ARCHIVE_PIPELINE.md`.

Une archive est `complete` seulement si tous les messages visibles depuis l’activation et tous les fichiers accessibles sont présents et inventoriés. Sinon elle est `partial` ou `error`, avec la cause explicite. Ne jamais présenter comme intégral un historique reconstitué après compactage ou indisponibilité.

## Index, synthèse et chronologie

L’index contient au minimum : session, date, outil, projet, nom, statut, branche/PR, synthèse, dossier Drive, état de l’archive et compteurs.

La synthèse contient : objectif, état initial, références, décisions, actions, fichiers, tests, résultats, limites, prochaine action, lien Drive et état vérifié.

La chronologie n’est modifiée que pour un événement structurant.

## Restitution

Pour retrouver une conversation :

1. rechercher l’index et les synthèses GitHub ;
2. sélectionner la session ;
3. ouvrir le dossier Drive privé ;
4. contrôler `MANIFEST.json` ;
5. restituer la transcription et uniquement les fichiers nécessaires.

La recherche naturelle peut interroger titres, projets, dates, mots-clés, décisions, branches et Pull Requests présents dans l’index et les synthèses.

## Clôture et sécurité

Avant la réponse finale d’une session significative : actualiser archive, synthèse, index et éventuellement chronologie ; transférer les décisions durables ; signaler tout manque.

Ne jamais archiver clé API, jeton, mot de passe ou secret. Masquer les données personnelles ou médicales non indispensables. La révocation arrête les futures captures ; toute suppression rétroactive exige une demande explicite.
