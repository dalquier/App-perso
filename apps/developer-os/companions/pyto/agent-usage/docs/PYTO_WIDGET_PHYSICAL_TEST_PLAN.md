# Plan de recette physique — Widget Pyto Agent Usage

Statut : **non exécuté**. Chaque contrôle reste `[TEST PHYSIQUE]`.

## Preuves à relever

Pour chaque test, noter :

- modèle d’iPhone ;
- version iOS ;
- version Pyto ;
- date et heure ;
- taille du widget ;
- état de Pyto ;
- résultat observé ;
- capture ou enregistrement d’écran ;
- anomalie et décision.

## Matrice prioritaire

| ID | Manipulation | Résultat attendu | Caractère |
|---|---|---|---|
| T01 | Ajouter le widget en petite taille | Layout propre, quota lisible, aucune troncature critique | Bloquant |
| T02 | Ajouter la taille moyenne | Layout moyen distinct et complet | Bloquant |
| T03 | Ajouter la grande taille | Tableau hebdomadaire lisible | Bloquant |
| T04 | Passer clair → sombre sans relancer | Palette dynamique contrastée | Bloquant |
| T05 | Tester sur fonds d’écran clair, sombre et chargé | Fond opaque et contenu lisible | Bloquant |
| T09 | Fermer Pyto depuis le sélecteur puis attendre un reload | Le widget finit par se reconstruire ou conserve une fraîcheur explicite | Bloquant |
| T11 | Redémarrer l’iPhone | Widget présent, lisible et cliquable | Bloquant |
| T13 | Lire les JSONL canoniques avec Pyto fermé | Dernier snapshot exact, aucun write | Bloquant |
| T17 | Utiliser un dossier iCloud externe puis redémarrer | Accès persistant sans nouvelle sélection | Conditionnel |
| T20 | Toucher le widget | Pyto s’ouvre et le lien `open:*` est sûr | Bloquant |
| T22 | Toucher après fermeture forcée | Parcours résumé/diagnostic accessible | Bloquant |
| T24 | Parcourir avec VoiceOver | Pourcentage et statut prononcés dans un ordre compréhensible | Bloquant |
| T32 | Mesurer les demandes à 15, 30, 45 et 60 minutes | Délai réel consigné, aucune promesse d’exactitude | Bloquant |
| T33 | Laisser le widget 24 h sans nouveau relevé | `Donnée ancienne` apparaît et la prévision est masquée | Bloquant |

## Résilience du stockage

1. Aucun fichier : `Aucun relevé`.
2. Principal absent avec `.bak` : données affichées avec `Sauvegarde utilisée`.
3. Principal avec une ligne JSON invalide et une ligne valide : données valides éventuellement affichées avec `Stockage à vérifier`.
4. Principal invalide et `.bak` valide : aucune substitution silencieuse.
5. Dossier inaccessible : `Stockage inaccessible`.
6. Vérifier qu’aucun fichier PNG, cache métier ou JSON additionnel n’est créé.

## Accessibilité

- VoiceOver sur pourcentage, statut, reset et fraîcheur ;
- grandes tailles de texte ;
- Réduire la transparence ;
- Réduire les animations ;
- mode clair/sombre ;
- vérifier que jauge et historique ne sont jamais l’unique source d’information.

## Rafraîchissement et états système

Tester :

- Pyto ouvert ;
- Pyto en arrière-plan ;
- Pyto fermé de force ;
- verrouillage/déverrouillage ;
- redémarrage ;
- mode économie d’énergie ;
- hors ligne ;
- iCloud non téléchargé localement.

## Graphiques

- netteté de la jauge ;
- historique de 2 à 7 points ;
- historique indisponible ;
- fallback sans Pillow ;
- mémoire et temps de rendu ;
- aucune image persistée sur disque.

## Critères de sortie

**GO** lorsque les trois tailles, la lecture fermée, le redémarrage, le toucher, VoiceOver, la fraîcheur et le stockage canonique sont fiables.

**GO sous conditions** si le refresh est différé mais explicitement daté, si le dossier doit rester dans Documents/Pyto, ou si l’historique doit être limité à la grande taille.

**NO-GO** si une valeur fausse est affichée, si `null` devient `0`, si le stockage n’est pas lisible avec Pyto fermé, si le widget reste blanc lors d’une erreur ou si aucune information principale n’est accessible à VoiceOver.
