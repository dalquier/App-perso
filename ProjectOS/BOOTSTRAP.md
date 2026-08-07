# ProjectOS — BOOTSTRAP

Point d’entrée unique et stable de ProjectOS. Les instructions du projet ChatGPT doivent uniquement demander de charger ce fichier dans sa version la plus récente.

## 1. Principes d’amorçage

- GitHub `dalquier/App-perso`, branche `main`, est la source de vérité de ProjectOS.
- Ne jamais substituer une copie mémorisée à une référence vivante accessible.
- Charger uniquement les références utiles à la demande, après le socle obligatoire.
- Signaler toute référence absente, inaccessible, contradictoire ou manifestement obsolète.
- La politique de toolchain frugale est permanente : ChatGPT et Codex réalisent le développement ; Replit Starter est réservé à l’exécution, aux tests, au stockage de travail et au déploiement.
- L’optimisation des crédits, quotas, appels payants et ressources cloud est permanente et régie par `standards/CREDIT_OPTIMIZATION.md`.
- L’évaluation des flux indépendants et leur éventuelle parallélisation sont régies par `standards/PARALLEL_EXECUTION.md`. Les lectures internes sans effet de bord peuvent être parallélisées automatiquement ; toute parallélisation visible nécessite la réponse décisionnelle canonique définie dans ce standard.
- La communication de progression est régie par `standards/PROGRESS_COMMUNICATION.md`. Toute tâche nécessitant une attente perceptible, des outils ou plusieurs opérations donne des mises à jour factuelles indiquant les éléments réalisés, l’action en cours, les étapes restantes et le temps restant estimé.
- Avant chaque prompt opérationnel remis à Damien, annoncer l’outil le plus adapté, la raison du choix, le coût relatif, l’alternative moins coûteuse et la condition observable de bascule. Cette annonce reste distincte du prompt.
- Toute tâche susceptible de produire une modification ou un artefact doit appliquer `standards/ARTIFACT_DELIVERY_AND_RECOVERY.md` avant la première modification. La capacité de livraison est un prérequis, et la récupération effective doit être prouvée avant de déclarer la tâche terminée.
- Dans Codex Cloud, distinguer le sandbox terminal du mécanisme natif de publication GitHub : l’absence de `origin`, d’upstream, de `GH_TOKEN` ou d’authentification `gh` dans le terminal n’est pas bloquante lorsque l’environnement Codex est explicitement relié au dépôt et à la branche de base attendus.
- Toute tâche Codex destinée à GitHub applique en plus `standards/CODEX_GITHUB_RELIABILITY.md` : fraîcheur de la base et de la PR, réservation des ressources logiques mutables, preuve du SHA distant, preuve CI attachée au SHA exact relu et Merge Gate avant toute fusion.
- Toute demande ProjectOS applique `standards/INCIDENT_LEARNING.md` : les incidents et blocages matériels sont classés, dédupliqués et enregistrés dans l’Incident Ledger GitHub #87 lorsqu’ils apportent une valeur d’apprentissage. Une limitation externe correctement contournée reste un incident connu, pas nécessairement une erreur à supprimer.
- Avant de promettre une validation dépendant d’un navigateur, runtime, exécutable, réseau externe ou capacité de rendu, appliquer l’`Execution Capability Preflight` défini dans `standards/INCIDENT_LEARNING.md`.
- La mémoire conversationnelle est régie par `standards/CONVERSATION_MEMORY.md` et l’archive intégrale par `standards/CONVERSATION_ARCHIVE_PIPELINE.md`. Un consentement permanent spécifique à Codex est actif depuis le 5 août 2026 : toute conversation ProjectOS exécutée avec Codex est enregistrée automatiquement, avec index et synthèse dans GitHub, puis transcription visible et fichiers accessibles directement dans Google Drive, jusqu’à révocation explicite.
- Pendant l’amorçage et après celui-ci, les messages intermédiaires suivent le format `Avancement`, `Réalisé`, `En cours`, `Reste à faire`, `Temps restant estimé` et, lorsque nécessaire, `Point d’attention`.
- Les mises à jour de progression décrivent uniquement des faits opérationnels, résultats vérifiés, fichiers ou états utiles et prochaines étapes concrètes. Elles n’exposent jamais les raisonnements internes, secrets, données sensibles ou journaux techniques exhaustifs.
- Les réponses décisionnelles à formulation exacte, notamment la mémoire et la parallélisation, restent isolées et ne doivent jamais être fusionnées avec une mise à jour de progression.

## 2. Séquence obligatoire

1. Charger `ProjectOS/00_INDEX.md`.
2. Charger `ProjectOS/PROJECT_REGISTRY.md`.
3. Charger le socle :
   - `ProjectOS/core/KERNEL.md` ;
   - `ProjectOS/core/LIFECYCLE.md` ;
   - `ProjectOS/core/DECISION_ENGINE.md`.
4. Charger `ProjectOS/standards/CREDIT_OPTIMIZATION.md` pour toute demande ProjectOS.
5. Charger `ProjectOS/standards/PARALLEL_EXECUTION.md` pour toute demande ProjectOS.
6. Charger `ProjectOS/standards/PROGRESS_COMMUNICATION.md` pour toute demande ProjectOS.
7. Charger `ProjectOS/standards/INCIDENT_LEARNING.md` pour toute demande ProjectOS.
8. Charger `ProjectOS/standards/TOOLCHAIN_POLICY.md` pour toute demande liée à un projet logiciel.
9. Charger `ProjectOS/standards/ARTIFACT_DELIVERY_AND_RECOVERY.md` pour toute tâche susceptible de produire une modification, une branche, une Pull Request ou un artefact.
10. Charger `ProjectOS/standards/CODEX_NATIVE_PUBLISHING.md` et `ProjectOS/standards/CODEX_GITHUB_RELIABILITY.md` pour toute tâche exécutée dans Codex Cloud, publiée depuis Codex ou destinée à relire, valider ou fusionner un résultat Codex dans GitHub.
11. Charger `ProjectOS/standards/CONVERSATION_MEMORY.md` et `ProjectOS/standards/CONVERSATION_ARCHIVE_PIPELINE.md` pour toute nouvelle conversation ProjectOS.
12. Identifier le projet, l’objectif réel et le résultat attendu.
13. Résoudre le projet dans `PROJECT_REGISTRY.md`.
14. Charger son `PROJECT_MANIFEST.md`, s’il existe.
15. Charger les ADR applicables et uniquement la documentation nécessaire.
16. Charger les standards transverses pertinents : qualité, outils, code, documentation et tests.
17. Avant de remettre un prompt opérationnel à Damien, appliquer le bloc de recommandation défini dans `standards/CREDIT_OPTIMIZATION.md`.
18. Avant toute première modification, exécuter le Delivery Preflight : dépôt, référence de base, branche cible, SHA source, canal de livraison, compatibilité des fichiers, plan de récupération et preuve externe attendue. Pour un flux Codex ↔ GitHub, compléter ce précontrôle par le Reliability Preflight : SHA vivant de base, SHA de tête de PR éventuel, contexte de lancement, ressources mutables réservées et preuves SHA/CI/fusion attendues.
19. Lorsque la tâche dépend d’une capacité d’environnement pour exécuter un test, produire un screenshot, utiliser un navigateur/runtime ou joindre un service externe, exécuter l’Execution Capability Preflight avant de promettre cette preuve et définir un environnement alternatif lorsque nécessaire.
20. Vérifier l’état vivant des dépôts, branches, Pull Requests, fichiers et exécutions concernés. Pour un flux Codex ↔ GitHub, appliquer le Freshness Gate avant la première modification puis à nouveau juste avant publication.
21. Consulter Google Drive uniquement pour les ressources explicitement référencées ou nécessaires.
22. Dans la première réponse, présenter uniquement un état rapide des vérifications effectuées : source et branche, références obligatoires chargées, projet identifié ou niveau transverse, anomalies éventuelles et disponibilité pour poursuivre. Ne pas détailler le processus de chargement.
23. Appliquer le régime de consentement défini dans `standards/CONVERSATION_MEMORY.md` :
    - avec Codex, activer automatiquement la mémoire et l’archive intégrale au titre du consentement permanent du 5 août 2026, attribuer un identifiant de session, initialiser le dossier Drive selon le pipeline et terminer la première réponse par `Mémoire Codex : enregistrement activé.` ;
    - avec tout autre outil, terminer la première réponse par la question exacte `Enregistrer la conversation ?`, sans aucun texte après.
24. Avec Codex, poursuivre sans demander de confirmation supplémentaire. Avec un autre outil, attendre la réponse `oui` ou `non` avant de créer tout artefact permanent de mémoire conversationnelle.
25. Dès que la mémoire est activée, par consentement permanent Codex ou par réponse positive, initialiser l’archive Drive, puis charger sélectivement l’index, la chronologie et les synthèses pertinentes du projet.
26. Si la réponse est `non` dans un régime à consentement ponctuel, poursuivre sans mémoire conversationnelle et sans bloquer le traitement.
27. Après résolution du régime de mémoire, reprendre la demande initiale et appliquer `standards/PARALLEL_EXECUTION.md`. Si plusieurs flux visibles satisfont tous ses critères, envoyer uniquement la question canonique `Cette demande comporte des actions indépendantes. Les paralléliser ?` et attendre la réponse avant de lancer ces flux.
28. Si aucune autorisation de parallélisation n’est nécessaire, ou après résolution de la question, exécuter la méthode ProjectOS jusqu’à la livraison ou au meilleur résultat vérifiable possible en appliquant `standards/PROGRESS_COMMUNICATION.md` et `standards/INCIDENT_LEARNING.md`. Tout incident matériel détecté est dédupliqué puis enregistré dans #87, ou marqué `INCIDENT_CAPTURE_PENDING` dans le handoff lorsque GitHub n’est pas inscriptible depuis l’environnement producteur.

## 3. Ordre d’autorité

1. Instruction explicite de Damien dans la conversation active.
2. Contraintes de sécurité et règles de la plateforme.
3. `PROJECT_MANIFEST.md` du projet concerné.
4. ADR applicables et décisions versionnées.
5. Règles transverses de ProjectOS.
6. Documentation versionnée du projet.
7. Documentation collaborative explicitement référencée sur Google Drive.
8. Mémoire conversationnelle enregistrée et synthèses de session.
9. Archive intégrale privée Google Drive et éventuelles copies locales iCloud.

Une règle spécifique prévaut sur une règle générale dans son périmètre. Une instruction récente et explicite prévaut sur une instruction ancienne, sauf si elle compromet la sécurité ou l’intégrité des données.

## 4. Résolution du projet

- Utiliser le nom, les alias et les chemins déclarés dans `PROJECT_REGISTRY.md`.
- Ne pas déduire un dépôt ou un dossier canonique sans preuve.
- En cas d’ambiguïté, poursuivre avec l’hypothèse la plus prudente et la signaler.
- Une demande transversale sans projet identifié reste traitée au niveau ProjectOS.

## 5. Chargement sélectif

Toujours charger :
- `00_INDEX.md` ;
- `PROJECT_REGISTRY.md` ;
- le noyau ProjectOS ;
- `standards/CREDIT_OPTIMIZATION.md` pour toute demande ProjectOS ;
- `standards/PARALLEL_EXECUTION.md` pour toute demande ProjectOS ;
- `standards/PROGRESS_COMMUNICATION.md` pour toute demande ProjectOS ;
- `standards/INCIDENT_LEARNING.md` pour toute demande ProjectOS ;
- `standards/TOOLCHAIN_POLICY.md` pour un projet logiciel ;
- `standards/ARTIFACT_DELIVERY_AND_RECOVERY.md` pour toute tâche produisant une modification ou un artefact ;
- `standards/CODEX_NATIVE_PUBLISHING.md` et `standards/CODEX_GITHUB_RELIABILITY.md` pour une tâche Codex Cloud, une publication Codex ou une décision de revue/fusion portant sur un résultat Codex ;
- `standards/CONVERSATION_MEMORY.md` et `standards/CONVERSATION_ARCHIVE_PIPELINE.md` au démarrage d’une nouvelle conversation ProjectOS ;
- le manifeste du projet concerné, lorsqu’il existe.

Après activation de l’enregistrement, charger seulement :
- `memory/CONVERSATION_INDEX.md` ;
- `memory/PROJECT_TIMELINE.md` ;
- les synthèses de sessions directement pertinentes.

Charger ensuite seulement :
- les ADR liés à la décision ;
- les standards liés à la tâche ;
- les documents fonctionnels ou techniques nécessaires ;
- les prompts d’action utiles.

## 6. Contrôle de fraîcheur

Avant d’agir :
- vérifier la branche de référence ;
- vérifier les versions et dates lorsqu’elles sont disponibles ;
- détecter les documents `legacy`, archivés ou dépréciés ;
- distinguer faits vérifiés, hypothèses et informations manquantes ;
- vérifier que le canal de livraison annoncé reste disponible et adapté au diff prévu ;
- pour un flux Codex ↔ GitHub, vérifier séparément le SHA vivant de la base, le SHA de la branche/PR cible et les ressources logiques mutables partagées.

Si une référence est modifiée pendant la conversation, recharger sa dernière version avant toute décision dépendante.

Un workflow vert n’est jamais une preuve générale : pour une décision de livraison ou de fusion Codex, le SHA relu, le SHA de tête de la PR et le SHA testé par la CI doivent être identiques, selon `standards/CODEX_GITHUB_RELIABILITY.md`.

## 7. Sortie d’amorçage

Pendant le chargement, chaque message intermédiaire suit `standards/PROGRESS_COMMUNICATION.md` et indique brièvement ce qui a été chargé ou vérifié, l’action en cours, ce qu’il reste à faire et le temps restant estimé. La première réponse reste courte et ne contient qu’un état des vérifications, puis l’indication d’activation automatique avec Codex ou la question de consentement avec les autres outils.

L’amorçage doit aboutir à un état de travail comprenant :
- projet identifié ou niveau transverse confirmé ;
- objectif reformulé ;
- références chargées ;
- état GitHub vérifié selon le mécanisme réel de la plateforme ;
- mode de livraison et preuve externe attendue définis avant toute modification ;
- capacités d’exécution nécessaires identifiées lorsqu’une validation dépend d’un navigateur, runtime, exécutable, réseau ou renderer ;
- pour un flux Codex ↔ GitHub, état de fraîcheur, ressources logiques réservées et relation entre SHA de base, SHA de PR et preuve CI explicités ;
- risques et contradictions signalés ;
- anomalies, inconnues ou contradictions signalées en une ligne, ou mention `aucune anomalie détectée` ;
- disponibilité pour traiter la demande ;
- régime de mémoire appliqué : activation automatique avec Codex ou consentement ponctuel demandé avec les autres outils.

La première réponse ne contient jamais la question de parallélisation. Celle-ci ne peut être évaluée qu’après résolution du régime de mémoire, selon `standards/PARALLEL_EXECUTION.md`.

Ne jamais demander à l’utilisateur d’« activer ProjectOS » lorsque ce fichier a déjà été chargé.
