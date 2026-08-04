# ADR-002 — Héberger DeveloperOS dans le monorepo App-perso

- Statut : accepté
- Date : 2026-08-04

## Contexte
La première reprise proposait un dépôt séparé `dalquier/DeveloperOS`. L’analyse de l’arborescence réelle et du mode de travail depuis l’iPhone montre qu’un dépôt supplémentaire augmenterait la dispersion : plusieurs copies Working Copy, recherches GitHub séparées, synchronisation de règles ProjectOS et risques d’oubli entre gouvernance et code.

Le dossier `ProjectOS/projects/DeveloperOS/` a une fonction documentaire : manifeste, ADR, spécifications, audits et script maître. Il ne doit pas accueillir les dépendances, builds et sources de la PWA.

Créer un dossier racine `projects/DeveloperOS/` serait techniquement viable mais trop proche de `ProjectOS/projects/DeveloperOS/`, donc ambigu pour ChatGPT, Codex, Working Copy et les scripts.

## Options

### A. Code dans `ProjectOS/projects/DeveloperOS/app/`
Rejetée : mélange gouvernance ProjectOS et application exécutable.

### B. Code dans `projects/DeveloperOS/`
Rejetée : chemins presque identiques à `ProjectOS/projects/DeveloperOS/`.

### C. Dépôt séparé `dalquier/DeveloperOS`
Reportée : isolation forte mais complexité inutile pour les premiers Builds personnels.

### D. Monorepo `dalquier/App-perso` avec `apps/developer-os/`
Acceptée : une source de vérité, séparation claire, branches et PR atomiques, accès Working Copy simplifié et exécution Replit possible depuis un sous-dossier.

## Décision
- Dépôt canonique unique : `dalquier/App-perso`.
- Gouvernance : `ProjectOS/projects/DeveloperOS/`.
- Code applicatif : `apps/developer-os/`.
- Nom du dossier web en minuscules et kebab-case : `developer-os`.
- Nom du produit affiché : `DeveloperOS`.
- Historique `dalquier/Scriptable` conservé en lecture seule.
- Aucun dépôt séparé `dalquier/DeveloperOS` ne sera créé avant qu’un besoin vérifié d’isolation, de confidentialité ou de cycle de livraison indépendant ne le justifie.

## Arborescence cible

```text
App-perso/
├── ProjectOS/
│   └── projects/
│       └── DeveloperOS/
│           ├── PROJECT_MANIFEST.md
│           ├── MASTER_BUILD_PROMPT.md
│           ├── ADR/
│           └── docs/
└── apps/
    └── developer-os/
        ├── README.md
        ├── package.json
        ├── index.html
        ├── public/
        ├── src/
        ├── tests/
        └── docs/
```

## Replit
Replit importe `dalquier/App-perso` et exécute uniquement le sous-dossier :

```bash
cd apps/developer-os && npm install
cd apps/developer-os && npm run dev
```

Les commandes finales seront celles réellement définies par BUILD-01.

## Sécurité du dépôt public
Aucun secret, `.env`, donnée personnelle, export IndexedDB réel, conversation, journal utilisateur, profil privé ou capture sensible ne doit être versionné. Les données locales du navigateur ne sont pas stockées dans GitHub.

## Réexamen
Réexaminer un dépôt séparé uniquement si DeveloperOS nécessite des droits distincts, un backend privé, des données sensibles versionnées, un cycle de publication indépendant ou si le monorepo devient objectivement difficile à maintenir.
