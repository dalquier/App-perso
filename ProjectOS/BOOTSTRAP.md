# ProjectOS — BOOTSTRAP

Point d’entrée unique et stable de ProjectOS. Les instructions du projet ChatGPT doivent uniquement demander de charger ce fichier dans sa version la plus récente.

## 1. Principes d’amorçage

- GitHub `dalquier/App-perso`, branche `main`, est la source de vérité de ProjectOS.
- Ne jamais substituer une copie mémorisée à une référence vivante accessible.
- Charger uniquement les références utiles à la demande, après le socle obligatoire.
- Signaler toute référence absente, inaccessible, contradictoire ou manifestement obsolète.
- La politique de toolchain frugale est permanente : ChatGPT et Codex réalisent le développement ; Replit Starter est réservé à l’exécution, aux tests, au stockage de travail et au déploiement.

## 2. Séquence obligatoire

1. Charger `ProjectOS/00_INDEX.md`.
2. Charger `ProjectOS/PROJECT_REGISTRY.md`.
3. Charger le socle :
   - `ProjectOS/core/KERNEL.md` ;
   - `ProjectOS/core/LIFECYCLE.md` ;
   - `ProjectOS/core/DECISION_ENGINE.md`.
4. Charger `ProjectOS/standards/TOOLCHAIN_POLICY.md` pour toute demande liée à un projet logiciel.
5. Identifier le projet, l’objectif réel et le résultat attendu.
6. Résoudre le projet dans `PROJECT_REGISTRY.md`.
7. Charger son `PROJECT_MANIFEST.md`, s’il existe.
8. Charger les ADR applicables et uniquement la documentation nécessaire.
9. Charger les standards transverses pertinents : qualité, outils, code, documentation et tests.
10. Vérifier l’état vivant des dépôts, branches, Pull Requests, fichiers et exécutions concernés.
11. Consulter Google Drive uniquement pour les ressources explicitement référencées ou nécessaires.
12. Présenter brièvement l’état vérifié, les inconnues et les contradictions avant une modification importante.
13. Exécuter la méthode ProjectOS jusqu’à la livraison ou au meilleur résultat vérifiable possible.

## 3. Ordre d’autorité

1. Instruction explicite de Damien dans la conversation active.
2. Contraintes de sécurité et règles de la plateforme.
3. `PROJECT_MANIFEST.md` du projet concerné.
4. ADR applicables et décisions versionnées.
5. Règles transverses de ProjectOS.
6. Documentation versionnée du projet.
7. Documentation collaborative explicitement référencée sur Google Drive.
8. Copies locales iCloud et historique conversationnel.

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
- le manifeste du projet concerné, lorsqu’il existe.

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
- distinguer faits vérifiés, hypothèses et informations manquantes.

Si une référence est modifiée pendant la conversation, recharger sa dernière version avant toute décision dépendante.

## 7. Sortie d’amorçage

L’amorçage doit aboutir à un état de travail comprenant :
- projet identifié ou niveau transverse confirmé ;
- objectif reformulé ;
- références chargées ;
- état GitHub vérifié ;
- risques et contradictions signalés ;
- prochaine action déterminée.

Ne jamais demander à l’utilisateur d’« activer ProjectOS » lorsque ce fichier a déjà été chargé.