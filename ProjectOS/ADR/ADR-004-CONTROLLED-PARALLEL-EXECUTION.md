# ADR-004 — Exécution parallèle contrôlée

- **Statut :** proposé
- **Date :** 2026-08-06

## Contexte

Certaines demandes ProjectOS contiennent plusieurs travaux indépendants pouvant être menés simultanément. Une exécution strictement séquentielle ralentit alors inutilement la livraison. À l’inverse, une parallélisation implicite peut créer des conflits de fichiers ou de branches, dupliquer le travail, augmenter les coûts IA et rendre la réconciliation incertaine.

Le régime de mémoire conversationnelle impose en outre une question de consentement prioritaire au démarrage des conversations ChatGPT. Les messages intermédiaires de progression utilisent un format strict limité au temps restant.

## Décision

ProjectOS distingue deux régimes :

1. les lectures et vérifications internes sans effet de bord peuvent être parallélisées automatiquement ;
2. les flux visibles impliquant plusieurs tâches, agents, conversations, branches ou livrables nécessitent l’autorisation préalable de Damien par la question exacte :

```text
Cette demande comporte des actions indépendantes. Les paralléliser ?
```

La question est une réponse décisionnelle dédiée, distincte d’un message de progression. Dans une nouvelle conversation ChatGPT, elle n’est posée qu’après résolution du consentement mémoire.

La parallélisation visible exige des flux autonomes, des branches, fichiers et ressources mutables exclusifs, un coût marginal proportionné, des canaux de livraison vérifiables et un coordinateur chargé de la réconciliation.

## Conséquences

### Positives

- réduction du délai lorsque les travaux sont réellement indépendants ;
- contrôle explicite conservé par Damien ;
- prévention des conflits de fichiers, branches et Pull Requests ;
- meilleure lisibilité des rôles, livrables et critères d’acceptation ;
- limitation des duplications et du gaspillage de crédits.

### Contraintes

- coût de coordination supplémentaire ;
- obligation de définir les dépendances et le coordinateur avant lancement ;
- interdiction de paralléliser un diagnostic avec sa correction ou plusieurs agents sur le même périmètre ;
- absence de préférence permanente automatique sans nouvelle décision versionnée.

## Alternatives écartées

- **Paralléliser automatiquement tous les travaux indépendants :** contrôle utilisateur insuffisant et risque de consommation excessive.
- **Toujours rester séquentiel :** perte de temps injustifiée pour les flux véritablement autonomes.
- **Présenter systématiquement un plan détaillé avant la question :** friction excessive ; le détail reste disponible sur demande.

## Retour arrière

Annuler la Pull Request introduisant le standard et ses références. Après intégration, cette ADR peut être marquée remplacée par une décision ultérieure, mais ne doit pas être supprimée sans décision versionnée.