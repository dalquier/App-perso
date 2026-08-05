# Prompt maître — Activation de ProjectOS

Ce document reste un point d’entrée lisible et un mécanisme de secours. La source d’initialisation effective est désormais `ProjectOS/BOOTSTRAP.md`.

## Prompt canonique à copier

```text
Active ProjectOS depuis `dalquier/App-perso`, charge la dernière version de `ProjectOS/BOOTSTRAP.md`, exécute les références qu’il désigne, puis traite ma demande.
```

## Alias historique accepté

```text
Active ProjectOS depuis `dalquier/App-perso`, puis traite ma demande selon le prompt maître.
```

Lorsque cet alias est utilisé, « selon le prompt maître » signifie obligatoirement :

1. consulter la branche `main` du dépôt `dalquier/App-perso` ;
2. charger la dernière version de `ProjectOS/BOOTSTRAP.md` ;
3. exécuter sa séquence de résolution des références ;
4. charger le registre, le noyau, le manifeste, les ADR et les standards pertinents ;
5. charger `ProjectOS/standards/CODEX_NATIVE_PUBLISHING.md` pour toute tâche Codex Cloud ;
6. ne pas utiliser une copie mémorisée lorsqu’une référence vivante est accessible ;
7. traiter ensuite la demande de l’utilisateur selon les documents résolus.

## Mode dégradé

Uniquement si `ProjectOS/BOOTSTRAP.md` ne peut pas être consulté :

- déclarer explicitement que les références vivantes n’ont pas pu être chargées ;
- ne pas prétendre que ProjectOS est complètement initialisé ;
- utiliser les principes généraux connus sans inventer l’état des projets ;
- vérifier GitHub avant toute modification ;
- éviter toute opération destructive ;
- demander ou retrouver l’accès aux références avant une livraison substantielle.

## Principes permanents minimaux

Ces principes servent seulement de filet de sécurité et ne remplacent pas les références vivantes :

- GitHub est la source de vérité du code et des documents versionnés ;
- `dalquier/App-perso` contient les règles ProjectOS ;
- ne jamais travailler directement sur `main` pour une modification substantielle ;
- utiliser une branche dédiée, tester, documenter et ouvrir une Pull Request ;
- Replit Starter est l’environnement cloud par défaut ;
- Pyto reste le compagnon permanent pour les fonctions iPhone natives et locales ;
- Working Copy est le client Git principal sur iPhone ;
- ChatGPT pilote l’architecture et Codex les changements importants ;
- dans Codex Cloud, le sandbox terminal peut ne pas exposer de remote, d’upstream ou de credentials Git ; la tâche produit le diff et l’interface Codex publie ensuite la branche et la Pull Request ;
- ne jamais exiger de jeton GitHub dans un prompt Codex Cloud ;
- l’API OpenAI est réservée aux applications créées ;
- Google Drive sert aux documents collaboratifs et sauvegardes, jamais comme source de vérité principale ;
- ne jamais exposer de secret, token, mot de passe ou clé API.
