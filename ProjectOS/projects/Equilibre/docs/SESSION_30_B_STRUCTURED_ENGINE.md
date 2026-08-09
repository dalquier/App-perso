# Équilibre — SESSION-30-B — Moteur structuré local

- Statut : candidate de Build, à relire avant intégration
- Base : `dalquier/App-perso@2eaa9425a421967558fd64d1b1f6822f626d872c`
- Dépendance intégrée : `SESSION-30-A`, PR #125
- Périmètre : domaine pur, protocole local déterministe, sans stockage, UI, provider, LLM, mémoire ni voix

## 1. But du lot

`SESSION-30-B` rend exécutables les contrats SESSION-30-A avec un moteur spécialisé et une première définition : `S30-02 — Résoudre un problème concret`.

Le moteur reste entièrement local et déterministe. Il possède les phases, les confirmations, le temps actif et les transitions. Il ne produit aucun effet métier externe et ne rend pas encore la séance accessible dans l’application.

## 2. Première définition

Référence : `equilibre.long-session.solve-concrete-problem@1.0.0`.

Le parcours conserve les sept phases canoniques :

1. cadrer un sujet quotidien à faible risque ;
2. définir l’objectif de séance ;
3. distinguer le problème précis et le périmètre contrôlable ;
4. produire des options, examiner leurs compromis et choisir ou différer ;
5. confirmer le point devenu plus clair ;
6. choisir une action, une vérification ou aucune action ;
7. relire et confirmer une synthèse déterministe.

Chaque question produit un `Turn` textuel original et un anchor distinct. Un anchor reste `proposed` tant qu’une confirmation explicite ne l’a pas rendu `confirmed`. Une correction ajoute un nouveau Turn et remplace l’anchor actif sans réécrire le message original.

## 3. Responsabilités du moteur

Le module `longSessionEngine.js` fournit des opérations pures pour :

- créer un run long digesté ;
- refuser un second draft guidé connu de l’appelant ;
- exposer la prochaine question structurée sans progression automatique ;
- soumettre puis confirmer une réponse ;
- avancer seulement lorsque les anchors requis sont confirmés ;
- revenir à la phase précédente sans supprimer Turns ni anchors ;
- mesurer le temps actif ;
- mettre en pause et reprendre sans compter le temps suspendu ;
- interrompre pour safety sans copier le contenu bloqué ;
- lever l’interruption puis reprendre par deux actions distinctes ;
- produire une synthèse déterministe ;
- clôturer normalement ou plus tôt avec confirmation explicite ;
- rendre la clôture idempotente ;
- traduire l’abandon par la suppression attendue du draft.

## 4. Sécurité

Toute réponse passe par le gate textuel existant avant l’ajout d’un Turn ou d’un anchor. Un contenu sensible :

- n’est présent ni dans le run, ni dans l’objet de résultat ;
- n’est pas résumé ;
- ne crée aucune action, mémoire ou autre effet ;
- suspend le run dans l’état `draft / paused / interrupted` ;
- exige une levée explicite de l’interruption avant une reprise distincte.

La synthèse éditée et l’action éventuelle repassent également par le gate avant clôture.

## 5. Temps actif

Le moteur additionne uniquement les périodes actives. Une pause de plusieurs heures ou jours ne modifie pas `activeElapsedMs`. Aucun timeout, aucune expiration et aucun compte à rebours ne sont introduits.

Les transitions refusent les horodatages antérieurs au dernier état connu afin d’éviter un calcul temporel incohérent.

## 6. Frontières maintenues

Ce lot ne modifie pas :

- le `ShortProtocolEngine` BUILD-04 ;
- le catalogue visible et les deux protocoles courts actifs ;
- le stockage v4 ou ses migrations ;
- `app.js`, l’UI, la navigation ou le runtime Replit ;
- `SessionRecord`, l’historique ou la mémoire ;
- le provider local ou un futur backend OpenAI.

La référence S30-02 est donc disponible au moteur de domaine, mais pas encore lancée par l’application.

## 7. Critères d’acceptation

- une seule définition longue structurée initiale ;
- aucune activation semi-structurée ;
- aucune transition automatique ;
- anchors requis confirmés avant progression ;
- messages originaux préservés lors d’une correction ;
- temps suspendu exclu ;
- safety sans fuite du contenu bloqué ;
- clôture normale et anticipée ;
- action nullable ;
- aucune création de `SessionRecord` ou de mémoire ;
- tests SESSION-30-B et régressions historiques verts ;
- build production vert.

## 8. Retour arrière

Supprimer la définition S30-02, le moteur, les tests SESSION-30-B et ce document, puis rétablir les statuts documentaires. Aucun état persistant, schéma, cache ou runtime n’est affecté.

## 9. Étape suivante

`SESSION-30-C — Persistance et UX iPhone` doit d’abord arbitrer explicitement l’extension contrôlée du stockage v4 ou une migration storage-v5 / IndexedDB. Il branchera ensuite le moteur validé sans déplacer les règles de domaine dans l’UI.
