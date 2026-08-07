# ADR-002 — Héberger DeveloperOS dans le monorepo App-perso

- Statut : accepté
- Date : 2026-08-04
- Mise à jour de gouvernance : 2026-08-07

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
Acceptée : une source de vérité, séparation claire, branches et PR atomiques, accès Working Copy simplifié et chaîne GitHub Actions/GitHub Pages directement liée au dépôt canonique.

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
│           ├── roadmap.md
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

## Exécution et déploiement

Le monorepo permet l’exécution locale ou dans tout environnement compatible Node en ciblant le sous-dossier :

```bash
cd apps/developer-os
npm ci
npm run build
```

La cible canonique de déploiement du client est définie par `ADR-004-GITHUB-PAGES-DEPLOYMENT.md` : GitHub Pages sous `https://dalquier.github.io/App-perso/developer-os/`.

Replit peut importer le monorepo pour une reproduction ou un diagnostic ponctuel, mais n’est plus une étape obligatoire de build, de test, d’hébergement ou de déploiement DeveloperOS.

## Sécurité du dépôt public
Aucun secret, `.env`, donnée personnelle, export IndexedDB réel, conversation, journal utilisateur, profil privé ou capture sensible ne doit être versionné. Les données locales du navigateur ne sont pas stockées dans GitHub.

## Réexamen
Réexaminer un dépôt séparé uniquement si DeveloperOS nécessite des droits distincts, un backend privé dont le cycle de code doit être isolé, des données sensibles versionnées, un cycle de publication indépendant ou si le monorepo devient objectivement difficile à maintenir.
