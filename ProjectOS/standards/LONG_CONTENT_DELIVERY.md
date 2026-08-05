# ProjectOS — Livraison des contenus longs

## 1. Objet

Ce standard définit quand un contenu volumineux doit être remis directement dans la conversation, dans un fichier téléchargeable ou dans le dépôt GitHub canonique.

L’objectif est de réduire la friction d’affichage, les risques de troncature, les erreurs de copie et la consommation inutile de contexte, sans masquer les décisions importantes ni dégrader la traçabilité.

## 2. Principe directeur

> Un contenu long destiné à être conservé, transmis, exécuté ou réutilisé est livré dans le support le plus fiable, accompagné d’un résumé autonome dans la conversation.

La création d’un fichier ne garantit pas une génération plus rapide ni une consommation inférieure de tokens ou de crédits. Le gain attendu porte principalement sur :

- la fluidité d’affichage, notamment sur iPhone ;
- la fiabilité de la copie et de la mise en forme ;
- la conservation et la réutilisation ;
- la vérification de complétude ;
- la réduction du volume réinjecté dans les tours suivants.

## 3. Règle de décision

### 3.1 Réponse directe dans la conversation

Utiliser la conversation lorsque le contenu :

- reste court ou moyen ;
- doit être compris immédiatement ;
- ne constitue pas un livrable durable ;
- ne comporte pas de nombreux fichiers ou blocs de code ;
- peut être copié sans risque significatif.

Repère non contraignant : moins d’environ 100 lignes de code ou 150 lignes de texte structuré.

### 3.2 Fichier téléchargeable

Créer un fichier lorsque le contenu :

- dépasse sensiblement les repères précédents ;
- constitue un prompt volumineux, une spécification, un audit, une procédure ou un rapport ;
- doit être transmis à un autre outil ou agent ;
- comporte une mise en forme importante ;
- risque d’être tronqué, altéré ou difficile à copier depuis l’application ;
- doit être sauvegardé, partagé, imprimé ou réimporté.

Formats privilégiés :

- `.md` pour prompts, spécifications, documentation technique et rapports structurés ;
- `.txt` pour texte brut ou compatibilité maximale ;
- `.docx` pour document éditable destiné à la lecture ou au partage ;
- `.pdf` pour document final destiné à être lu ou imprimé ;
- `.json`, `.csv` ou `.xlsx` pour données structurées ;
- `.zip` uniquement pour regrouper plusieurs fichiers, installer ou fournir une récupération de secours.

### 3.3 Code produit par Codex

Pour Codex, un fichier joint ou un long bloc de code dans la conversation ne remplace jamais la livraison canonique.

Le code substantiel doit être :

1. créé ou modifié directement dans le dépôt canonique ;
2. placé sur une branche dédiée ;
3. validé par les tests pertinents ;
4. livré dans une Pull Request vérifiable ;
5. résumé brièvement dans la conversation.

Un fichier téléchargeable, un ZIP ou un patch peut compléter cette livraison pour l’installation, le transfert ou la récupération, mais ne devient pas la source de vérité.

## 4. Livraison à deux niveaux

Lorsqu’un fichier est produit, la réponse visible doit conserver un résumé autonome comprenant au minimum :

- ce qui a été produit ;
- les décisions ou résultats principaux ;
- le format et le nom du fichier ;
- la manière de l’utiliser ;
- les limites, risques ou actions restantes.

Le contenu complet est placé dans le fichier. La conversation ne doit pas recopier intégralement le même contenu, sauf nécessité explicite.

## 5. Seuils et jugement

Les seuils de lignes sont indicatifs. L’agent doit aussi considérer :

- la complexité de la structure ;
- le nombre de blocs de code ;
- la nécessité d’un copier-coller exact ;
- le terminal cible : iPhone, Codex, Pyto, Scriptable, Replit ou autre ;
- la durée de conservation attendue ;
- la capacité réelle de téléchargement ou de publication ;
- le coût de création du format choisi.

Un contenu plus court peut justifier un fichier s’il doit être exécuté ou transmis sans altération. Un contenu long peut rester dans la conversation s’il doit être lu et discuté immédiatement, à condition d’éviter la troncature.

## 6. Optimisation des crédits et du contexte

- Ne pas créer simultanément plusieurs formats identiques sans besoin explicite.
- Préférer `.md` ou `.txt` lorsqu’un format bureautique n’apporte pas de valeur.
- Ne pas générer un PDF et un DOCX par défaut pour le même contenu.
- Ne pas recopier dans la conversation le contenu intégral déjà livré dans un fichier.
- Pour Codex, ne pas demander de réimprimer les fichiers modifiés dans le compte rendu.
- Pour un projet multi-fichiers, préférer GitHub et la Pull Request à un ZIP conversationnel.
- Réserver les ZIP aux exports, installations ou plans de récupération.

## 7. Compatibilité avec la livraison et la récupération

Toute création de fichier applique `ARTIFACT_DELIVERY_AND_RECOVERY.md` avant la première modification.

Un fichier n’est déclaré livré que si :

- sa cible est réellement accessible à Damien ;
- son nom et son format sont explicites ;
- son contenu est complet ;
- le lien ou canal de récupération a été vérifié ;
- les fichiers canoniques restent versionnés dans GitHub lorsque le contenu appartient au projet.

## 8. Formulation opérationnelle

Règle ProjectOS :

> Réponse courte dans la conversation pour comprendre et décider ; fichier téléchargeable pour conserver, transmettre ou exécuter un contenu volumineux ; dépôt GitHub, branche et Pull Request pour tout code substantiel produit par Codex.
