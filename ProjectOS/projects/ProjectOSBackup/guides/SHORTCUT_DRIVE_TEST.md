# BUILD-02.1 — Test court Raccourcis vers Google Drive

## Objectif

Vérifier sur l’iPhone que Raccourcis peut transmettre un dossier iCloud complet au fournisseur Google Drive. Ce test dure moins d’une minute et précède toute automatisation longue.

## Raccourci `Test ProjectOS vers Drive`

1. Créer un nouveau raccourci nommé `Test ProjectOS vers Drive`.
2. Ajouter l’action **Fichier** et choisir :
   `iCloud Drive/ProjectOS Backup Transit/Current`.
3. Ajouter l’action **Enregistrer le fichier**.
4. Désactiver **Demander où enregistrer** si l’option est proposée.
5. Choisir comme destination :
   `Google Drive/App-perso/ProjectOS-Backups`.
6. Activer **Remplacer si le fichier existe** si l’option est proposée.
7. Ajouter **Afficher une notification** avec le texte :
   `Test Drive terminé`.
8. Exécuter le raccourci puis ouvrir Google Drive et vérifier la présence de `Current/MANIFEST.json`.

## Interprétation

- Si `Current/MANIFEST.json` est visible dans Drive, BUILD-02.2 peut utiliser Raccourcis comme transport.
- Si l’action **Fichier** refuse le dossier `Current`, si **Enregistrer le fichier** refuse un dossier, ou si seul un fichier vide est créé, arrêter : Raccourcis ne fournit pas le transport de dossiers requis et BUILD-02.2 devra utiliser un relais Google Apps Script.
- Ne supprimer aucun dossier iCloud ni Drive pendant ce test.
