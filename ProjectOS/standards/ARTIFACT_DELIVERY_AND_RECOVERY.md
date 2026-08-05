# ProjectOS — Livraison et récupération des artefacts

## 1. Objet

Ce standard garantit qu’aucune modification produite par ChatGPT, Codex, Replit ou un autre agent ne reste prisonnière d’un environnement temporaire.

La livraison fait partie de la définition de terminé. Des tests réussis et un commit local ne suffisent pas si le résultat ne peut pas être récupéré, vérifié et rattaché à la source de vérité GitHub.

## 2. Principe fondamental

**Aucune modification ne commence tant qu’un canal de livraison réaliste n’a pas été identifié et vérifié.**

Le contrôle porte sur le mécanisme réellement disponible dans l’environnement concerné : publication native, écriture GitHub directe, export de fichier, client Git authentifié ou secours textuel.

## 3. Delivery Preflight obligatoire

Avant la première modification, l’agent consigne au minimum :

```text
DELIVERY PREFLIGHT

Repository:
Source branch or base ref:
Target branch:
Source SHA:

Native GitHub publication available: YES / NO / NOT VERIFIABLE FROM SANDBOX
Direct Git push available: YES / NO
Exportable file location available: YES / NO
Binary-compatible channel required: YES / NO
Fallback available: YES / NO

Selected delivery mode:
Expected external proof:
```

Le précontrôle doit distinguer :

- ce que le terminal peut vérifier ;
- ce que l’interface native peut publier ;
- ce qui devra être confirmé après la tâche ;
- les types de fichiers incompatibles avec le canal choisi.

## 4. Modes de livraison reconnus

### 4.1 `github-direct`

Utiliser lorsque l’agent dispose d’un accès GitHub en écriture vérifié.

Preuve finale obligatoire :

- SHA local ou SHA du commit produit ;
- SHA distant de la branche ;
- correspondance des deux ;
- Pull Request visible lorsqu’elle est requise.

### 4.2 `codex-native`

Utiliser dans Codex Cloud lorsque le dépôt et la branche de base sont explicitement sélectionnés dans l’interface.

L’absence de credentials dans le sandbox n’invalide pas ce mode. La preuve finale est toutefois externe au sandbox : branche et Pull Request visibles dans GitHub après utilisation du mécanisme natif.

Si la publication native échoue, la tâche passe immédiatement au plan de récupération sans reconstruire le travail.

### 4.3 `patch-export`

Utiliser lorsque la publication GitHub n’est pas possible mais qu’un fichier peut être exporté.

Le livrable comprend au minimum :

- un patch Git ;
- une archive ZIP contenant le patch ;
- un manifeste de livraison ;
- les empreintes SHA-256.

Le patch doit être créé dans un emplacement réellement exportable, par exemple `/mnt/data/projectos-delivery/` ou l’équivalent exposé par la plateforme.

### 4.4 `git-binary-capable`

Utiliser lorsqu’un binaire canonique doit être versionné et que le canal natif textuel ne peut pas le publier.

Clients possibles : Working Copy, Replit authentifié ou autre client Git autorisé. Le choix est fait avant la création du binaire.

### 4.5 `base64-recovery`

Dernier recours uniquement lorsque ni publication ni export de fichier ne sont possibles.

Le contenu doit être :

- compressé ;
- encodé en base64 ;
- découpé en parties numérotées ;
- accompagné de la taille, du nombre de parties et des SHA-256 ;
- reconstruit puis vérifié avant utilisation.

Aucune partie ne doit être tronquée, abrégée ou remplacée par des points de suspension.

## 5. Interdiction des faux livrables

Il est interdit :

- d’utiliser `/tmp` comme destination finale ;
- de déclarer un fichier livré parce qu’il existe dans le sandbox ;
- de laisser un champ de lien vide ;
- d’annoncer une publication sans nouveau SHA distant ;
- de confondre commit local, branche distante, Pull Request et fusion ;
- de déclarer la tâche terminée lorsque le seul exemplaire récupérable est dans un environnement éphémère.

Un chemin interne n’est pas un lien de téléchargement. Un lien est valide seulement s’il contient une cible réelle, visible et récupérable par Damien.

## 6. Artefacts de secours obligatoires

Pour tout travail substantiel, produire lorsque le canal le permet :

```text
<project>-<build>-<base-short-sha>-to-<head-short-sha>.patch
<project>-<build>-<base-short-sha>-to-<head-short-sha>.zip
<project>-<build>-<base-short-sha>-to-<head-short-sha>.manifest.md
```

Le manifeste suit `ProjectOS/templates/DELIVERY_MANIFEST.md`.

Ces artefacts ne sont pas nécessairement versionnés dans le dépôt. Ils constituent une capacité de récupération, pas une seconde source de vérité.

## 7. Vérifications minimales

### Publication GitHub

Vérifier :

- branche cible exacte ;
- SHA avant et après ;
- absence de force-push non autorisé ;
- PR créée ou mise à jour ;
- état Draft ou Ready conforme à l’instruction ;
- absence de fusion non demandée.

### Patch exporté

Vérifier :

```bash
wc -l <patch>
sha256sum <patch>
test -s <patch>
```

Puis vérifier que le lien ou fichier est réellement récupérable hors de l’environnement producteur.

### Reconstruction base64

Vérifier après décodage :

- taille attendue ;
- empreinte du fichier compressé ;
- empreinte du fichier original ;
- nombre de lignes ou inventaire du contenu ;
- applicabilité du patch.

## 8. Règles de reprise après échec

En cas d’échec de publication :

1. ne pas recommencer l’implémentation ;
2. préserver le commit et le diff existants ;
3. identifier le mode de livraison ayant échoué ;
4. produire le patch et son manifeste depuis le même état ;
5. vérifier les empreintes ;
6. transférer l’artefact par le premier canal disponible ;
7. appliquer ensuite le patch dans un environnement authentifié ;
8. relancer les validations essentielles ;
9. publier sur la branche et la PR initialement prévues.

## 9. Définition de terminé enrichie

Une modification est terminée seulement lorsque :

- le résultat attendu est vérifié ;
- les tests et le build pertinents sont exécutés ou justifiés ;
- le diff est propre et son canal compatible ;
- le résultat est récupérable hors de l’environnement producteur ;
- la preuve de livraison est contrôlée ;
- les limites et actions restantes sont explicitement distinguées.

Les états doivent être nommés sans ambiguïté :

- `construit` : diff et validations disponibles ;
- `exporté` : artefact sorti du sandbox ;
- `publié` : branche ou PR visible dans GitHub ;
- `livré` : résultat relu et jugé conforme ;
- `intégré` : fusion explicitement réalisée.

## 10. Clause obligatoire des prompts de développement

Tout prompt de développement substantiel doit appliquer la clause suivante, directement ou par héritage de ProjectOS :

```text
Avant toute modification, exécute le Delivery Preflight défini dans
ProjectOS/standards/ARTIFACT_DELIVERY_AND_RECOVERY.md.

Choisis et annonce un mode de livraison réaliste.
N’utilise jamais /tmp comme destination finale d’un livrable.
Ne déclare jamais une publication sans SHA distant vérifié.
Ne déclare jamais un fichier livré sans cible réellement récupérable.
En cas d’échec de publication, préserve le travail et bascule vers le plan de récupération sans reconstruire l’implémentation.
```

## 11. Règle ProjectOS

**La capacité de livraison est vérifiée avant la première modification, puis la récupération effective est prouvée avant de déclarer la tâche terminée.**
