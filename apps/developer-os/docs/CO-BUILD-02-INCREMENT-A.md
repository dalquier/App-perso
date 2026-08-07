# CO-BUILD-02 — Incrément A

Cet incrément ajoute uniquement les contrats serveur, la configuration typée et le provider fake sans réseau. Il n'ajoute ni serveur HTTP, ni PostgreSQL, ni SDK OpenAI, ni scheduler.

## Configuration

Copier `.env.example` vers un fichier local ignoré puis remplacer toutes les valeurs fictives. `OPENAI_API_KEY` est une variable strictement serveur : elle ne doit jamais recevoir le préfixe Vite, entrer dans IndexedDB, un export, un log ou Git.

Variables obligatoires :

- `OPENAI_API_KEY` : secret serveur OpenAI ;
- `DATABASE_URL` : URL PostgreSQL privée, réservée au prochain incrément de persistance ;
- `DEVELOPEROS_ALLOWED_ORIGIN` : origine exacte de la PWA, HTTPS obligatoire en production ;
- `NODE_ENV` : `development`, `test` ou `production`.

Les limites facultatives sont documentées dans `.env.example` et validées dans des bornes codées côté serveur. Une valeur manquante obligatoire, mal formée ou hors borne arrête le serveur avec une erreur assainie ne contenant pas la valeur fautive.

`DATABASE_URL` accepte uniquement `postgres://` ou `postgresql://`, avec un hôte et un nom de base. Les paramètres de connexion PostgreSQL, par exemple `sslmode=require`, restent autorisés. La valeur complète est privée et n'est jamais renvoyée dans une erreur publique.

## Provider

`ExecutionProvider` reçoit le contexte effectif complet d'une mission. `FakeExecutionProvider` produit une réponse SHA-256 stable ou un scénario injecté et n'effectue aucun appel réseau. Le futur provider OpenAI utilisera Responses API avec `store: false`, `background: false`, un timeout explicite et `maxRetries: 0`; ces appels ne font pas partie de cet incrément.

La production utilisera un `PostgresRunRepository` sur PostgreSQL dans le backend séparé de CO-BUILD-02. Le fournisseur d'hébergement et de base reste à décider dans ce périmètre ; aucun repository fichier n'est prévu pour la production.
