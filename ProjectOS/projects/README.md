# ProjectOS — Références propres aux projets

Chaque projet enregistré peut disposer d’un dossier :

```text
projects/<Nom>/
├── PROJECT_MANIFEST.md
├── roadmap.md
├── ADR/
└── docs/
```

## Règles

- Ne créer un dossier projet qu’après vérification de son identité et de sa référence canonique.
- Le manifeste est le point d’entrée du projet.
- Les ADR contiennent les décisions durables ou difficiles à inverser.
- `docs/` contient uniquement les références versionnées utiles au pilotage.
- `roadmap.md` décrit les jalons et non une liste exhaustive de tâches.
- Le code applicatif reste dans son dépôt ou dossier canonique ; ce dossier ProjectOS ne doit pas créer une seconde source de vérité.
- Les documents métier spécifiques à Équilibre, TCC Budy, AssistantIA ou tout autre projet ne deviennent pas des standards transverses.

Les projets dont la référence n’est pas encore vérifiée restent déclarés dans `PROJECT_REGISTRY.md` avec le statut `à migrer/compléter`.