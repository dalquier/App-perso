# ProjectOS — PROJECT MANIFEST — <Projet>

## 1. Identité

- **ProjectOS ID** : `<id-stable>`
- **Nom** : `<nom>`
- **Alias** : `<alias éventuels>`
- **Statut** : `<initialisation / actif / maintenance / archivé>`
- **Responsable** : Damien

## 2. Source canonique

- **Dépôt GitHub** : `<owner/repo>`
- **Branche canonique** : `main`
- **Chemin applicatif** : `<apps/... ou autre>`
- **Dossier ProjectOS** : `ProjectOS/projects/<Projet>/`

GitHub est la source de vérité du code et de la documentation versionnée. Aucun runtime, sauvegarde ou environnement de travail ne devient implicitement canonique.

## 3. Objectif

Décrire en quelques lignes :

- le problème utilisateur ;
- le résultat attendu ;
- le périmètre actuel ;
- les principaux hors-périmètre.

## 4. Architecture et décisions

- ADR applicables : `<liste ou NONE>`
- Documentation principale : `<liste>`
- Roadmap : `<chemin ou NONE>`

Toute décision durable qui modifie architecture, sécurité, données, runtime ou déploiement est versionnée dans le manifeste, une ADR ou une référence canonique associée.

## 5. Runtime

Pour un projet logiciel utilisant Replit, créer dès l’initialisation un contrat basé sur `ProjectOS/templates/REPLIT_RUNTIME_CONTRACT.md` et le référencer ici.

- Runtime cible principal : `<Replit / GitHub Pages / autre / N/A>`
- Runtime Contract : `<chemin / N/A>`
- Commande de build : `<commande / N/A>`
- Commande de lancement : `<commande / N/A>`
- Preview/URL de validation : `<mécanisme / N/A>`
- Validation physique iPhone requise : `YES / NO`

## 6. Données et sécurité

- Données persistées : `<description>`
- Données sensibles : `<NONE ou description minimale>`
- Secrets : hors dépôt et hors frontend
- Stratégie de sauvegarde/restauration : `<description>`
- Règles de suppression/migration : `<description>`

## 7. Qualité et tests

- Tests statiques : `<commande / N/A>`
- Tests unitaires : `<commande / N/A>`
- Tests d’intégration : `<commande / N/A>`
- Build : `<commande / N/A>`
- Runtime/Preview : `<contrat et gate / N/A>`
- Tests physiques iPhone : `<liste minimale ou N/A>`

Ne jamais déclarer un test réussi sans preuve d’exécution ou observation réelle.

## 8. Toolchain

- ChatGPT : cadrage, architecture, pilotage, revue, changements limités
- Codex : Builds et changements substantiels
- GitHub : source canonique, branches, PR et livraison
- Replit : exécution/test/hébergement lorsque pertinent, sans IA par défaut
- Pyto / Scriptable / Working Copy : uniquement selon les besoins iPhone/local

Toute exception suit `ProjectOS/standards/TOOLCHAIN_POLICY.md`.

## 9. Cycle de livraison

1. vérifier `main` et le SHA de base ;
2. exécuter Delivery Preflight ;
3. exécuter le runtime preflight lorsqu’applicable ;
4. travailler sur une branche dédiée ;
5. tester ;
6. ouvrir une Pull Request ;
7. vérifier les preuves GitHub ;
8. exécuter la validation runtime/Preview lorsqu’applicable ;
9. fusionner uniquement sur instruction explicite et après validation.

## 10. État vivant

- **Dernier jalon intégré** : `<...>`
- **Travail en cours** : `<...>`
- **Prochaine action** : `<...>`
- **Risques connus** : `<...>`
- **Incidents liés** : `<incident_id ou NONE>`

## 11. Références

- `ProjectOS/BOOTSTRAP.md`
- `ProjectOS/standards/TOOLCHAIN_POLICY.md`
- `ProjectOS/standards/TESTING.md`
- `ProjectOS/standards/ARTIFACT_DELIVERY_AND_RECOVERY.md`
- `ProjectOS/standards/REPLIT_RUNTIME_CONTRACT.md` lorsque Replit est utilisé
- autres références propres au projet : `<liste>`
