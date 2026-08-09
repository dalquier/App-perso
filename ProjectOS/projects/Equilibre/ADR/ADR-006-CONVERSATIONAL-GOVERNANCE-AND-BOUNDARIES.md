# ADR-006 — Gouvernance et frontières conversationnelles

- Statut : accepté
- Date : 2026-08-09
- Référence : `../docs/CONVERSATIONAL_ARCHITECTURE_CONVERGENCE.md`

## Contexte

Équilibre dispose de conversations locales, de protocoles courts versionnés, d'une mémoire explicitement contrôlée et de gates de sécurité. Les évolutions prévues ajoutent un modèle OpenAI réel, des séances longues, un contexte mémoire et la voix. Sans frontières communes, ces capacités pourraient créer plusieurs moteurs concurrents ou donner au modèle une autorité clinique et métier indue.

## Décision

1. Équilibre est un compagnon d'auto-accompagnement structuré inspiré des TCC, jamais un thérapeute, un outil de diagnostic ou une autorité clinique.
2. Le rôle conversationnel est une politique versionnée, indépendante du modèle et non modifiable par les contenus utilisateur.
3. L'application reste seule autorité sur sécurité, transitions, persistance, mémoire, protocoles, séances et effets métier.
4. Le modèle génératif est un fournisseur non souverain. Ses sorties sont non fiables jusqu'à validation.
5. La sécurité déterministe s'exécute avant tout envoi au provider et avant toute mutation métier.
6. Une mémoire durable reste proposée, explicable, validable, corrigeable, désactivable et supprimable. Le LLM ne l'écrit jamais directement.
7. Les messages originaux restent distincts des synthèses, hypothèses, anchors et mémoires.
8. Les protocoles courts et les séances longues partagent une famille de run mais utilisent des moteurs séparés.
9. Le moteur structuré local est validé avant tout dialogue de séance semi-structuré.
10. Le backend distant est une passerelle d'inférence sécurisée sans persistance conversationnelle utilisateur.
11. Le texte accepté est l'état conversationnel canonique. La voix est une modalité d'entrée/sortie et ne possède aucune logique métier.
12. Les scénarios, rubriques, baselines et gates d'évaluation appartiennent à Équilibre et restent indépendants du fournisseur.

## Conséquences

- `ClinicalRolePolicy`, `SafetyDecision`, `ContextPackage`, interfaces provider et contrats de séance sont versionnés séparément du choix du modèle.
- Toute sortie structurée est un candidat sans effet direct.
- Le backend ne journalise ni conversation, ni mémoire, ni prompt, ni réponse.
- Le stockage local reste la source de vérité utilisateur jusqu'à décision contraire explicite.
- Une évolution de modèle ne change jamais silencieusement la doctrine clinique.
- La voix progresse par dictée, lecture, tour par tour puis temps réel autour du même moteur.
- Les domaines RPS, rechute et autres usages renforcés restent différés jusqu'aux revues safety et evals dédiées.

## Alternatives rejetées

- prompt thérapeutique accompagné d'un disclaimer ;
- stockage conversationnel canonique chez OpenAI ;
- mémoire durable écrite par le modèle ;
- extension du moteur court en moteur universel ;
- speech-to-speech direct comme second orchestrateur ;
- structured output appliqué directement comme mutation métier.

## Retour arrière

Cette ADR gouverne des frontières et n'impose aucune dépendance technique. Une évolution peut la remplacer par une nouvelle ADR, à condition de démontrer une sécurité, une autonomie utilisateur, une confidentialité et une traçabilité au moins équivalentes.
