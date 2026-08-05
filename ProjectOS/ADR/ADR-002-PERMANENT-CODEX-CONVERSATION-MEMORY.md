# ADR-002 — Consentement permanent à la mémoire des conversations Codex

- Statut : accepté
- Date : 2026-08-05
- Portée : ProjectOS transverse

## Contexte

Le régime initial imposait une demande de consentement au démarrage de chaque conversation ProjectOS. Damien souhaite désormais que toutes les conversations exécutées avec Codex soient enregistrées afin d’assurer une continuité systématique des travaux, décisions, branches, Pull Requests et validations.

L’historique conversationnel reste une source secondaire. GitHub, les manifestes, les ADR, la documentation canonique et les preuves d’exécution conservent leur autorité.

## Décision

Un consentement permanent, explicite et révocable est établi pour toutes les conversations ProjectOS exécutées avec Codex à compter du 5 août 2026.

Chaque conversation Codex ProjectOS :

1. active automatiquement la mémoire structurée sans redemander de consentement ;
2. reçoit un identifiant `SES-AAAAMMJJ-NNN` ;
3. est inscrite dans l’index du projet concerné ou, à défaut, dans l’index transverse ProjectOS ;
4. produit une synthèse lorsqu’elle contient un élément structurant ;
5. met à jour la chronologie uniquement en cas d’événement structurant ;
6. transfère les décisions durables dans les références canoniques ;
7. exclut secrets, données sensibles inutiles et verbatim médical brut.

## Limites

Le consentement permanent couvre les index, chronologies et synthèses structurées versionnées. Il ne garantit pas l’export automatique du verbatim intégral de l’interface Codex. Une archive brute reste facultative, secondaire et marquée `non demandée`, `à exporter`, `archivée` ou `indisponible`.

Les conversations ChatGPT ou d’autres outils restent soumises au consentement ponctuel tant qu’aucune autre décision versionnée ne les couvre.

## Révocabilité et suppression

Damien peut révoquer ce consentement permanent à tout moment. La révocation s’applique aux nouvelles conversations dès sa formulation et doit être versionnée. La suppression rétroactive d’index ou de synthèses nécessite une demande explicite afin d’éviter une perte involontaire de traçabilité.

## Conséquences

- Le démarrage Codex devient plus fluide et la continuité systématique.
- ProjectOS doit maintenir des index et synthèses proportionnés, sélectifs et non sensibles.
- L’absence de capacité d’export brut ne bloque pas l’enregistrement structuré.
- La mémoire ne constitue jamais une preuve suffisante qu’un changement existe dans GitHub.
