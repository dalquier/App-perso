# ProjectOS — BOOTSTRAP

Point d’entrée unique et stable de ProjectOS. Les instructions du projet ChatGPT doivent uniquement demander de charger ce fichier dans sa version la plus récente.

## 1. Principes d’amorçage

- GitHub `dalquier/App-perso`, branche `main`, est la source de vérité de ProjectOS.
- Ne jamais substituer une copie mémorisée à une référence vivante accessible.
- Charger uniquement les références utiles à la demande, après le socle obligatoire.
- Signaler toute référence absente, inaccessible, contradictoire ou manifestement obsolète.
- La politique de toolchain frugale est permanente : ChatGPT et Codex réalisent le développement ; Replit Starter est réservé à l’exécution, aux tests, au stockage de travail et au déploiement.
- Toute tâche susceptible de produire une modification ou un artefact doit appliquer `standards/ARTIFACT_DELIVERY_AND_RECOVERY.md` avant la première modification. La capacité de livraison est un prérequis, et la récupération effective doit être prouvée avant de déclarer la tâche terminée.
- Dans Codex Cloud, distinguer le sandbox terminal du mécanisme natif de publication GitHub : l’absence de `origin`, d’upstream, de `GH_TOKEN` ou d’authentification `gh` dans le terminal n’est pas bloquante lorsque l’environnement Codex est explicitement relié au dépôt et à la branche de base attendus.
- La mémoire conversationnelle est régie par `standards/CONVERSATION_MEMORY.md`. Un consentement permanent spécifique à Codex est actif depuis le 5 août 2026 : toute conversation ProjectOS exécutée avec Codex est enregistrée automatiquement sous forme structurée, jusqu’à révocation explicite. L’archivage Drive du verbatim et des fichiers associés ne concerne que les conversations ProjectOS enregistrées, dépend de leur disponibilité réelle et ne déclenche jamais un export global du compte OpenAI.
- Pendant l’amorçage d’une nouvelle conversation ProjectOS, les messages intermédiaires visibles par Damien doivent contenir uniquement une estimation concise du temps restant, au format `Temps restant estimé : <durée>.` Aucun détail sur les fichiers, outils, étapes ou résultats ne doit être affiché avant la première réponse.
- Après l’amorçage, pour toute tâche ProjectOS nécessitant une attente perceptible, des outils ou plusieurs opérations, chaque message intermédiaire visible doit afficher uniquement une estimation actualisée au même format. Ne pas afficher de libellé de progression, d’étape, d’outil, de fichier, de résultat partiel ou de formule telle que `Réflexion en cours`. Cette règle concerne les messages produits par l’agent ; les indicateurs natifs non configurables de l’application restent hors de son contrôle.

## 2. Séquence obligatoire

1. Charger `ProjectOS/00_INDEX.md`.
2. Charger `ProjectOS/PROJECT_REGISTRY.md`.
3. Charger le socle :
   - `ProjectOS/core/KERNEL.md` ;
   - `ProjectOS/core/LIFECYCLE.md` ;
   - `ProjectOS/core/DECISION_ENGINE.md`.
4. Charger `ProjectOS/standards/TOOLCHAIN_POLICY.md` pour toute demande liée à un projet logiciel.
5. Charger `ProjectOS/standards/ARTIFACT_DELIVERY_AND_RECOVERY.md` pour toute tâche susceptible de produire une modification, une branche, une Pull Request ou un artefact.
6. Charger `ProjectOS/standards/CODEX_NATIVE_PUBLISHING.md` pour toute tâche exécutée dans Codex Cloud ou publiée par l’interface native Codex.
7. Charger `ProjectOS/standards/CONVERSATION_MEMORY.md` pour toute nouvelle conversation ProjectOS.
8. Identifier le projet, l’objectif réel et le résultat attendu.
9. Résoudre le projet dans `PROJECT_REGISTRY.md`.
10. Charger son `PROJECT_MANIFEST.md`, s’il existe.
11. Charger les ADR applicables et uniquement la documentation nécessaire.
12. Charger les standards transverses pertinents : qualité, outils, code, documentation et tests.
13. Avant toute première modification, exécuter le Delivery Preflight : dépôt, référence de base, branche cible, SHA source, canal de livraison, compatibilité des fichiers, plan de récupération et preuve externe attendue.
14. Vérifier l’état vivant des dépôts, branches, Pull Requests, fichiers et exécutions concernés.
15. Consulter Google Drive uniquement pour les ressources explicitement référencées ou nécessaires.
16. Dans la première réponse, présenter uniquement un état rapide des vérifications effectuées : source et branche, références obligatoires chargées, projet identifié ou niveau transverse, anomalies éventuelles et disponibilité pour poursuivre. Ne pas détailler le processus de chargement.
17. Appliquer le régime de consentement défini dans `standards/CONVERSATION_MEMORY.md` :
    - avec Codex, activer automatiquement l’enregistrement structuré au titre du consentement permanent du 5 août 2026, attribuer un identifiant de session et terminer la première réponse par `Mémoire Codex : enregistrement activé.` ;
    - avec tout autre outil, terminer la première réponse par la question exacte `Enregistrer la conversation ?`, sans aucun texte après.
18. Avec Codex, poursuivre sans demander de confirmation supplémentaire. Avec un autre outil, attendre la réponse `oui` ou `non` avant de créer tout artefact permanent de mémoire conversationnelle.
19. Dès que la mémoire est activée, par consentement permanent Codex ou par réponse positive, charger sélectivement l’index, la chronologie et les synthèses pertinentes du projet.
20. Si la réponse est `non` dans un régime à consentement ponctuel, poursuivre sans mémoire conversationnelle et sans bloquer le traitement.
21. Exécuter la méthode ProjectOS jusqu’à la livraison ou au meilleur résultat vérifiable possible.

## 3. Ordre d’autorité

1. Instruction explicite de Damien dans la conversation active.
2. Contraintes de sécurité et règles de la plateforme.
3. `PROJECT_MANIFEST.md` du projet concerné.
4. ADR applicables et décisions versionnées.
5. Règles transverses de ProjectOS.
6. Documentation versionnée du projet.
7. Documentation collaborative explicitement référencée sur Google Drive.
8. Mémoire conversationnelle enregistrée et synthèses de session.
9. Copies locales iCloud et historique conversationnel brut.

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
- `standards/TOOLCHAIN_POLICY.md` pour un projet logiciel ;
- `standards/ARTIFACT_DELIVERY_AND_RECOVERY.md` pour toute tâche produisant une modification ou un artefact ;
- `standards/CODEX_NATIVE_PUBLISHING.md` pour une tâche Codex Cloud ;
- `standards/CONVERSATION_MEMORY.md` au démarrage d’une nouvelle conversation ProjectOS ;
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
- vérifier que le canal de livraison annoncé reste disponible et adapté au diff prévu.

Si une référence est modifiée pendant la conversation, recharger sa dernière version avant toute décision dépendante.

## 7. Sortie d’amorçage

Pendant le chargement, chaque message intermédiaire est limité à l’estimation du temps restant. La première réponse reste courte et ne contient qu’un état des vérifications, puis l’indication d’activation automatique avec Codex ou la question de consentement avec les autres outils.

L’amorçage doit aboutir à un état de travail comprenant :
- projet identifié ou niveau transverse confirmé ;
- objectif reformulé ;
- références chargées ;
- état GitHub vérifié selon le mécanisme réel de la plateforme ;
- mode de livraison et preuve externe attendue définis avant toute modification ;
- risques et contradictions signalés ;
- anomalies, inconnues ou contradictions signalées en une ligne, ou mention `aucune anomalie détectée` ;
- disponibilité pour traiter la demande ;
- régime de mémoire appliqué : activation automatique avec Codex ou consentement ponctuel demandé avec les autres outils.

Ne jamais demander à l’utilisateur d’« activer ProjectOS » lorsque ce fichier a déjà été chargé.
