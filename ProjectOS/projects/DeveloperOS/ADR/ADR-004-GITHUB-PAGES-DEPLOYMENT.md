# ADR-004 — GitHub Pages comme cible de déploiement DeveloperOS

- Statut : accepté
- Date : 2026-08-07
- Décision constatée depuis l’état intégré de `main`

## Contexte

DeveloperOS est une PWA statique React/Vite dont l’interface principale reste local-first. Les PR DeveloperOS #89 (`PAGES-01`) et #92 (`PAGES-FIX`) ont intégré dans `main` la configuration nécessaire pour publier l’application sous le sous-chemin GitHub Pages :

`https://dalquier.github.io/App-perso/developer-os/`

L’état vivant contient notamment :

- `base: "/App-perso/developer-os/"` dans Vite ;
- un manifeste PWA, un scope et un `start_url` limités à ce sous-chemin ;
- un routage compatible avec un hébergement statique ;
- `.github/workflows/developer-os-pages.yml` pour construire et déployer depuis `main` ;
- un artefact Pages dont `developer-os/` est le sous-dossier publié.

Les documents DeveloperOS antérieurs décrivaient encore Replit Starter comme cible normale de preview, d’hébergement et de déploiement. Cette description ne correspond plus à la cible effectivement intégrée.

## Décision

1. La cible canonique de publication de la PWA DeveloperOS est GitHub Pages à l’URL `https://dalquier.github.io/App-perso/developer-os/`.
2. Le workflow `.github/workflows/developer-os-pages.yml` est la chaîne canonique de build et de déploiement statique depuis `main`.
3. `DeveloperOS CI` dans GitHub Actions reste la preuve automatisée principale pour lint, TypeScript, tests applicatifs, build et E2E couverts par le workflow.
4. Replit n’est plus une dépendance cible de DeveloperOS pour l’hébergement ou le déploiement de la PWA. Il peut rester un environnement optionnel de reproduction ou de diagnostic ponctuel lorsqu’un besoin vérifié le justifie, mais il n’est ni requis pour livrer DeveloperOS, ni source canonique, ni étape obligatoire de recette.
5. Le backend futur de `CO-BUILD-02` ne peut pas être hébergé par GitHub Pages. Son runtime serveur, son stockage privé et sa gestion des secrets constituent un sous-système séparé, à décider et valider dans le périmètre `CO-BUILD-02`. Cette décision ne remet pas en cause GitHub Pages comme hébergement canonique du client PWA.
6. Une recette réelle iPhone ou un smoke test du déploiement reste une preuve distincte de l’existence du workflow. L’intégration du workflow ne doit pas être présentée seule comme preuve de disponibilité fonctionnelle du site.

## Relation avec les décisions antérieures

Cette ADR conserve les décisions structurantes de `ADR-001-TARGET-ARCHITECTURE.md` :

- PWA TypeScript principale ;
- local-first ;
- IndexedDB ;
- service worker ;
- Pyto comme compagnon optionnel.

Elle **remplace uniquement** les clauses d’ADR-001 et des documents antérieurs qui désignaient Replit Starter comme cible d’hébergement ou de déploiement DeveloperOS.

`ADR-002-APP-PERSO-MONOREPO.md` reste valide : le dépôt canonique demeure `dalquier/App-perso`, avec la gouvernance sous `ProjectOS/projects/DeveloperOS/` et le code sous `apps/developer-os/`.

## Conséquences

### Positives

- publication directement depuis la source canonique GitHub ;
- suppression d’une dépendance de déploiement supplémentaire ;
- URL stable sous le dépôt App-perso ;
- chaîne de publication traçable dans GitHub Actions ;
- cohérence avec l’architecture statique actuelle du client.

### Contraintes

- le client doit continuer à fonctionner sous `/App-perso/developer-os/` ;
- toute modification de routage, PWA, assets ou service worker doit préserver ce sous-chemin ;
- les fonctions serveur de `CO-BUILD-02` nécessiteront une cible distincte de GitHub Pages ;
- aucun secret serveur ne peut être ajouté au bundle statique ou au dépôt public.

## Critères de réexamen

Réexaminer cette décision uniquement si :

- GitHub Pages ne permet plus de servir correctement la PWA ;
- un besoin vérifié exige un frontend dynamique incompatible avec l’hébergement statique ;
- la séparation client statique / backend privé devient techniquement non viable ;
- une nouvelle cible apporte un avantage démontré sans réintroduire une dépendance inutile.

## Retour arrière

Le retour arrière consiste à revenir au dernier commit stable de configuration Pages et à choisir explicitement une nouvelle cible dans une ADR. Il ne doit jamais réintroduire implicitement Replit comme cible par défaut sans nouvelle décision documentée.
