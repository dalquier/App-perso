# DeveloperOS — BUILD-01 Project Core

PWA mobile-first et local-first pour piloter des projets personnels sur iPhone. La version `0.1.0` fonctionne sans backend, compte, secret, API ou synchronisation distante.

## Installation et développement

Depuis la racine du monorepo :

```bash
npm --prefix apps/developer-os ci
npm --prefix apps/developer-os run dev
```

Ouvrir l’URL Vite indiquée. Commandes disponibles :

```bash
npm --prefix apps/developer-os run lint
npm --prefix apps/developer-os run typecheck
npm --prefix apps/developer-os run test:unit
npm --prefix apps/developer-os run test:components
npm --prefix apps/developer-os run test:repository
npm --prefix apps/developer-os run test:pwa
npm --prefix apps/developer-os run test:e2e
npm --prefix apps/developer-os run build
npm --prefix apps/developer-os run preview
```

Les E2E requièrent Chromium (`npx --prefix apps/developer-os playwright install chromium`).

## Stockage, import et export

Les projets restent dans IndexedDB, derrière `ProjectRepository`. Aucune donnée ne quitte le navigateur. **Exporter** télécharge un JSON UTF-8 versionné avec projets courants, archives et identifiant actif. **Importer** accepte au maximum 2 Mo, parse puis valide intégralement format, schéma, types, enums, UUID logiques, doublons, archives et unicité active. Après confirmation, une transaction IndexedDB unique remplace les données ; une validation échouée ne touche pas au stockage. Le contenu est rendu par React comme texte, jamais interprété comme HTML.

## PWA, installation et hors connexion

Servir le build en HTTPS. Dans Safari iOS : **Partager → Sur l’écran d’accueil → Ajouter**. Le service worker n’intercepte que son scope, met en cache le shell après le premier chargement, utilise le réseau puis le cache, et supprime ses anciens caches à l’activation. Une mise à jour s’applique au lancement suivant sans boucle de rechargement.

## Replit (sous-dossier explicite)

```bash
npm --prefix apps/developer-os ci
npm --prefix apps/developer-os run build
npm --prefix apps/developer-os run preview -- --host 0.0.0.0 --port 3000
```

Le dépôt entier reste la source de vérité ; aucun changement durable ne doit rester uniquement dans Replit.

## Recette iPhone obligatoire avant fusion

1. Déployer une preview HTTPS du build et l’ouvrir sur un iPhone étroit puis standard, en portrait.
2. Installer sur l’écran d’accueil ; vérifier icône, lancement standalone et safe areas/Dynamic Island.
3. Créer, consulter et modifier un projet avec le clavier ouvert ; atteindre tous les champs et actions en défilant.
4. Tester retour navigateur/geste iOS et confirmation d’abandon.
5. Activer successivement deux projets, archiver l’actif, restaurer l’archive puis relancer l’app.
6. Exporter, conserver le fichier, importer après confirmation et vérifier la fidélité.
7. Activer le mode avion après un premier chargement et relancer l’app.
8. Vérifier modes clair/sombre, texte agrandi, VoiceOver, focus et zones tactiles.

## Limites connues

- IndexedDB reste lié au navigateur et peut être purgé par iOS : exporter régulièrement.
- Aucune synchronisation distante, authentification, collaboration ou suppression définitive.
- Les icônes sont SVG ; une validation d’installation iOS réelle doit confirmer leur rendu selon la version Safari ciblée.
- Les tests automatisent deux viewports mais ne remplacent pas clavier, gestes, VoiceOver et installation sur appareil réel.

## Retour arrière

Avant tout changement de version, exporter le JSON. Pour revenir en production, redéployer le dernier commit/tag stable. Le cache versionné précédent est supprimé uniquement lors de l’activation du nouveau service worker ; restaurer ensuite l’export si nécessaire. Ne jamais compter sur Replit comme sauvegarde.
