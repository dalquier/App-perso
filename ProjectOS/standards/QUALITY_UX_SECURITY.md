# Référentiel qualité, UX et sécurité

## Qualité de code

- modules courts et cohérents ;
- noms explicites ;
- responsabilités uniques ;
- pas de duplication évitable ;
- dépendances justifiées ;
- configuration centralisée ;
- erreurs typées ou structurées ;
- logs utiles sans données sensibles ;
- fonctions testables ;
- commentaires uniquement lorsque la logique ne suffit pas.

## Tests

Priorité : démarrage et arrêt ; sauvegarde et chargement des données ; erreurs critiques ; contrats d’échange ; parcours utilisateur principal ; migrations ; intégrations externes.

Ne pas ajouter de tests décoratifs. Tester les risques réels.

## UX iPhone

Vérifier : clavier ne masquant aucun champ ; vue défilable ; boutons réactifs ; fermeture évidente ; safe areas ; tailles tactiles suffisantes ; lisibilité ; menus natifs ou réellement fonctionnels ; états chargement, vide, succès et erreur ; orientation ; accessibilité ; persistance cohérente.

## WebView

Une WebView ne doit pas devenir un piège plein écran. Prévoir fermeture, navigation contrôlée, retours, délais d’attente et comportement lorsque la page exige une authentification.

## Sécurité

- secrets hors code ;
- validation des entrées ;
- moindre privilège ;
- contrôle des chemins de fichiers ;
- protection contre l’écrasement ;
- sauvegarde avant migration ;
- confirmation des actions destructrices ;
- dépendances maintenues ;
- données personnelles minimisées.

## Critères de livraison

Une version n’est pas terminée si elle ne démarre pas, si le parcours principal est bloqué, si les données peuvent être perdues, si des secrets sont exposés, si la documentation d’exécution manque ou si les tests essentiels n’ont pas été exécutés sans justification.