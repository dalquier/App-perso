# ADR-003 — Conversation Orchestrator à double mode d’exécution

- Statut : accepté
- Date : 2026-08-05

## Contexte

Damien veut générer, depuis un script maître, un fichier contenant plusieurs prompts initiaux, lancer les travaux correspondants en parallèle, récupérer leurs réponses et remettre un corpus homogène au script maître pour arbitrage final.

Deux sources d’exécution doivent coexister :

1. l’API OpenAI, automatisable mais facturée séparément de ChatGPT ;
2. ChatGPT Plus, utilisable dans l’application ChatGPT mais sans API publique permettant de créer automatiquement les discussions visibles ni d’en extraire automatiquement les réponses.

Les conditions d’utilisation de ChatGPT interdisent l’extraction automatique ou programmatique des données et sorties du service grand public. Le mode ChatGPT doit donc rester un flux manuel explicite de copier-coller.

DeveloperOS est déjà le poste de pilotage iPhone des projets, conversations et outils de création. Le module appartient donc à DeveloperOS plutôt qu’à une application ou un dépôt séparé.

## Options évaluées

### A. Automatiser directement l’interface ChatGPT

Rejetée : absence d’API publique adaptée, fragilité des automatisations d’interface, dépendance aux changements de l’application, risque de non-conformité et absence de récupération fiable.

### B. Utiliser uniquement l’API OpenAI

Rejetée comme solution exclusive : automatisation complète, mais facturation séparée et impossibilité d’utiliser le quota ChatGPT Plus choisi par Damien.

### C. Utiliser uniquement ChatGPT par copier-coller

Rejetée comme solution exclusive : utilise ChatGPT Plus mais ne permet ni lancement automatique, ni reprise serveur, ni collecte automatique.

### D. Orchestrateur à double mode

Acceptée : un contrat commun de missions et résultats alimente soit un moteur API automatisé, soit un parcours ChatGPT Plus assisté par copier-coller. Les deux modes peuvent coexister dans une même exécution.

## Décision

1. Créer un module officiel `Conversation Orchestrator` dans DeveloperOS.
2. Utiliser JSON comme format canonique V1 des demandes, états et résultats.
3. Définir deux canaux d’exécution par mission :
   - `openai_api` ;
   - `chatgpt_plus_manual`.
4. Autoriser un mode global `hybrid` dans lequel chaque mission choisit son canal.
5. Nommer chaque prompt fils selon le motif obligatoire :

   ```text
   <nom exact du prompt maître> — <numéro séquentiel>
   ```

   Le numéro comporte au minimum deux chiffres et reste immuable pendant toute l’exécution.
6. Séparer l’identifiant technique stable du titre visible de la conversation.
7. Exécuter automatiquement en parallèle uniquement les missions dont toutes les dépendances sont satisfaites, avec une limite de concurrence configurable.
8. En mode ChatGPT Plus, préparer le nom et le prompt, ouvrir ChatGPT à la demande et collecter la réponse par collage manuel ; aucune extraction automatique n’est autorisée.
9. En mode API, conserver la clé uniquement côté serveur. Aucune clé ne doit être exposée dans la PWA, IndexedDB, GitHub, un export ou un journal.
10. Normaliser toutes les réponses dans un même objet de résultat avant transmission au script maître.
11. Conserver les données d’exécution réelles dans un stockage privé ou local. Le dépôt public ne contient que les schémas, exemples anonymisés, tests et documentation.
12. Ne pas intégrer ce module dans `BUILD-01 — Project Core`. Il constitue un axe postérieur avec ses propres Builds et Pull Requests.

## Architecture retenue

- Interface principale : module PWA de DeveloperOS.
- Contrat : fichiers JSON versionnés et validés par JSON Schema.
- Mode manuel : local-first, sans backend obligatoire.
- Mode API : backend TypeScript/Node minimal, authentifié et détenteur du secret.
- Persistance : repository abstrait permettant IndexedDB pour le local et stockage serveur pour les exécutions API.
- Orchestration : graphe de dépendances acyclique, file d’attente, concurrence bornée, reprise et idempotence.
- Consolidation : production d’un dossier de résultats commun puis lancement manuel ou API du prompt maître final.

## Conséquences

### Positives

- Respect du choix entre ChatGPT Plus et API.
- Automatisation maximale sans automatiser illicitement l’interface ChatGPT.
- Résultats homogènes quel que soit le canal.
- Exécution parallèle réelle pour l’API et pilotage parallèle assisté pour ChatGPT Plus.
- Reprise après interruption et relance ciblée d’une seule mission.
- Architecture compatible avec l’iPhone et DeveloperOS.

### Négatives

- Le mode ChatGPT Plus requiert des copier-coller et ne peut pas récupérer seul les réponses.
- Les conversations manuelles ne sont pas automatiquement liées à un identifiant ChatGPT vérifiable.
- Le mode API nécessite un backend, une clé, un budget et une gestion des limites.
- L’intégration ajoute un sous-système distribué qui doit rester séparé du noyau local de DeveloperOS.

## Règles de parallélisation

La parallélisation est autorisée uniquement après gel du contrat partagé.

- Les missions sans dépendance peuvent être lancées simultanément.
- Une mission dépendante reste bloquée jusqu’à disponibilité des résultats requis.
- Deux tâches Codex ne doivent jamais modifier le même périmètre de fichiers en parallèle.
- Les travaux d’implémentation sont séparés en branches et lots sans chevauchement, puis intégrés par une tâche dédiée.
- Aucun agent ne reconstruit en parallèle une solution déjà confiée à un autre agent sans objectif comparatif explicite.

## Sécurité et conformité

- Aucun secret dans le client ou le dépôt public.
- Validation stricte des fichiers importés.
- Limites de taille, de nombre de missions et de concurrence.
- Confirmation avant suppression, remplacement massif ou relance coûteuse.
- Journalisation sans contenu sensible par défaut.
- Aucun scraping, automatisation DOM, interception privée ou extraction programmatique de ChatGPT.
- Les coûts API et limites ChatGPT sont présentés comme deux ressources distinctes.

## Références officielles vérifiées

- Conversations API : https://platform.openai.com/docs/api-reference/conversations
- Responses API : https://platform.openai.com/docs/api-reference/responses
- Webhook events : https://platform.openai.com/docs/api-reference/webhook-events
- Batch API : https://platform.openai.com/docs/api-reference/batch
- Facturation ChatGPT/API séparée : https://help.openai.com/fr-fr/articles/8156019-how-can-i-move-my-chatgpt-subscription-to-the-api
- Conditions d’utilisation : https://openai.com/fr-FR/policies/terms-of-use/

## Critères de réexamen

Réexaminer cette décision seulement si OpenAI publie une API officielle permettant de créer, nommer et lire les conversations du produit ChatGPT grand public, ou si les conditions d’utilisation autorisent explicitement une automatisation équivalente.
