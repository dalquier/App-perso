# ProjectOS — Component Architecture v0.1

**Statut :** `DESIGN PHASE`  
**Dépendance :** `DESIGN_DNA.md` + `tokens/design-tokens.json`

## Objectif

Transformer le Design DNA en composants et patterns UX réutilisables par toutes les applications ProjectOS, en privilégiant la cohérence de comportement avant la multiplication des variantes.

Cette phase doit valider les tokens encore candidats à travers de vrais composants. Elle ne rouvre pas les fondations déjà verrouillées.

Le support de validation C1 retenu est un **Playground Storybook autonome** défini dans `PLAYGROUND_BUILD_SPEC.md`. Figma reste optionnel et n’est pas une dépendance de cette phase.

## Principes permanents

1. Un composant existe parce qu’un comportement ou une structure se répète, pas seulement parce qu’un visuel se ressemble.
2. Une variante doit répondre à un usage distinct ; pas de variantes décoratives.
3. Les tailles visuelles peuvent être compactes mais les cibles tactiles restent confortables.
4. Le composant doit gérer ses états `default`, `pressed`, `focus`, `disabled`, `loading`, `error` lorsque pertinents.
5. Le sens d’un état ne dépend jamais uniquement de la couleur.
6. Les actions destructrices sont explicitement identifiables.
7. Le composant doit être compatible light/dark mode avant d’être déclaré stable.
8. Les règles iPhone et safe areas prévalent sur une mise en page théorique.

## Couche 1 — Primitives interactifs

### Button

Variants :
- `primary` — action principale ;
- `secondary` — alternative claire ;
- `tertiary` — action discrète ;
- `destructive` — action à risque.

Tailles candidates : `compact`, `standard`.

États : default, pressed, disabled, loading.

Règles :
- un écran ne doit généralement pas présenter plusieurs boutons `primary` concurrents ;
- préférer une action contextuelle à un CTA plein écran isolé ;
- texte court, explicite, orienté action ;
- spinner/loading ne modifie pas brutalement la largeur du contrôle.

### Icon Button

Variants : `rest-soft`, `active-solid`, `destructive`.

Règles :
- suit le modèle d’icône verrouillé dans le Design DNA ;
- tooltip/label accessible obligatoire si le sens n’est pas universel ;
- ne pas utiliser pour une action critique ambiguë.

### Input / Text Area

États : default, focus, filled, disabled, error, success lorsque utile.

Règles :
- label visible ;
- placeholder = exemple ou aide, jamais substitut au label ;
- erreur au plus près du champ ;
- clavier ne masque pas le champ actif ;
- auto-scroll vers l’erreur si nécessaire.

### Select / Menu

Règles :
- privilégier le contrôle natif ou une sheet claire sur iPhone ;
- afficher la valeur sélectionnée ;
- éviter les menus déroulants web fragiles en plein écran mobile ;
- supporter annulation explicite si la sélection a des conséquences importantes.

## Couche 2 — Conteneurs et contenu

### Card

Variants :
- `standard` — contenu normal ;
- `interactive` — carte tappable ;
- `status` — état ou information de synthèse ;
- `highlight` — information/action importante, usage rare.

Anatomie : optional leading icon/visual, title, optional subtitle, content, optional trailing action/status.

Règles :
- surface primaire blanche/light ;
- rayon verrouillé `10 pt` ;
- ombre subtile ;
- padding compact basé sur la grille 4 pt ;
- une carte interactive complète ne contient pas plusieurs zones de clic contradictoires.

### List Row

Variants : navigation, selection, toggle, value, status.

Règles :
- densité compacte équilibrée ;
- chevron uniquement si une navigation suit réellement ;
- valeur secondaire alignée et lisible ;
- séparateurs discrets ;
- ligne entière tappable lorsqu’elle représente une seule action.

### Chip / Badge

Variants : neutral, info, success, warning, danger, filter.

Règles :
- pill autorisée ;
- texte court ;
- badge = information, chip = interaction/filtre ;
- éviter les séries multicolores sans signification sémantique.

## Couche 3 — Navigation

### Navigation Header

Variants : root, detail, modal.

Règles :
- titre compact ;
- retour/fermeture toujours évident ;
- halo Electric Royal optionnel et discret sur certains écrans racine ;
- ne pas consommer une hauteur excessive pour une fonction purement décorative.

### Bottom Navigation

Usage : 3 à 5 destinations persistantes de premier niveau.

Règles :
- état actif évident ;
- icône active en cercle plein selon le DNA lorsque pertinent ;
- libellé court ;
- aucune action éphémère déguisée en destination persistante.

### Tabs / Segmented Control

Usage : vues sœurs d’un même contexte.

Règles :
- nombre limité ;
- état sélectionné évident ;
- pas de double niveau tabs + segmented sans nécessité réelle.

## Couche 4 — Feedback et états

### Alert / Status

Variants : info, success, warning, danger.

Règles :
- icône + texte + couleur ;
- message principal immédiatement compréhensible ;
- action corrective proposée lorsqu’elle existe.

### Toast

Usage : confirmation brève non bloquante.

Règles :
- jamais pour une erreur critique ou une décision requise ;
- durée courte ;
- pas de file de toasts illisible.

### Progress / Loading

Variants : spinner, determinate progress, skeleton lorsque pertinent.

Règles :
- progression déterminée lorsque le pourcentage est réellement calculable ;
- ne pas afficher un faux pourcentage ;
- phase courante lisible pour les opérations longues ;
- possibilité d’arrêt lorsqu’une tâche longue peut être interrompue sans danger.

### Empty State

Anatomie : visual optionnel, titre, explication courte, action utile.

Règles :
- aucune illustration décorative surdimensionnée ;
- expliquer ce que l’utilisateur peut faire maintenant ;
- emoji ou illustration générative autorisés selon le contexte.

## Couche 5 — Surfaces temporaires

### Sheet / Modal

Règles :
- préférer sheet sur iPhone pour les choix/contextes secondaires ;
- fermeture explicite ;
- préserver le contexte de l’écran parent ;
- actions Annuler/Enregistrer cohérentes ;
- confirmation supplémentaire uniquement pour les actions destructrices ou irréversibles.

### Popover

Usage limité aux contextes où l’ancrage visuel reste utile ; fallback sheet sur petits écrans si nécessaire.

## Patterns UX communs

### Settings Pattern

Structure : sections courtes, rows cohérentes, valeur actuelle visible, navigation secondaire évidente, bouton Terminer/Fermer fiable.

### Add/Edit Pattern

Structure : titre clair, champs avec labels persistants, validation locale, Annuler et Enregistrer cohérents, retour après succès explicite.

### Destructive Action Pattern

Structure : action visuellement distincte, confirmation contextualisée, conséquence décrite, annulation possible avant exécution.

### Long Task Pattern

Structure : phase, progression réelle, statut court, temps restant seulement s’il est estimable, bouton Arrêter si sûr, diagnostic accessible en cas d’erreur.

### Empty/List Pattern

Le même écran passe naturellement de l’état vide à la liste sans changer complètement de langage d’interface.

## Matrice de validation des composants

Chaque composant doit être vérifié sur :

- light mode ;
- dark mode ;
- iPhone étroit ;
- texte agrandi ;
- état disabled ;
- erreur lorsque pertinente ;
- loading lorsque pertinent ;
- VoiceOver/label accessible lorsque pertinent ;
- contraste ;
- cible tactile ;
- cohérence avec `DESIGN_DNA.md`.

## Ordre de prototypage recommandé

### Lot C1 — Core UI

1. Button
2. Icon Button
3. Card
4. List Row
5. Input
6. Chip/Badge

Support de validation : `apps/design-system/` avec Storybook, selon `PLAYGROUND_BUILD_SPEC.md`.

Objectif : valider palette compagne, neutres, ombre, hauteurs, rayons dérivés et tailles d’icônes.

### Lot C2 — Navigation

7. Navigation Header
8. Bottom Navigation
9. Tabs / Segmented Control
10. Sheet / Modal

Objectif : verrouiller les patterns de navigation et les actions contextuelles iPhone.

### Lot C3 — Feedback

11. Alert / Status
12. Toast
13. Progress / Loading
14. Empty State

Objectif : standardiser les états de système et les opérations longues.

## Gate avant bibliothèque de code

La bibliothèque de code partagée ne doit commencer qu’après :

- validation visuelle du Lot C1 dans le Playground Storybook ;
- stabilisation des tokens encore candidats ;
- décision dark mode ;
- définition de la stratégie d’icônes pour Web/PWA et plateformes natives ;
- absence de contradiction avec `QUALITY_UX_SECURITY.md`.

Après ce gate, l’implémentation multi-fichiers d’une bibliothèque partagée devient un Build substantiel et doit être routée vers Codex selon ProjectOS.
