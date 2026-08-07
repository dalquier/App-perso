# Équilibre — PWA locale

PWA locale d'auto-accompagnement inspirée des TCC. Elle ne diagnostique pas, ne remplace pas un professionnel et reste utilisable sans fournisseur d'IA distant.

## Lancer localement

Prérequis : Node.js 20.19+ ou 22.12+, npm 10+ et un navigateur moderne. HTTPS est nécessaire pour installer la PWA hors `localhost`.

```bash
cd apps/equilibre
npm ci
npm run dev
```

Vérification de production : `npm test`, `npm run build`, puis `npm run preview`.

## Replit Starter

Importer `dalquier/App-perso`, sélectionner le SHA ou la branche candidate exacte, puis exécuter depuis `apps/equilibre/` :

```bash
npm ci
npm test
npm run build
npm run dev -- --host 0.0.0.0
```

Aucun Secret Replit, `.env` ou agent IA Replit n'est requis pour BUILD-04.

## Données et confidentialité

Les données restent dans `localStorage`, sous la clé versionnée `equilibre.local.v1`. La persistance est désactivable et l'effacement complet supprime la clé principale et les sauvegardes applicatives. Safari et une PWA installée peuvent disposer de contextes de stockage distincts : chacun doit être vérifié et effacé séparément.

Le filtre sensible est déterministe et volontairement limité ; il n'est ni exhaustif ni médical. Il oriente vers une aide humaine adaptée et ne remplace aucune évaluation professionnelle.

## Génération reproductible des icônes

L'icône source versionnée est `public/icons/icon.svg`. Les scripts `predev` et `prebuild` exécutent automatiquement `npm run generate:icons` afin de créer localement les PNG 180, 192 et 512 pixels attendus par iOS et le manifeste. Ces PNG sont des artefacts générés ignorés par Git.

## BUILD-01 — Socle PWA

BUILD-01 a introduit le shell PWA, la persistance locale, la séance historique, les réglages et le garde-fou sensible. Cette séance reste conservée comme compatibilité legacy et n'est pas un troisième protocole BUILD-04.

## BUILD-02 — Conversations persistantes

BUILD-02 ajoute l'historique local multi-conversations, les modes conversationnels, une réponse progressive simulée, l'interruption de génération, les erreurs fournisseur récupérables et une migration depuis le schéma BUILD-01. Voir `docs/BUILD_02_ARCHITECTURE.md`.

## BUILD-03 — Séances et mémoire contrôlée

BUILD-03 enregistre localement les séances terminées sous forme structurée, avec résumé déterministe et plan d'action. La mémoire n'est jamais alimentée automatiquement : l'utilisateur crée une proposition, puis peut la confirmer, la corriger ou la supprimer. Voir `docs/BUILD_03_ARCHITECTURE.md`.

## BUILD-04 — Protocoles versionnés et sécurité transversale

BUILD-04 est actuellement en validation avant intégration finale. Il introduit exactement deux protocoles publics actifs :

- `equilibre.protocol.clarify-situation@1.0.0` — Clarifier une situation ;
- `equilibre.protocol.take-small-step@1.0.0` — Faire un petit pas.

Le stockage passe en version 4 avec `protocolRuns`, sauvegarde brute v3, rollback et protections anti-résurrection. Le résultat des protocoles est déterministe et aucune mémoire n'est créée automatiquement. Le service worker utilise le cache `equilibre-shell-v5` et réserve le fallback HTML aux navigations.

Voir `docs/BUILD_04_ARCHITECTURE.md` pour l'architecture, la migration, le rollback et les recettes Replit/iPhone.
