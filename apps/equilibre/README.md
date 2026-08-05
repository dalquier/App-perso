# Équilibre — BUILD-01

PWA locale d'auto-accompagnement inspirée des TCC. Elle ne diagnostique pas, ne remplace pas un professionnel et n'utilise aucun service d'IA distant dans BUILD-01.

## Lancer localement

Prérequis : Node.js 20.19+ ou 22.12+, npm 10+ et un navigateur moderne. HTTPS est nécessaire pour installer la PWA hors `localhost`.

```bash
cd apps/equilibre
npm ci
npm run dev
```

Vérification de production : `npm test`, `npm run build`, puis `npm run preview`.

## Importer exactement la branche dans Replit Starter

1. Choisir **Create Repl > Import from GitHub** et coller `https://github.com/dalquier/App-perso`.
2. Dans **Shell**, exécuter exactement :

```bash
git fetch origin
git switch codex/realiser-build-01-pour-pwa-equilibre
cd apps/equilibre
npm ci
npm run build
npm run dev -- --host 0.0.0.0
```

3. Si demandé, régler **Run** sur `cd apps/equilibre && npm run dev -- --host 0.0.0.0`.
4. Ouvrir l'URL HTTPS. Aucun Secret Replit ni `.env` n'est requis.

## Données, limites et retour arrière

Les données restent dans `localStorage`, clé versionnée `equilibre.local.v1`. La persistance est désactivable et l'effacement complet retire la clé après confirmation. Désinstaller l'icône ne garantit pas l'effacement Safari : utiliser le bouton avant désinstallation.

Le filtre sensible est déterministe et volontairement limité ; il n'est ni exhaustif ni médical. Il oriente vers l'urgence, une personne de confiance et le 3114 en France. Le simulateur n'est pas une IA distante.

Pour revenir en arrière, restaurer le commit précédant BUILD-01 ou supprimer `apps/equilibre/`. Il n'existe aucune migration serveur. Effacer les données locales depuis l'app avant le retour arrière.

Voir la [procédure iPhone](docs/IPHONE_TEST.md) et l'[inventaire historique](docs/PROTOTYPE_INVENTORY.md).

## Génération reproductible des icônes

L'icône source versionnée est `public/icons/icon.svg`. Les scripts `predev` et `prebuild` exécutent automatiquement `npm run generate:icons` afin de créer localement les PNG 180, 192 et 512 pixels attendus par iOS et le manifeste. Ces PNG sont des artefacts générés ignorés par Git ; `npm run dev` et `npm run build` fonctionnent donc directement après un import Replit.
