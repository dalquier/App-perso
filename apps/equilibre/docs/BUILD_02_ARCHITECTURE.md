# Équilibre — BUILD-02 conversation persistante

## Architecture

BUILD-02 conserve la PWA Vite locale sous `apps/equilibre/` et ajoute un domaine de conversations indépendant de l’interface. La couche UI (`src/app.js`) orchestre les vues iPhone : accueil, historique, fil, séance BUILD-01 et réglages. Le domaine (`src/domain/conversation.js`) définit conversations, messages, modes, statuts, renommage et mutation immuable. Le fournisseur local (`src/providers/conversationProvider.js`) expose un contrat asynchrone progressif compatible avec un futur fournisseur OpenAI sans modifier le domaine.

## Modèle de données

Le stockage local versionné `equilibre.local.v1` est en version `2`. Une conversation possède `id`, `title`, `createdAt`, `updatedAt`, `status`, `mode`, `schemaVersion` et `messages[]`. Un message possède `id`, `role`, `content`, `createdAt`, `status`, `provenance` et `errorRef` optionnel.

Modes initiaux :

- `free` — échange libre ;
- `clarify` — clarification d’une situation ;
- `action` — préparation d’une prochaine action.

Statuts de message : `sent`, `generating`, `partial`, `complete`, `interrupted`, `error`.

## Migrations

La version BUILD-01 (`version: 1`) est migrée déterministiquement vers une conversation intitulée `Conversation reprise` lorsque des messages existent. Les réglages et la séance guidée existante sont conservés lorsque possible. Une version inconnue est rejetée sans perte silencieuse : l’application repart sur un état vide avec `storageError` affichable.

## Fournisseur et streaming

Le simulateur local est le seul fournisseur actif de BUILD-02. Il produit des fragments via un générateur asynchrone, accepte un `AbortSignal`, signale `degraded: true` et fournit des erreurs structurées. Une interruption marque explicitement le message partiel avec `status: interrupted` et `errorRef: user_interruption`.

## Sécurité

Le garde-fou sensible déterministe reste exécuté avant toute génération ordinaire. Les messages interceptés produisent une réponse locale `provenance: safety-guard` et ne sont transmis à aucun fournisseur. Aucun secret, appel OpenAI obligatoire ou donnée réelle n’est ajouté.

## Lancement local

```bash
cd apps/equilibre
npm install
npm run dev
```

## Lancement Replit

Importer `dalquier/App-perso`, ouvrir un shell, puis cibler explicitement l’application :

```bash
cd apps/equilibre
npm install
npm run dev -- --host 0.0.0.0
```

Ne pas créer de fichier `.replit` global dédié uniquement à Équilibre.

## Tests

```bash
cd apps/equilibre
npm test
npm run build
```

Les tests couvrent création, ordre des messages, reprise, renommage, suppression, migration BUILD-01, version inconnue, modes, génération progressive, interruption, erreur fournisseur, mode dégradé, garde-fou, effacement total et isolation entre conversations.

## Recette iPhone

1. Ouvrir la PWA sur Safari iPhone ou depuis l’écran d’accueil.
2. Créer deux conversations, envoyer des messages fictifs et vérifier leur présence dans Historique.
3. Changer le mode d’une conversation et vérifier que le simulateur adapte la réponse.
4. Fermer complètement Safari/PWA, rouvrir et reprendre la conversation active en une action.
5. Tester un message sensible fictif et vérifier que le garde-fou répond avant le simulateur.
6. Lancer une génération longue, toucher `Stop` et vérifier le statut interrompu.
7. Renommer puis supprimer une conversation avec confirmation.
8. Vérifier champ multiligne, clavier iOS, zone sûre basse, thème clair/sombre/système et fil long.
9. Effacer toutes les données dans Réglages, puis vérifier l’état vide.

## Limites

- Pas d’API OpenAI réelle en BUILD-02.
- Pas de synchronisation cloud, compte utilisateur, embeddings, voix ni mémoire personnelle avancée.
- Le streaming est simulé localement avec des fragments de texte.

## Retour arrière

Revenir au commit précédent BUILD-02 ou restaurer le stockage navigateur. La migration ne modifie pas de backend et les données sont locales. En cas de doute, effacer les données depuis Réglages.

## Préparation OpenAI future

Ajouter un fournisseur implémentant le contrat `generate({ conversation, signal })`, renvoyant des fragments progressifs et erreurs structurées. Les secrets devront rester côté serveur ou dans une configuration sécurisée hors client ; aucun secret navigateur n’est prévu.
