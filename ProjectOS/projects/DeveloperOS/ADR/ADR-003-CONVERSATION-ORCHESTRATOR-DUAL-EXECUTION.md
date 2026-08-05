# ADR-003 — Conversation Orchestrator à double canal d’exécution

- Statut : accepté
- Date : 2026-08-05
- Dernière relecture : 2026-08-05

## Contexte

Damien veut générer, depuis un script maître, un fichier contenant plusieurs prompts initiaux, lancer les travaux correspondants en parallèle, récupérer leurs réponses et remettre un corpus homogène au script maître pour arbitrage final.

Deux canaux d’exécution doivent coexister :

1. l’API OpenAI, automatisable et facturée séparément de ChatGPT ;
2. ChatGPT Plus, utilisable dans l’application ChatGPT avec une assistance au copier-coller.

Au 5 août 2026, aucune API publique documentée par OpenAI n’a été identifiée pour créer, nommer puis lire automatiquement les conversations visibles dans l’historique du produit ChatGPT grand public. Les Conditions d’utilisation interdisent par ailleurs l’extraction automatique ou programmatique des données ou sorties du service grand public. Le canal ChatGPT Plus doit donc rester un flux manuel explicite de copier-coller.

DeveloperOS est déjà le poste de pilotage iPhone des projets, conversations et outils de création. Le module appartient donc à DeveloperOS plutôt qu’à une application ou un dépôt séparé.

## Options évaluées

### A. Automatiser directement l’interface ChatGPT

Rejetée : absence de mécanisme public documenté adapté, fragilité des automatisations d’interface, dépendance aux changements du produit, risque de non-conformité et récupération non fiable.

### B. Utiliser uniquement l’API OpenAI

Rejetée comme solution exclusive : automatisation complète, mais facturation séparée et impossibilité d’utiliser l’allocation d’usage ChatGPT Plus choisie par Damien.

### C. Utiliser uniquement ChatGPT par copier-coller

Rejetée comme solution exclusive : utilise ChatGPT Plus, mais ne permet ni lancement automatique, ni reprise serveur, ni collecte automatique.

### D. Orchestrateur à double canal

Acceptée : un contrat commun de missions et de résultats alimente soit un moteur API automatisé, soit un parcours ChatGPT Plus assisté par copier-coller. Les deux canaux peuvent coexister dans une même exécution ; l’état `hybrid` est alors dérivé des canaux réellement sélectionnés et ne constitue pas un troisième canal.

## Décision

1. Créer un module officiel `Conversation Orchestrator` dans DeveloperOS.
2. Utiliser JSON comme format canonique V1 des demandes, plans, états et résultats.
3. Définir exactement deux canaux d’exécution :
   - `openai_api` ;
   - `chatgpt_plus_manual`.
4. Déduire qu’un run est hybride lorsqu’au moins deux canaux différents sont utilisés entre ses missions et sa synthèse maître.
5. Nommer chaque prompt fils selon le motif fixe :

   ```text
   <nom exact du prompt maître> — <numéro séquentiel>
   ```

6. Générer le numéro à partir de la position canonique de la mission dans le tableau `jobs` : deux chiffres minimum, puis trois à partir de 100. Le fichier d’entrée ne fournit pas lui-même `sequence` en V1.
7. Figer l’ordre, les numéros et les titres au passage du run à l’état `validated`. Toute modification ultérieure crée une nouvelle révision du run.
8. Séparer l’identifiant technique stable du titre visible de la conversation.
9. Exécuter automatiquement en parallèle uniquement les missions dont toutes les dépendances requises sont terminées, avec une limite de concurrence configurable.
10. Injecter de manière déterministe les résultats des dépendances dans le prompt effectif de la mission dépendante ; attendre une dépendance sans transmettre son résultat ne satisfait pas le contrat.
11. En canal ChatGPT Plus, préparer le titre et le prompt, ouvrir ChatGPT à la demande et collecter la réponse par collage manuel ; aucune extraction automatique n’est autorisée.
12. En canal API, conserver la clé uniquement côté serveur. Aucune clé ne doit être exposée dans la PWA, IndexedDB, GitHub, un export ou un journal.
13. Normaliser toutes les réponses dans un même objet de résultat avant transmission au script maître, sans altérer la réponse brute.
14. Conserver les données d’exécution réelles dans un stockage privé ou local. Le dépôt public ne contient que les schémas, exemples anonymisés, tests et documentation.
15. Ne pas intégrer ce module dans `BUILD-01 — Project Core`. Il constitue un axe postérieur avec ses propres Builds et Pull Requests.

## Architecture retenue

- Interface principale : module PWA de DeveloperOS.
- Contrat : fichiers JSON versionnés et validés par JSON Schema.
- Plan canonique : `run-plan.json`, dérivé du fichier d’entrée et contenant les séquences et titres générés.
- Canal manuel : local-first, sans backend obligatoire.
- Canal API : backend TypeScript/Node minimal, authentifié et détenteur du secret.
- Persistance : repository abstrait permettant IndexedDB pour le local et stockage serveur privé pour les exécutions API.
- Orchestration : graphe de dépendances acyclique, file d’attente, concurrence bornée, reprise et idempotence.
- Dépendances : bloc de contexte construit à partir des résultats requis et injecté dans le prompt effectif.
- Consolidation : production d’un dossier de résultats commun, puis lancement manuel ou API du prompt maître final.

## Conséquences

### Positives

- Respect du choix entre ChatGPT Plus et API.
- Automatisation maximale sans automatiser l’interface ChatGPT.
- Nommage déterministe sans contradiction entre ordre du tableau et numéro fourni.
- Résultats homogènes quel que soit le canal.
- Dépendances réellement exploitables par les missions aval.
- Exécution parallèle réelle pour l’API et pilotage parallèle assisté pour ChatGPT Plus.
- Reprise après interruption et relance ciblée d’une seule mission.
- Architecture compatible avec l’iPhone et DeveloperOS.

### Négatives

- Le canal ChatGPT Plus requiert des copier-coller et ne peut pas récupérer seul les réponses.
- Les conversations manuelles ne sont pas automatiquement liées à un identifiant ChatGPT vérifiable.
- Le canal API nécessite un backend, une clé, un budget et une gestion des limites.
- Une modification de l’ordre après validation exige une nouvelle révision du run.
- L’intégration ajoute un sous-système distribué qui doit rester séparé du noyau local de DeveloperOS.

## Règles de parallélisation

La parallélisation des développements est autorisée uniquement après gel et intégration du contrat partagé par `CO-BUILD-00`.

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
- Les politiques de conservation côté API doivent être explicites avant `CO-BUILD-02`.

## Références officielles vérifiées

- Conversation state : https://developers.openai.com/api/docs/guides/conversation-state
- Responses API : https://developers.openai.com/api/docs/guides/responses
- Background mode : https://developers.openai.com/api/docs/guides/background
- Webhooks : https://developers.openai.com/api/docs/guides/webhooks
- Batch API : https://developers.openai.com/api/docs/guides/batch
- Facturation ChatGPT/API séparée : https://help.openai.com/fr-fr/articles/8156019-how-can-i-move-my-chatgpt-subscription-to-the-api
- Conditions d’utilisation : https://openai.com/fr-FR/policies/terms-of-use/

## Critères de réexamen

Réexaminer cette décision seulement si OpenAI publie une API officielle permettant de créer, nommer et lire les conversations du produit ChatGPT grand public, si les Conditions d’utilisation autorisent explicitement une automatisation équivalente, ou si une contrainte vérifiée rend l’architecture à double canal inexploitable.
