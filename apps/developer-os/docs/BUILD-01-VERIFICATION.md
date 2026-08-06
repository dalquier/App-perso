# BUILD-01 — Vérification finale

Date de clôture : 2026-08-06.

Périmètre : DeveloperOS — BUILD-01 — Project Core, sous `apps/developer-os/`, Pull Request #28.

## Référence fonctionnelle revue

Le SHA fonctionnel `410142293b8cb6632703be77652ac58cf2d44b55` contient les corrections REVIEW-01 et le parcours complet d'archivage/restauration. La finalisation documentaire ultérieure ne modifie pas le comportement applicatif.

## Contrôles automatisés GitHub

Les workflows déclenchés sur le SHA fonctionnel ont terminé avec succès :

- `ProjectOS Quality` ;
- `DeveloperOS CI` sur le push de la branche ;
- `DeveloperOS CI` sur la Pull Request.

Le job `DeveloperOS app checks` a validé sans `continue-on-error` :

- installation verrouillée avec `npm ci` ;
- installation Chromium et dépendances Linux Playwright ;
- lint ESLint ;
- vérification TypeScript ;
- tests unitaires du domaine et de l'import/export ;
- tests composants React ;
- tests repository IndexedDB ;
- tests PWA ;
- build de production Vite/Workbox ;
- scénarios E2E mobiles sur les profils iPhone SE et iPhone 13, incluant fonctionnement hors connexion, navigation, persistance, import invalide, archivage et restauration.

Les audits npm exécutés pendant les corrections ont indiqué `0 vulnerability` pour le graphe complet et pour le graphe runtime.

## Recette réelle Replit et iPhone

La branche GitHub canonique a été reconstruite dans l'environnement Replit **DeveloperOS Validation**, sans modification durable locale du code.

La recette réelle sur iPhone a confirmé :

- ouverture de la preview HTTPS puis installation depuis Safari sur l'écran d'accueil ;
- affichage autonome avec safe areas fonctionnelles ;
- démarrage en mode avion après premier chargement ;
- conservation et modification d'un projet hors connexion ;
- persistance IndexedDB après fermeture complète et relance ;
- archivage d'un projet actif après confirmation ;
- absence de sélection automatique d'un autre projet actif ;
- accès via **Réglages → Projets archivés** ;
- restauration avec état `paused` et `isActive = false` ;
- export JSON ;
- import avec proposition de sauvegarde préalable ;
- annulation sans mutation puis remplacement confirmé et fidèle.

## Vérification des modifications intervenues avant fusion

Avant la fusion finale, `main` avait reçu trois commits supplémentaires concernant Équilibre, ProjectOSBackup et le registre ProjectOS. Aucun de ces changements ne touchait `apps/developer-os/` ni `.github/workflows/developer-os.yml`. La PR #28 restait fusionnable sans conflit et son périmètre demeurait limité à la CI DeveloperOS et à `apps/developer-os/`.

## Limites non bloquantes

- audit approfondi VoiceOver et texte agrandi à 200 % non documenté comme exécuté ;
- paysage, clavier physique iOS et matrice multi-appareils non exhaustifs ;
- scénarios Safari IndexedDB multi-onglets, quota et pression de stockage à approfondir ;
- avertissement de dépréciation future du runtime Node utilisé par certaines actions GitHub, sans échec de job ;
- IndexedDB peut être purgé par iOS, d'où la recommandation d'exports réguliers.

## Verdict

**PR PRÊTE POUR FUSION** : aucun bloquant fonctionnel, sécurité, données, CI, PWA, hors connexion, archivage/restauration ou import/export n'est resté ouvert à l'issue de la recette finale.
