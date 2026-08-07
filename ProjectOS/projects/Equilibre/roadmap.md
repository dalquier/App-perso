# Équilibre — Roadmap

## Vague 0 — Fondation canonique

Objectif : unifier le projet, formaliser les décisions de base et préparer le travail parallèle.

Statut : terminé.

## BUILD-01 — Socle PWA

Statut : intégré.

Livré : dossier applicatif canonique, shell PWA, persistance locale contrôlée, séance guidée historique, réglages et garde-fou sensible.

## BUILD-02 — Conversation écrite

Statut : intégré et validé.

Livré : chat persistant, streaming local, reprise, modes conversationnels, migration versionnée, confidentialité, interruption et isolation des générations. Référence d'intégration : PR #29, commit `b115989fadd0f3e9f6b503c1b933df4d2b179827`.

## BUILD-03 — Séances et mémoire contrôlée

Statut : intégré.

Livré : `sessionRecords`, résumé déterministe, plan d'action et mémoire locale proposée, confirmable, corrigeable et supprimable. Référence : PR #53.

## BUILD-04 — Protocoles versionnés et sécurité transversale

Statut : en validation avant intégration finale.

Périmètre :

- exactement deux protocoles publics versionnés ;
- moteur `ProtocolRun` déterministe ;
- stockage v4 avec migration, backups, rollback et anti-résurrection ;
- garde-fou avant mutation et effets métier ;
- UI Protocoles iPhone ;
- proposition mémoire toujours explicite ;
- service worker hors ligne renforcé ;
- compatibilité séance BUILD-01 conservée sans troisième protocole.

État de réalisation :

- lots domaine et stockage A+B convergés et validés ;
- C1 UI validé séparément ;
- C2 intégration sécurité/mémoire validé séparément ;
- convergence C1+C2 en cours sur branche dédiée ;
- C3 service worker/documentation réalisé en parallèle ;
- recettes Replit et iPhone finales à exécuter sur le SHA convergé final.

Critères de clôture :

1. C1+C2+C3 convergés sans perte fonctionnelle ;
2. suite automatisée complète verte ;
3. build Vite et ProjectOS Quality verts ;
4. migration v3→v4 et rollback vérifiés ;
5. recette Replit sans IA exécutée ;
6. recette iPhone Safari + PWA exécutée ;
7. hors ligne, VoiceOver, clavier et safe areas vérifiés ;
8. absence de secret/donnée personnelle réelle ;
9. risques résiduels documentés ;
10. seulement ensuite, PR finale vers `main` et intégration.

## Après BUILD-04

Le jalon suivant sera cadré après clôture de BUILD-04. La voix, la dictée, un fournisseur OpenAI réel, les embeddings et toute synchronisation distante restent hors BUILD-04 et ne doivent pas être anticipés dans sa livraison.

## Règle de passage

Chaque jalon nécessite des critères d'acceptation vérifiés, des risques documentés et une livraison traçable par Pull Request. Une preuve déclarée ne remplace pas une preuve réellement observée.
