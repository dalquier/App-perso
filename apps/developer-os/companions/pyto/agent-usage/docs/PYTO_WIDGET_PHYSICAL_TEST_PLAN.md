# Plan de recette physique — Widget Pyto Agent Usage

Statut : **non exécuté**. Chaque contrôle reste `[TEST PHYSIQUE]`.

## Preuves à relever

Pour chaque test, noter le modèle d’iPhone, les versions iOS/Pyto, la date, la taille du widget, l’état de Pyto, le résultat observé et une capture.

## Matrice prioritaire

| ID | Manipulation | Résultat attendu | Caractère |
|---|---|---|---|
| T01 | Ajouter le widget en petite taille | Quota, reset, crédits et fraîcheur lisibles | Bloquant |
| T02 | Ajouter la taille moyenne | Crédits et dernière commande visibles sans troncature critique | Bloquant |
| T03 | Ajouter la grande taille | Activité Codex/Work, consommation et historique lisibles | Bloquant |
| T04 | Passer clair → sombre sans relancer | Palette dynamique contrastée | Bloquant |
| T05 | Tester sur fonds d’écran clair, sombre et chargé | Fond opaque et contenu lisible | Bloquant |
| T06 | Snapshot avec crédits `null`, `0` puis `250` | Inconnus, zéro et `+250 crédits` restent distincts | Bloquant |
| T07 | Tâche absente, en cours, terminée et échouée | Date, titre et statut de la dernière commande sont exacts | Bloquant |
| T09 | Fermer Pyto puis attendre un reload | Widget reconstruit ou fraîcheur explicite | Bloquant |
| T11 | Redémarrer l’iPhone | Widget présent, lisible et cliquable | Bloquant |
| T13 | Lire les JSONL canoniques avec Pyto fermé | Valeurs exactes, aucune écriture | Bloquant |
| T17 | Utiliser un dossier iCloud externe puis redémarrer | Accès persistant sans nouvelle sélection | Conditionnel |
| T20 | Toucher le widget | Pyto s’ouvre et le lien `open:*` est sûr | Bloquant |
| T24 | Parcourir avec VoiceOver | Quota, crédits, reset et dernière commande sont compréhensibles | Bloquant |
| T32 | Mesurer le délai réel de refresh | Délai consigné, aucune promesse d’exactitude | Bloquant |
| T33 | Laisser le widget 24 h sans relevé | `Donnée ancienne` apparaît et la prévision disparaît | Bloquant |

## Résilience du stockage

1. Aucun fichier : `Aucun relevé` et éventuelle dernière tâche encore visible.
2. Principal absent avec `.bak` : données affichées avec `Sauvegarde utilisée`.
3. Principal avec lignes valides et invalides : valeurs valides avec `Stockage à vérifier`.
4. Principal invalide et `.bak` valide : aucune substitution silencieuse.
5. Dossier inaccessible : `Stockage inaccessible`.
6. Vérifier qu’aucun PNG, cache métier ou JSON additionnel n’est créé.

## Données fonctionnelles

Tester au minimum :

- quota 0, 12, 35, 63 et 100 % ;
- crédits inconnus, zéro et positifs ;
- aucune tâche, une tâche Codex, une tâche Work, tâche active et tâche échouée ;
- plusieurs états successifs du même `task_id` : une seule tâche logique ;
- intervalle mono-tâche, multi-tâches, reset et correction ;
- prévision fiable, prudente et indisponible ;
- historique de 2 à 7 points.

## Accessibilité

- VoiceOver sur quota, statut, reset, crédits, dernière commande et fraîcheur ;
- grandes tailles de texte ;
- Réduire la transparence ;
- mode clair/sombre ;
- jauge et historique jamais seuls porteurs d’une information.

## Critères de sortie

**GO** lorsque les trois tailles, les crédits, la dernière commande, la lecture avec Pyto fermé, le redémarrage, VoiceOver, la fraîcheur et le stockage canonique sont fiables.

**GO sous conditions** si le refresh est différé mais daté, si le dossier doit rester dans Documents/Pyto, ou si l’historique doit rester limité à la grande taille.

**NO-GO** si une valeur fausse est affichée, si `null` devient `0`, si la dernière commande compte plusieurs états comme plusieurs tâches, si le widget reste blanc lors d’une erreur ou si les informations principales sont inaccessibles à VoiceOver.
