# ADR-002 — Synchronisation Drive résiliente et reprenable

## Statut

Acceptée pour BUILD-02.4 / v0.4.

## Contexte

La première synchronisation peut porter sur de nombreux fichiers. Les lots v0.3 allant jusqu'à 20 fichiers ou 5 Mio peuvent dépasser le délai de lecture de Pyto alors qu'Apps Script poursuit le traitement. Une relance aveugle peut alors refaire du travail. iOS peut aussi suspendre Pyto après un changement d'application : une longue exécution continue ne peut pas être garantie.

## Décision

- séparer les états `miroir local sécurisé` et `Drive vérifié` ;
- créer une session Drive persistante identifiée de manière stable avant tout transfert ;
- persister côté iPhone la file d'opérations, la phase et les confirmations reçues ;
- transmettre des lots initiaux de quatre fichiers au plus et d'environ 1 Mio au plus ;
- réduire automatiquement un lot lent ou en erreur jusqu'à un fichier ;
- après timeout, perte de réponse ou reprise, interroger l'état distant avant de renvoyer ;
- considérer une opération terminée uniquement après confirmation distante ;
- appliquer les suppressions après tous les envois confirmés ;
- publier le manifeste final en dernier, puis le relire et le comparer au manifeste local ;
- conserver une synthèse finale locale consultable au lancement suivant.

Chaque opération doit être idempotente : son identifiant et l'empreinte SHA-256 du contenu permettent au relais de reconnaître un fichier déjà appliqué. Une interruption n'est donc pas un échec du miroir local et ne doit provoquer ni double transfert ni suppression prématurée.

## États utilisateur

| État | Garantie |
|---|---|
| `local_complete` | Le miroir local `Current` et son manifeste sont cohérents. |
| `drive_pending` | Le miroir local est sécurisé ; des opérations Drive restent à confirmer. |
| `drive_complete` | Tous les envois et suppressions sont confirmés et le manifeste Drive relu est identique. |
| `attention_required` | Une erreur durable nécessite une action ; la dernière sauvegarde valide est préservée. |

## Arrière-plan iOS

Pyto demande une extension d'exécution, mais iOS peut suspendre ou arrêter le processus. La robustesse repose sur la reprise persistante, pas sur une promesse d'exécution illimitée. La première synchronisation doit être réalisée de préférence avec Pyto au premier plan et l'iPhone branché. Les synchronisations suivantes ne traitent que les ajouts, modifications et suppressions.

## Conséquences

- davantage de requêtes courtes, mais moins de timeouts longs et de répétitions ;
- reprise exacte après fermeture, suspension, perte réseau ou réponse tardive ;
- aucune suppression distante tant que les nouveaux contenus ne sont pas confirmés ;
- la fermeture de l'interface ne signifie pas que Drive est terminé ;
- Apps Script reste nécessaire, car Google Drive n'est pas un système de fichiers durablement sélectionnable par Pyto.

## Retour arrière

Revenir à la dernière version applicative et au dernier déploiement Apps Script compatibles. La dernière copie `Current` valide reste exploitable ; supprimer seulement les fichiers d'état de session v0.4 après avoir vérifié qu'aucune synchronisation n'est active.
