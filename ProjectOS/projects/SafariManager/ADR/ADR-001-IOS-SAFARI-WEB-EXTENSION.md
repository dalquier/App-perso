# ADR-001 — Safari Web Extension iOS

- **Statut :** accepté pour BUILD-01
- **Date :** 2026-08-06

## Contexte

Safari Manager doit gérer les onglets accessibles sur iPhone, rester conditionnable sans Mac depuis un ZIP textuel et minimiser coûts, permissions et surface de données.

## Décision

Utiliser une Safari Web Extension Manifest Version 3 en HTML, CSS et JavaScript natifs. `browser.tabs` assure inventaire et actions. `browser.windows`, si disponible, est seulement lu après détection de capacité. Un service worker MV3 non persistant est déclaré mais n’héberge aucun traitement BUILD-01. Aucun backend, API distante, télémétrie, donnée personnelle ou dépendance de production n’est introduit.

Les URL sont normalisées uniquement par retrait du fragment, casse du protocole/hôte et retrait des ports web par défaut. Chemin et requête, dont le tracking, sont conservés.

## Conséquences

Le projet reste auditable et conditionnable depuis GitHub Actions. L’accès réel dépend toutefois des permissions Safari et la compatibilité finale doit être vérifiée par Apple et sur iPhone ; le sandbox Codex ne peut pas fournir cette preuve.
