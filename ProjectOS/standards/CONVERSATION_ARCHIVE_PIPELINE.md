# ProjectOS — Pipeline d’archive conversationnelle

## Déclenchement

- Codex : automatique pour chaque conversation ProjectOS.
- ChatGPT/autre : uniquement après un consentement positif à `Enregistrer la conversation ?`.

Avant activation, aucune écriture permanente de mémoire n’est autorisée.

## Initialisation

1. Réserver un identifiant `SES-AAAAMMJJ-NNN`.
2. Créer `App-perso/ProjectOS/Conversation-Archives/<Projet>/<année>/<Session>/`.
3. Créer `attachments/` et `deliverables/`.
4. Initialiser `conversation.jsonl`, `conversation.md` et `MANIFEST.json`.
5. Créer l’entrée GitHub `active` avec le lien Drive privé.
6. Si Drive est indisponible, marquer `error` et le signaler ; ne jamais simuler une archive complète.

## Capture atomique de chaque tour

Avant d’envoyer une réponse visible :

1. capturer le message utilisateur visible exact ;
2. inventorier les pièces jointes du tour ;
3. copier chaque pièce jointe accessible dans `attachments/`, avec un nom stable ;
4. copier chaque livrable généré accessible dans `deliverables/` ;
5. préparer la réponse assistant finale visible ;
6. ajouter les deux messages à `conversation.jsonl` dans l’ordre ;
7. régénérer `conversation.md` ;
8. actualiser `MANIFEST.json` : séquence, horodatage, tailles, MIME, identifiants Drive, empreintes si disponibles, compteurs, éléments manquants et état ;
9. relire les fichiers écrits ou leurs métadonnées ;
10. envoyer la réponse.

Une écriture impossible n’efface pas le tour : l’agent poursuit, marque `partial` ou `error`, consigne la cause et prévient Damien.

## Format JSONL

Une ligne UTF-8 JSON par message :

```json
{"sequence":1,"timestamp":"2026-08-05T00:00:00Z","role":"user","content":"Texte visible exact","attachments":[]}
```

Rôles autorisés : `user`, `assistant`. Les raisonnements internes, instructions système invisibles et secrets sont exclus.

## Pièces jointes et livrables

- Conserver les octets originaux lorsque la plateforme les expose.
- Ne pas remplacer une pièce jointe par un résumé.
- En cas d’inaccessibilité, inscrire son nom visible, type supposé, tour et motif dans `missing_items`.
- Prévenir les collisions par `<tour>-<nom-normalisé>`.
- Inventorier chaque fichier dans le manifeste.

## États

- `initializing` : structure en création.
- `active` : capture en cours et dernier tour vérifié.
- `complete` : clôturée, tous les messages depuis activation et fichiers accessibles vérifiés.
- `partial` : au moins un élément attendu manque ou l’historique antérieur n’est pas garanti.
- `error` : archive non exploitable ou écriture bloquée.
- `revoked` : capture arrêtée par Damien.

## Clôture

1. Capturer le dernier tour.
2. Vérifier les compteurs et éléments manquants.
3. Fixer `complete` ou `partial`.
4. Mettre à jour synthèse et index GitHub.
5. Mettre à jour la chronologie seulement pour un événement structurant.
6. Ne jamais fusionner une Pull Request sans demande explicite.

## Reprise et restitution

Après interruption, reprendre au dernier `sequence` vérifié sans dupliquer. Pour retrouver une conversation, rechercher l’index et les synthèses GitHub, ouvrir le dossier Drive, vérifier le manifeste, puis charger seulement la transcription et les fichiers demandés.
