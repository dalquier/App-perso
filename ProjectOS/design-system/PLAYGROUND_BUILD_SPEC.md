# ProjectOS — Design System Playground — Build C1

**Statut :** `SPEC READY — IMPLEMENTATION BY CODEX`
**Dépendances :** `DESIGN_DNA.md`, `tokens/design-tokens.json`, `COMPONENT_ARCHITECTURE.md`

## 1. Objectif

Construire un Playground Storybook autonome permettant de visualiser, comparer et valider sur iPhone les fondations et composants du Design System ProjectOS avant toute bibliothèque de code partagée.

Le Playground est un outil de validation et de documentation. Il ne devient pas une seconde source de vérité : les décisions canoniques restent sous `ProjectOS/design-system/`.

## 2. Périmètre C1

Créer une application autonome sous :

`apps/design-system/`

Le lot C1 contient uniquement :

1. Foundations ;
2. Button ;
3. Icon Button ;
4. Card ;
5. List Row ;
6. Input / Text Area ;
7. Chip / Badge.

Navigation, modales, feedback avancé et composants métier restent hors C1.

## 3. Stack

- React ;
- TypeScript ;
- Vite ;
- Storybook avec framework `@storybook/react-vite` ;
- addon officiel `@storybook/addon-a11y` ;
- Vitest + Testing Library pour les comportements déterministes nécessaires ;
- npm.

Aligner autant que raisonnable Node/npm/React/Vite/TypeScript sur `apps/developer-os/package.json` afin d'éviter une seconde politique de runtime dans le monorepo.

Utiliser la dernière version stable de Storybook compatible avec la stack au moment du Build et verrouiller les versions réellement installées dans `package-lock.json`.

## 4. Source des tokens

Source canonique :

`ProjectOS/design-system/tokens/design-tokens.json`

Le Playground ne doit pas recopier manuellement ces valeurs dans plusieurs fichiers.

Créer un mécanisme déterministe de génération de variables CSS depuis le JSON canonique, exécuté avant :

- le serveur Storybook ;
- le build statique Storybook ;
- les tests qui dépendent des tokens.

Les sorties générées peuvent vivre sous `apps/design-system/src/generated/` et doivent être clairement identifiées comme dérivées.

## 5. Foundations stories

Présenter au minimum :

- Electric Royal `#2F5BFF` ;
- palette compagne candidate ;
- neutres candidats ;
- couleurs sémantiques ;
- type scale 28 / 18 / 15 / 12 ;
- grille d'espacement base 4 ;
- rayons ;
- ombre subtile ;
- états d'icônes soft / solid ;
- motion tokens.

Chaque valeur candidate doit être visuellement distinguée d'une valeur verrouillée.

## 6. Components C1

### Button

Variants : `primary`, `secondary`, `tertiary`, `destructive`.

Tailles : `compact`, `standard`.

États visibles en stories : default, pressed/focus représentable, disabled, loading.

### Icon Button

Variants : `rest-soft`, `active-solid`, `destructive`.

Inclure un label accessible lorsque l'icône seule serait ambiguë.

### Card

Variants : `standard`, `interactive`, `status`, `highlight`.

Rayon canonique de carte : `10 pt`.

### List Row

Variants : navigation, selection, toggle, value, status.

La ligne complète est interactive lorsqu'une seule action existe.

### Input / Text Area

États : default, focus, filled, disabled, error ; success seulement lorsqu'il apporte une information utile.

Le label reste visible ; le placeholder ne remplace jamais le label.

### Chip / Badge

Variants : neutral, info, success, warning, danger, filter.

Badge = information ; chip = interaction/filtre.

## 7. Règles visuelles

Respecter sans les rouvrir :

- direction `Dynamic Professional / Electric Royal` ;
- densité compacte équilibrée ;
- brand primary `#2F5BFF` ;
- type scale `28 / 18 / 15 / 12` ;
- spacing base `4 pt` ;
- card radius `10 pt` ;
- élévation subtile ;
- icône soft au repos / solid active ;
- gradient limité à un halo discret ;
- animation vivante mais discrète.

Les valeurs encore candidates peuvent être ajustées uniquement si les prototypes démontrent un problème objectif de lisibilité, cohérence, contraste, densité ou accessibilité. Toute modification proposée doit être documentée ; ne pas modifier silencieusement les valeurs verrouillées.

## 8. Light / Dark

C1 doit permettre de visualiser les composants en light et dark mode.

La palette dark reste candidate : elle peut vivre dans le Playground tant qu'elle n'est pas promue dans `tokens/design-tokens.json` après validation.

Le thème ne doit pas dépendre d'une librairie lourde uniquement pour basculer les variables CSS.

## 9. Accessibilité

- addon officiel Storybook a11y activé ;
- contraste contrôlé ;
- focus visible ;
- labels accessibles ;
- sens non porté uniquement par la couleur ;
- cibles tactiles adaptées à l'iPhone malgré une densité visuelle compacte ;
- reduced motion respecté pour les animations éventuelles.

Les résultats automatiques ne remplacent pas la recette manuelle iPhone.

## 10. Storybook UX

Le Playground doit être agréable à consulter sur iPhone :

- arborescence courte ;
- stories nommées clairement ;
- contrôles utiles, sans exposer des knobs décoratifs inutiles ;
- une story `Overview` par composant montrant les variantes principales ;
- stories d'états séparées lorsque nécessaire ;
- documentation concise des règles `Do / Don't`.

## 11. Scripts attendus

Au minimum :

- `npm run storybook` ;
- `npm run build-storybook` ;
- `npm run test` ;
- `npm run typecheck` ;
- `npm run check` regroupant les validations pertinentes.

Le serveur Storybook doit pouvoir écouter sur `0.0.0.0` et recevoir un port explicite pour la future Preview Replit.

## 12. Replit

C1 ne déploie rien et n'utilise pas l'agent IA Replit.

Après publication du Build, Replit Starter sans IA pourra servir uniquement à exécuter Storybook et fournir la Preview iPhone.

Le Build doit donc créer :

`ProjectOS/design-system/REPLIT_RUNTIME_CONTRACT.md`

basé sur le template ProjectOS vivant, avec :

- mode `GITHUB_IMPORTED_RUNTIME` ;
- application path `apps/design-system/` ;
- commande de lancement versionnée ;
- écoute `0.0.0.0` ;
- politique de port explicite ;
- Native Preview attendue ;
- Artifact requis : NO ;
- Workflow manuel requis : NO ;
- aucun service worker/PWA dans C1.

## 13. Déploiement permanent

Hors C1.

Ne pas modifier `.github/workflows/developer-os-pages.yml` dans ce Build.

Une stratégie de publication permanente sera décidée après validation C1, afin de ne pas créer de concurrence avec le site GitHub Pages DeveloperOS existant.

## 14. Tests / preuves attendues

Minimum :

- `npm ci` ;
- génération des tokens ;
- typecheck ;
- tests composants pertinents ;
- `npm run build-storybook` ;
- vérification que le build statique est non vide ;
- contrôle qu'aucun secret, cache, `node_modules`, output Storybook ou handoff temporaire n'est destiné à être fusionné.

La recette visuelle réelle sur iPhone est un gate post-publication et ne doit pas être prétendue par Codex si elle n'a pas été exécutée.

## 15. Hors périmètre

- Figma ;
- Canva ;
- bibliothèque npm partagée ;
- refactor de DeveloperOS ou Équilibre ;
- migration de composants existants ;
- GitHub Pages permanent ;
- PWA/service worker ;
- agent IA Replit ;
- C2 Navigation ;
- C3 Feedback.

## 16. Livraison attendue

Travail substantiel obligatoire via Codex.

Branche logique : `projectos/design-system-playground-c1`.

Base : `projectos/design-system-v0-1` tant que PR #121 n'est pas intégrée.

La Pull Request C1 reste Draft et cible la branche de base Design System tant que #121 est ouverte. Après intégration de #121, la PR C1 devra être retargetée vers `main`, réconciliée et repasser le Freshness/CI Gate avant toute fusion.

Aucune fusion automatique.
