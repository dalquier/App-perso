# Équilibre — PWA locale

PWA locale d'auto-accompagnement inspirée des TCC. Elle ne diagnostique pas, ne remplace pas un professionnel et reste utilisable sans fournisseur d'IA distant.

## Lancer localement

Prérequis : Node.js 20.19+ ou 22.12+, npm 10+ et un navigateur moderne. HTTPS est nécessaire pour installer la PWA hors `localhost`.

```bash
cd apps/equilibre
npm ci
npm run dev
```

Vérification de production : `npm test` puis `npm run build`.

## Replit — lancement direct

Importer `dalquier/App-perso`, puis utiliser directement le bouton **Run**. Aucun Workflow manuel et aucun Artifact ne sont requis.

La configuration versionnée `.replit` contient uniquement :

```bash
./start-equilibre.sh
```

Ce script exécute un `npm ci` déterministe, construit la PWA avec Vite, puis sert `dist/` avec le serveur statique Node dédié `scripts/replit-server.mjs`. Le serveur écoute sur `0.0.0.0:${PORT:-5000}` ; Replit peut donc détecter automatiquement le premier port HTTP ouvert et l'exposer dans Preview. Le même chemin est exécuté par GitHub Actions dans le smoke `Replit direct-run smoke`.

Aucun ancien workspace, Workflow, Artifact, Secret Replit, `.env` ou Agent IA Replit n'est requis pour lancer Équilibre.

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

BUILD-04 introduit exactement deux protocoles publics actifs :

- `equilibre.protocol.clarify-situation@1.0.0` — Clarifier une situation ;
- `equilibre.protocol.take-small-step@1.0.0` — Faire un petit pas.

Le stockage passe en version 4 avec `protocolRuns`, sauvegarde brute v3, rollback et protections anti-résurrection. Le résultat des protocoles est déterministe et aucune mémoire n'est créée automatiquement. Le service worker utilise le cache `equilibre-shell-v6`, purge les anciens caches Équilibre et force une navigation réseau sans cache HTTP avant fallback offline.

Voir `docs/BUILD_04_ARCHITECTURE.md` pour l'architecture, la migration, le rollback et les recettes Replit/iPhone.
