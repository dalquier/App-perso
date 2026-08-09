# Équilibre — SESSION-30-A — Contrats de domaine

- Statut : candidate de Build, à relire avant intégration
- Base : `dalquier/App-perso@868aa4fe376c02a6e5c3921241a054242e3213bf`
- Dépendances : `SESSION_30_REFERENCE.md`, `CONVERSATIONAL_ARCHITECTURE_CONVERGENCE.md`, ADR-006
- Périmètre : domaine pur, sans moteur, stockage, UI, provider, LLM, mémoire enrichie ni voix

## 1. But du lot

`SESSION-30-A` transforme la convergence analytique en contrats exécutables et testables. Il ne rend aucune séance longue utilisable dans l’application. Il prépare le futur `LongSessionEngine` sans modifier le `ShortProtocolEngine` BUILD-04 ni le schéma de stockage v4.

## 2. Décisions figées

### Définition publique

`LongSessionDefinition` est une définition déclarative, versionnée et digestable. Elle contient exactement les sept phases canoniques, une durée active structurée, les modes autorisés et les politiques de transition, synthèse, action, mémoire et sécurité.

Invariants :

- `kind = long-conversational` ;
- version sémantique et espace de noms `equilibre.long-session.*` ;
- mode `structured` obligatoire ;
- sept phases dans l’ordre canonique ;
- cible 30 minutes, plage normale 24–36, maximum souple 40 ;
- transitions ambiguës soumises au choix utilisateur ;
- temps mesuré uniquement au premier plan et hors pause ;
- aucune expiration ni compte à rebours exact ;
- synthèse éditable et confirmée ;
- action facultative et nullable ;
- mémoire jamais persistée automatiquement ;
- gates safety avant persistance, provider et mutation ;
- aucune donnée utilisateur ni fonction dans une définition publique.

### Run long

`LongSessionRun` possède une enveloppe compatible avec la famille conceptuelle `ProtocolRun` : identité, version, digest, statut, horodatages et révision. Il ajoute mode d’interaction, activité, safety, phase courante, progression, turns, anchors, timing, origine facultative, résultat et future référence `sessionRecord`.

Invariants :

- `status = draft | completed` ;
- `activityState = active | paused` ;
- une pause reste un draft ;
- un draft possède exactement une phase active ;
- une séance terminée ne conserve aucune phase active ;
- safety interrompue implique pause ;
- une pause ne conserve aucun `activeSince` ;
- les turns textuels canoniques restent distincts des anchors ;
- tout anchor conserve ses `sourceTurnIds` et exige une confirmation explicite pour devenir `confirmed` ;
- un draft ne possède ni résultat, ni `sessionRecordId` ;
- une clôture normale ou anticipée exige une synthèse confirmée ;
- `actionPlan: null` est valide.

### SessionRecord futur

Le lot fige uniquement la forme attendue d’un record long : provenance `sourceSessionId`, référence protocole avec digest, mode de clôture, synthèse, action nullable et `sourceTurnIds`. Il ne crée ni ne persiste aucun record ; cette intégration appartient à `SESSION-30-D`.

## 3. Compatibilité BUILD-04

- aucun ajout de `runKind` aux runs courts persistés ;
- aucune modification de `catalog.js`, `engine.js`, `localStore.js` ou `app.js` ;
- aucun changement de version de stockage ;
- aucun protocole long actif dans le catalogue ;
- aucun écran, route ou contrôle utilisateur nouveau ;
- le digest SHA-256 canonique existant est réutilisé sans modification.

Le discriminant `runKind` est figé pour les futurs runs longs. La migration éventuelle des runs courts vers un discriminant explicite sera décidée avec le moteur ou le stockage concerné, jamais silencieusement dans ce lot.

## 4. Transitions contractuelles

Le lot décrit les transitions d’état de haut niveau sans les exécuter :

- draft actif normal → draft en pause normal ;
- draft actif normal → draft en pause safety ;
- draft actif normal → terminé en pause normal ;
- draft en pause normal → draft actif normal ;
- draft en pause safety → draft en pause normal après levée explicite de l’interruption ;
- terminé → aucune transition.

L’abandon signifie suppression du draft et n’est donc pas représenté comme un état persistant. Les opérations, effets et conditions détaillées appartiennent à `SESSION-30-B`.

## 5. Frontières de sécurité

Les contrats n’embarquent aucune logique clinique probabiliste. Ils garantissent seulement que les futures définitions déclarent les gates déterministes obligatoires et interdisent leur contournement. Le contenu bloqué ne doit jamais être copié dans un état, une erreur, une synthèse, un record ou une mémoire.

## 6. Critères d’acceptation

- contrats publics immuables après validation ;
- définitions contenant fonctions ou clés de données utilisateur refusées ;
- phases, modes, temps et politiques invalides refusés ;
- états incohérents refusés ;
- pause sans accumulation active représentable ;
- safety incompatible avec activité ;
- turns et anchors séparés avec provenance ;
- clôture anticipée sans action valide ;
- record long validable sans création automatique ;
- 181 tests BUILD-04 inchangés et verts ;
- build production vert ;
- aucun changement runtime ou UI, donc aucune recette Replit/iPhone requise pour ce lot.

## 7. Retour arrière

Supprimer les deux nouveaux modules de contrat, leur test et ce document. Aucun état persistant, migration ou donnée utilisateur n’est affecté.

## 8. Prochaine étape après intégration

`SESSION-30-B — Moteur structuré` pourra consommer ces contrats pour construire localement `S30-02 — Résoudre un problème concret`, avec pause/reprise, temps actif, fin anticipée et synthèse déterministe. Toute persistance et toute UI restent réservées à `SESSION-30-C`.
