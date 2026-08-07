# ProjectOS — Incident Learning

## 1. Objet

Ce standard organise la détection, la classification, la déduplication et l’historisation des incidents et blocages rencontrés pendant l’exécution de ProjectOS.

Il ne cherche pas à supprimer tous les avertissements. Il distingue :

- les erreurs évitables ;
- les limitations externes connues et correctement contournées ;
- les défauts de processus ProjectOS ;
- les événements ponctuels sans valeur d’apprentissage.

Le registre permanent est l’issue GitHub **#87 — `ProjectOS — Incident Ledger`** dans `dalquier/App-perso`. Les commentaires de cette issue constituent le journal append-only des occurrences.

## 2. Définitions

- **Occurrence** : événement observé à une date, dans un projet, un outil et une étape donnés.
- **Incident** : regroupement d’une ou plusieurs occurrences partageant la même cause racine et une signature stable.
- **Conséquence** : effet d’un incident ; elle ne crée pas automatiquement un nouvel incident.
- **Signature** : identifiant stable `TYPE.SUBTYPE` permettant la déduplication.
- **Workaround** : contournement vérifié permettant de poursuivre sans corriger la cause racine.
- **Couverture ProjectOS** : niveau auquel les règles existantes détectent, préviennent ou contournent l’incident.

Exemple : Chromium absent, téléchargement Playwright bloqué en HTTP 403, E2E impossibles et screenshot impossible peuvent former un seul incident `ENVIRONMENT.PLAYWRIGHT_BROWSER_UNAVAILABLE` lorsque la cause racine est l’indisponibilité du navigateur dans l’environnement.

## 3. Types canoniques

| Type | Périmètre |
|---|---|
| `ENVIRONMENT` | exécutable, runtime, bibliothèque système ou capacité locale absente |
| `NETWORK_EXTERNAL` | CDN, DNS, proxy, domaine interdit, API externe indisponible |
| `AUTH_ACCESS` | authentification, permission, credential ou accès refusé |
| `GIT_DELIVERY` | push, branche, PR, publication ou transport Git impossible/incohérent |
| `CI_TESTING` | test obligatoire, workflow, runner ou preuve de validation indisponible/KO |
| `FRESHNESS_CONCURRENCY` | base obsolète, branche divergente, conflit ou évolution concurrente |
| `ARTIFACT_RECOVERY` | patch, fichier, binaire ou handoff non récupérable |
| `TOOL_CAPABILITY` | action non supportée par un outil ou connecteur |
| `QUALITY_CONTRACT` | résultat techniquement vert mais contrat fonctionnel/architectural non respecté |
| `DATA_MIGRATION` | schéma, version, migration ou persistance incompatible |
| `PROCESS_GOVERNANCE` | fusion prématurée, mauvais périmètre, règle de gouvernance contournée |
| `MEMORY_ARCHIVE` | archive, index ou mémoire incomplet, incohérent ou non reconstructible |

Un sous-type est en `SCREAMING_SNAKE_CASE`, par exemple `AUTH_ACCESS.CODEX_TERMINAL_GITHUB_AUTH_MISSING`.

## 4. Gravité

La gravité dépend de l’impact réel et du contournement disponible, jamais du niveau visuel du message d’erreur.

- **S1 — Critique** : perte/corruption de données, sécurité, secret exposé, mauvaise fusion dans `main`, action irréversible ou intégrité canonique compromise.
- **S2 — Majeur** : livraison, intégration ou validation critique bloquée sans contournement fiable et immédiat.
- **S3 — Modéré** : validation, outil ou étape bloqué mais un contournement fiable et vérifiable existe.
- **S4 — Mineur** : dégradation ou avertissement sans blocage matériel du résultat.

La gravité peut évoluer si un workaround devient disponible ou disparaît.

## 5. Statuts

- `OPEN` : cause ou impact encore actif.
- `MITIGATED` : workaround fiable en place, cause non supprimée.
- `RESOLVED` : cause corrigée ou rendue non pertinente.
- `ACCEPTED_LIMITATION` : limitation externe connue dont le contournement est considéré comme le fonctionnement normal.

## 6. Couverture ProjectOS

- `NONE` : ProjectOS ne détecte ni ne gère utilement l’incident.
- `PARTIAL` : ProjectOS détecte ou contourne une partie du problème, mais du temps ou un risque évitable subsiste.
- `FULL` : ProjectOS détecte le cas assez tôt, applique le bon fallback et empêche une mauvaise déclaration de succès ou une action dangereuse.

`FULL` ne signifie pas que la limitation externe a disparu.

## 7. Déclencheurs de capture

Créer ou mettre à jour un incident lorsqu’un événement matériel répond à au moins un critère :

- commande obligatoire impossible ou code retour non nul bloquant une étape ;
- HTTP 4xx/5xx empêchant l’exécution prévue ;
- exécutable, dépendance, runtime ou navigateur obligatoire absent ;
- credential, permission ou capacité d’écriture absente ;
- publication, push, création/mise à jour de PR ou récupération impossible ;
- SHA distant, SHA testé ou SHA relu non cohérents ;
- CI requise absente, stale ou en échec ;
- preuve obligatoire impossible à produire ;
- base ou ressource logique devenue incompatible pendant la tâche ;
- reconstruction, rebase ou transport de secours rendu nécessaire par un problème d’environnement/processus ;
- fusion non souhaitée ou autre défaut de gouvernance ;
- archive/mémoire déclarée complète alors qu’elle est partielle ou incohérente.

Ne pas capturer :

- un simple message informatif sans impact ;
- une erreur de saisie immédiatement corrigée sans effet ;
- plusieurs conséquences d’une même cause comme incidents séparés ;
- un événement contenant des données sensibles qui ne peuvent pas être suffisamment expurgées.

## 8. Déduplication

Avant toute nouvelle occurrence :

1. identifier la cause racine la plus probable sur la base des faits disponibles ;
2. produire une signature stable `TYPE.SUBTYPE` ;
3. chercher cette signature dans l’Incident Ledger #87 ;
4. si elle existe, ajouter une occurrence au même `incident_id` ;
5. sinon créer un nouvel `incident_id` logique et la première occurrence ;
6. rattacher les conséquences dans `impact` plutôt que créer des incidents enfants inutiles.

Format recommandé d’identifiant : `INC-<SIGNATURE_COURTE>`, par exemple `INC-PLAYWRIGHT-BROWSER`.

Une nouvelle cause racine démontrée doit créer un incident distinct même si le symptôme ressemble à un incident existant.

## 9. Format canonique d’une occurrence

```text
INCIDENT OCCURRENCE
incident_id: INC-...
signature: TYPE.SUBTYPE
severity: S1|S2|S3|S4
status: OPEN|MITIGATED|RESOLVED|ACCEPTED_LIMITATION
project: <id ProjectOS ou transverse>
tool: <ChatGPT|Codex|GitHub|Replit|Pyto|...>
stage: <bootstrap|build|test|e2e|publish|review|merge|archive|...>
occurred_at: <ISO-8601>
source: <PR/issue/task/commit/conversation>
symptom: <résumé factuel expurgé>
root_cause: <cause connue ou UNKNOWN>
impact: <ce qui n’a pas pu être fait ou risque créé>
workaround: <contournement vérifié ou NONE>
projectos_coverage: NONE|PARTIAL|FULL
candidate_projectos_change: <idée concise ou NONE>
```

Le modèle machine-readable correspondant est `ProjectOS/templates/INCIDENT_OCCURRENCE.json.example`.

## 10. Politique d’écriture

### GitHub disponible

Lorsque l’agent peut écrire dans GitHub, il ajoute directement un commentaire structuré à l’issue #87 après avoir dédupliqué la signature.

Cette écriture ne nécessite pas de branche ni de Pull Request car elle constitue un journal opérationnel, pas une modification de la source canonique.

### GitHub non disponible en écriture

L’agent ajoute un bloc `INCIDENT_CAPTURE_PENDING` dans son handoff ou son rapport final. Le coordinateur ProjectOS doit l’enregistrer dans #87 pendant la réconciliation.

Un incident ne doit jamais être perdu uniquement parce que l’environnement producteur ne peut pas écrire dans GitHub.

## 11. Execution Capability Preflight

Avant de promettre une validation dépendant d’une capacité d’environnement, vérifier explicitement les capacités nécessaires.

Pour les tâches concernées, le preflight couvre au minimum :

```text
EXECUTION CAPABILITY PREFLIGHT
Required runtime/executable:
Executable already available: YES / NO / UNKNOWN
Installation required: YES / NO
Installation channel reachable: YES / NO / UNKNOWN
External domains/services required:
Browser/runtime required:
Screenshot/rendering capability required: YES / NO
Screenshot/rendering capability available: YES / NO / UNKNOWN
Alternative execution environment: GitHub Actions / Replit / Pyto / NONE
Fallback validation path verified: YES / NO
```

Règles :

- ne pas attendre la fin du Build pour découvrir qu’une validation obligatoire est structurellement impossible ;
- si la capacité locale manque mais qu’un environnement alternatif fiable existe, router la validation vers cet environnement et qualifier l’incident `S3` ou `ACCEPTED_LIMITATION` selon le contexte ;
- si aucun environnement alternatif ne peut produire une preuve obligatoire, traiter le blocage au minimum comme `S2` ;
- une capture d’écran ne doit jamais être annoncée comme prévue si aucun navigateur ou renderer n’est disponible ;
- une tentative d’installation peut être faite une fois lorsque raisonnable ; un blocage structurel répété (par exemple domaine interdit) doit ensuite être traité comme limitation connue plutôt que retenté en boucle.

## 12. Sécurité et confidentialité

Le Ledger est dans un dépôt GitHub public. Il est interdit d’y enregistrer :

- secrets, tokens, cookies ou credentials ;
- données personnelles ;
- contenu utilisateur sensible ;
- prompts privés complets ;
- logs bruts contenant des données non expurgées ;
- chemins ou identifiants temporaires dont la publication serait sensible.

Conserver uniquement le minimum factuel nécessaire à l’apprentissage du système.

## 13. Données nécessaires aux futures vues

Chaque occurrence doit être suffisamment structurée pour calculer sans IA :

- nombre d’incidents uniques et d’occurrences ;
- ouverts/mitigés/résolus/limitations acceptées ;
- S1/S2/S3/S4 ;
- répartition par type, projet, outil et étape ;
- première et dernière occurrence ;
- récurrence ;
- niveau de couverture ProjectOS ;
- candidats à une évolution de ProjectOS.

Le widget, la vue Replit et l’outil d’analyse futurs doivent consommer ce même modèle ; ils ne créent pas une seconde source de vérité.

## 14. Revue d’apprentissage

Une analyse d’incidents peut être lancée à la demande et devrait être envisagée lorsqu’au moins un de ces seuils est atteint :

- nouvel incident S1 ;
- au moins 3 occurrences S2 d’une même signature ;
- au moins 5 occurrences d’une même signature sur 30 jours ;
- au moins 10 nouvelles occurrences depuis la dernière revue ;
- demande explicite de Damien.

La revue doit distinguer :

- limitation externe acceptée ;
- amélioration de routage/preflight ;
- correction de standard ProjectOS ;
- modification de CI/outillage ;
- aucune action nécessaire.

Aucune modification automatique de ProjectOS n’est déclenchée par les statistiques seules. Toute évolution reste analysée puis versionnée par branche et Pull Request.

## 15. Règle permanente

**Un incident utile est un fait structuré avec cause, impact, gravité et récurrence ; ProjectOS apprend des causes racines et des tendances, pas du nombre brut de messages d’erreur.**
