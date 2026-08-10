# ProjectOS — Design DNA v0.1

**Statut :** `FOUNDATIONS LOCKED`  
**Direction :** `Dynamic Professional / Electric Royal`

## Promesse de design

Les applications ProjectOS doivent paraître professionnelles, modernes et premium, compactes sans être tassées, expressives sans devenir décoratives, immédiatement compréhensibles et suffisamment intemporelles pour ne pas dépendre d’une tendance visuelle courte.

Principe principal : **UX d’abord — chaque écran doit être beau, mais évident.**  
Principe secondaire : **forte densité d’information, faible friction d’interaction.**

## Fondations verrouillées

- direction : `Dynamic Professional` ;
- palette primaire : `Electric Royal` ;
- couleur de marque : `#2F5BFF` ;
- densité : compacte équilibrée ;
- typographie : system-first ;
- échelle typographique : `28 / 18 / 15 / 12` ;
- unité d’espacement : `4 pt` ;
- rayon de carte : `10 pt` ;
- élévation par défaut : subtile ;
- icône au repos : cercle à fond coloré doux ;
- icône active/prioritaire : cercle plein coloré ;
- navigation : tabs persistants lorsque pertinents + actions contextuelles ;
- gradients : halo discret de header ou zone hero à forte valeur ;
- emoji + illustration : usage contextuel.

## Couleurs

### Verrouillé

- `brand.primary` : `#2F5BFF`

### Palette compagne candidate

Ces valeurs restent candidates jusqu’à validation dans de vrais composants :

- `brand.cyan` : `#00B8D9` ;
- `brand.violet` : `#7357FF` ;
- `semantic.success` : `#0F9F6E` ;
- `semantic.warning` : `#F59E0B` ;
- `semantic.danger` : `#E5484D` ;
- `surface.canvas` : `#F6F8FA` ;
- `surface.primary` : `#FFFFFF` ;
- `surface.secondary` : `#F1F4F8` ;
- `border.subtle` : `#DCE1E8` ;
- `text.primary` : `#171A21` ;
- `text.secondary` : `#68707D` ;
- `text.muted` : `#8B93A1`.

Règles : le bleu de marque porte l’identité et l’action principale ; cyan et violet servent d’accents ; les couleurs sémantiques communiquent un état et non une décoration ; les gradients restent ponctuels.

## Typographie

Pile system-first :

`-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif`

Échelle verrouillée :

- display : `28 pt` ;
- section : `18 pt` ;
- body : `15 pt` ;
- caption : `12 pt`.

Valeurs candidates de support :

- label : `13 pt` ;
- micro : `11 pt`.

Les titres restent compacts ; la hiérarchie est forte ; le corps de texte doit rester lisible à forte densité.

## Espacement

Base verrouillée : `4 pt`.

Échelle canonique candidate : `4, 8, 12, 16, 20, 24, 32, 40, 48`.

Règles :

- `8–12 pt` pour les écarts internes compacts ;
- `16 pt` comme padding courant de carte/section ;
- `20–24 pt` entre groupes forts ;
- l’espace blanc est fonctionnel, jamais décoratif.

## Géométrie

Rayon de carte verrouillé : `10 pt`.

Échelle dérivée candidate :

- xs : `4` ;
- sm : `6` ;
- control : `8` ;
- card : `10` ;
- panel : `12` ;
- pill : `999`.

Les pills sont réservées aux chips, tags, filtres et statuts. L’interface doit rester précise, pas molle ni « tout en pilules ».

## Élévation

Élévation par défaut verrouillée : **subtile**.

Implémentation CSS candidate :

`0 1px 3px rgba(20,28,45,0.08), 0 1px 2px rgba(20,28,45,0.04)`

Les cartes ne doivent pas flotter excessivement. Les niveaux d’élévation plus forts sont réservés aux sheets, popovers et modales.

## Iconographie

Comportement verrouillé :

- repos : cercle à fond coloré doux ;
- actif/prioritaire : cercle plein coloré.

Tailles candidates : glyph `20 pt`, compact `28 pt`, standard `32 pt`, prominent `40 pt`.

Règle : **icône = action/fonction ; emoji = expression/catégorie/émotion.** Une action critique ne dépend jamais uniquement d’un emoji.

## Cartes et surfaces

Modèle privilégié :

1. canvas ;
2. carte/surface primaire ;
3. sheet/modale/overlay.

Carte par défaut : blanche, ombre subtile, rayon `10 pt`, padding compact équilibré.

## Navigation et actions

- tabs bas lorsque plusieurs destinations de premier niveau sont persistantes ;
- action contextuelle possible en complément ;
- l’action principale doit vivre au plus près du contexte utilisateur ;
- ne pas cacher les fonctions principales derrière des menus inutiles ;
- retour, fermeture, annulation et enregistrement doivent rester prévisibles.

## Mouvement

Direction : vivante mais discrète.

Durées candidates :

- fast : `120 ms` ;
- standard : `180 ms` ;
- emphasis : `240 ms`.

Aucune animation ne doit retarder l’action suivante ; les préférences de réduction des animations doivent être respectées.

## Emoji, illustrations et visuels génératifs

Emoji et illustration sont autorisés selon le contexte.

Direction privilégiée : abstraite/générative, géométrique, gradients contrôlés, variations propres au produit.

Le gradient standard est un halo discret dans un header ou une zone hero à forte valeur. Pas de fond arc-en-ciel continu sous du contenu dense.

## Accessibilité et iPhone

Obligatoire :

- safe areas respectées ;
- clavier ne masquant aucun champ actif ;
- cibles tactiles confortables même si le composant visible est compact ;
- états ne reposant jamais uniquement sur la couleur ;
- états chargement, vide, succès et erreur conçus explicitement ;
- comportement compatible avec réduction des animations ;
- lisibilité prioritaire.

## Anti-patterns

Éviter :

- titres énormes consommant le viewport ;
- vide excessif ;
- actions principales cachées ;
- menus hamburger servant de fourre-tout ;
- gradients incontrôlés ;
- trop de couleurs concurrentes ;
- blur/glass omniprésents ;
- animations théâtrales ;
- contrôles icon-only ambigus ;
- comportements Annuler/Enregistrer/Fermer incohérents.

## Liberté par application

Chaque application peut faire varier : couleur secondaire, illustration, chaleur émotionnelle, motif/halo, iconographie métier et visuels propres au domaine. Ces variations ne doivent pas casser la typographie, la géométrie, les espacements, les comportements et les patterns communs.

## Encore à valider par composants

- hex exacts de la palette compagne ;
- palette neutre finale ;
- opacité exacte des ombres ;
- hauteurs de contrôles ;
- tailles d’icônes par composant ;
- rayon sheet/modale ;
- palette dark mode ;
- courbes de motion par composant.

Ces décisions seront prises à partir de prototypes de composants, pas d’un nouveau questionnaire général.