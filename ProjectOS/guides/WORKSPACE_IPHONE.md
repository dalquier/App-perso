# ProjectOS Workspace — installation iPhone et Raccourcis

## 1. Objectif

Installer sur iPhone un espace unique pour les téléchargements, fichiers de travail, échanges entre outils et livrables locaux, conformément à `ProjectOS/standards/WORKSPACE_AND_FILE_LIFECYCLE.md`.

Emplacement cible :

`iCloud Drive/ProjectOS Workspace`

## 2. Arborescence à créer

```text
ProjectOS Workspace/
├── 00_INBOX/
├── 10_WORK/
│   ├── ProjectOS/
│   ├── DeveloperOS/
│   ├── Equilibre/
│   ├── ProjectOSBackup/
│   └── Autres/
├── 20_EXCHANGE/
├── 30_OUTPUT/
│   ├── ProjectOS/
│   ├── DeveloperOS/
│   ├── Equilibre/
│   ├── ProjectOSBackup/
│   └── Autres/
├── 80_TO_ARCHIVE/
└── 90_TRASH_7D/
```

L’arborescence peut être créée manuellement dans Fichiers ou extraite depuis un ZIP de structure fourni séparément.

## 3. Safari — faire de `00_INBOX` le dossier de téléchargement

Sur iOS 26 :

1. ouvrir **Réglages** ;
2. ouvrir **Apps** ;
3. ouvrir **Safari** ;
4. ouvrir **Téléchargements** ;
5. choisir **Autre** ;
6. sélectionner `iCloud Drive/ProjectOS Workspace/00_INBOX`.

Résultat attendu : un téléchargement Safari ordinaire arrive directement dans `00_INBOX`.

Ne choisir ni Working Copy ni un dossier du dépôt Git comme destination Safari.

## 4. Raccourci 1 — `Ranger dans ProjectOS`

### But

Recevoir un ou plusieurs fichiers depuis la feuille de partage ou les sélectionner manuellement, puis les déplacer sans avoir à parcourir l’arborescence.

### Réglages du raccourci

- Nom : `Ranger dans ProjectOS`
- Afficher dans la feuille de partage : OUI
- Types d’entrée : fichiers, documents, PDF, images, archives et texte transformable en fichier lorsque pertinent.

### Logique

1. Lire l’entrée du raccourci.
2. Si aucune entrée n’est fournie, utiliser l’action de sélection de fichiers et autoriser plusieurs éléments.
3. Afficher un menu `Destination` :
   - `Travail projet`
   - `Échange temporaire`
   - `Sortie / livrable`
   - `À archiver`
   - `Corbeille 7 jours`
4. Si `Travail projet` : afficher un second menu `Projet` :
   - `ProjectOS`
   - `DeveloperOS`
   - `Equilibre`
   - `ProjectOSBackup`
   - `Autres`
   puis utiliser `10_WORK/<Projet>`.
5. Si `Échange temporaire` : utiliser `20_EXCHANGE`.
6. Si `Sortie / livrable` : afficher le menu Projet puis utiliser `30_OUTPUT/<Projet>`.
7. Si `À archiver` : utiliser `80_TO_ARCHIVE`.
8. Si `Corbeille 7 jours` : utiliser `90_TRASH_7D`.
9. Déplacer les fichiers vers la destination choisie en conservant leur nom lorsque possible.
10. En cas de collision de nom, conserver les deux fichiers ou ajouter un suffixe ; ne jamais écraser silencieusement un fichier existant.
11. Afficher une notification finale : `Rangé dans <destination>`.

### Variante recommandée pour `Autres`

Au lieu de multiplier les projets dans le raccourci, `Autres` peut rester un dossier générique. Lorsqu’un nouveau projet devient durable, créer son sous-dossier dans `10_WORK` et `30_OUTPUT`, puis ajouter une entrée au menu du raccourci.

### Test d’acceptation

1. télécharger un petit PDF dans Safari ;
2. vérifier sa présence dans `00_INBOX` ;
3. partager ce PDF vers `Ranger dans ProjectOS` ;
4. choisir `Sortie / livrable` puis `ProjectOS` ;
5. vérifier que le fichier se trouve dans `30_OUTPUT/ProjectOS` et n’est plus dans `00_INBOX`.

## 5. Raccourci 2 — `Nettoyer Workspace`

### But

Faire un nettoyage conservateur : signaler ce qui mérite un tri, déplacer les anciens échanges vers la quarantaine après confirmation et supprimer uniquement les éléments assez anciens de `90_TRASH_7D` après confirmation.

### Logique

#### A. Purge de `90_TRASH_7D`

1. obtenir la date actuelle ;
2. calculer `date actuelle - 7 jours` ;
3. lire les fichiers de `90_TRASH_7D` ;
4. filtrer les fichiers dont la date de modification est antérieure au seuil ;
5. compter les résultats ;
6. si le compteur est supérieur à zéro, demander : `Supprimer définitivement <N> élément(s) de la corbeille ProjectOS ?` ;
7. uniquement si la réponse est positive, supprimer ces éléments ;
8. sinon ne rien supprimer.

#### B. Échanges anciens

1. calculer `date actuelle - 14 jours` ;
2. lire `20_EXCHANGE` ;
3. filtrer les éléments plus anciens ;
4. si la liste n’est pas vide, demander : `Déplacer <N> ancien(s) échange(s) vers 90_TRASH_7D ?` ;
5. uniquement après confirmation, les déplacer vers `90_TRASH_7D`.

#### C. Inbox à trier

1. calculer `date actuelle - 7 jours` ;
2. compter les éléments de `00_INBOX` plus anciens ;
3. ne rien supprimer ;
4. inclure le nombre dans le bilan final.

#### D. Sorties à classer

1. calculer `date actuelle - 30 jours` ;
2. compter les éléments anciens de `30_OUTPUT` ;
3. ne rien supprimer ;
4. inclure le nombre dans le bilan final.

#### E. Archives en attente

1. compter les éléments présents dans `80_TO_ARCHIVE` ;
2. ne rien déplacer automatiquement ;
3. inclure le nombre dans le bilan final afin de rappeler qu’une archive reste à vérifier.

### Bilan final

Afficher un texte de ce type :

```text
Workspace ProjectOS
Corbeille supprimée : 3
Échanges mis en corbeille : 2
Inbox à trier : 4
Sorties à classer : 1
À archiver : 2
```

### Sécurité

Le raccourci ne supprime jamais automatiquement des éléments de :

- `00_INBOX` ;
- `10_WORK` ;
- `20_EXCHANGE` sans passage préalable en `90_TRASH_7D` ;
- `30_OUTPUT` ;
- `80_TO_ARCHIVE`.

## 6. Automatisation personnelle facultative

Après plusieurs exécutions manuelles satisfaisantes, `Nettoyer Workspace` peut être lancé automatiquement une fois par semaine via une automatisation personnelle Raccourcis.

Conserver néanmoins les demandes de confirmation pour les suppressions définitives au début. Ne rendre une suppression silencieuse que si son comportement a été éprouvé et que le périmètre reste strictement limité à `90_TRASH_7D`.

## 7. ProjectOS Backup

Dans ProjectOS Backup, ajouter comme sources séparées uniquement si nécessaire :

- `iCloud Drive/ProjectOS Workspace/10_WORK`
- `iCloud Drive/ProjectOS Workspace/30_OUTPUT`

Ne pas sélectionner le dossier `ProjectOS Workspace` entier.

Ne pas sélectionner par défaut :

- `00_INBOX`
- `20_EXCHANGE`
- `80_TO_ARCHIVE`
- `90_TRASH_7D`

Après ajout, exécuter une sauvegarde et vérifier dans le bilan que les deux sources apparaissent avec le bon libellé avant de considérer l’intégration comme validée.

## 8. Usage quotidien minimal

Le fonctionnement attendu tient en trois gestes :

1. télécharger → le fichier arrive dans `00_INBOX` ;
2. partager → `Ranger dans ProjectOS` → choisir sa destination ;
3. une fois par semaine → lancer `Nettoyer Workspace`.

Un fichier durable quitte ensuite le Workspace vers GitHub ou Drive ; le Workspace ne devient jamais son emplacement final canonique.
