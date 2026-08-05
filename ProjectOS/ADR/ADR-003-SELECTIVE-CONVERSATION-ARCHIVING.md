# ADR-003 — Archivage sélectif des conversations ProjectOS sur Google Drive

- Statut : accepté
- Date : 2026-08-05
- Portée : ProjectOS transverse

## Contexte

La mémoire structurée ProjectOS permet une recherche rapide dans GitHub, mais le verbatim et les pièces jointes peuvent occuper beaucoup d’espace et n’ont pas vocation à être versionnés. Damien souhaite conserver uniquement les conversations ChatGPT et Codex qu’il a choisi d’enregistrer dans ProjectOS, avec leurs fichiers associés, sans archiver l’ensemble de son compte OpenAI.

## Décision

1. GitHub conserve la mémoire légère et recherchable : index, chronologie, synthèses, décisions durables, statut et référence de l’archive.
2. Google Drive conserve les archives disponibles des conversations ProjectOS enregistrées : verbatim exporté, pièces jointes, livrables non canoniques et manifeste d’intégrité.
3. iCloud Drive sert uniquement de boîte d’entrée ou de transit.
4. Les fichiers canoniques de projet restent dans GitHub, même s’ils ont été joints à une conversation.
5. Aucune collecte globale des conversations OpenAI n’est réalisée.
6. L’identifiant de session relie les trois espaces.
7. Une archive n’est `vérifiée` qu’après contrôle de son accès privé, de son inventaire, de sa taille et de son empreinte lorsque celle-ci est applicable.
8. Aucune copie de transit n’est supprimée avant cette vérification et sans action explicite.

## Organisation cible

```text
Google Drive/App-perso/ProjectOS/Conversation-Archives/
└── <Projet>/<AAAA>/<Session-ID>/
    ├── MANIFEST.json
    ├── SESSION_SUMMARY.md
    ├── conversation.<format>
    ├── attachments/
    └── deliverables/
```

Le contenu dépend de ce que ChatGPT, Codex ou l’environnement d’exécution permet réellement d’exporter.

## Limites

- L’automatisation ne garantit pas l’export du verbatim ou des pièces jointes non exposées par la plateforme.
- Une archive peut donc être `partielle` ou `indisponible` sans invalider la mémoire structurée.
- Google Drive n’est pas la source de vérité du code ou de la documentation canonique.
- Aucun lien public ne doit être créé.
- L’archive ne doit contenir ni secret ni donnée sensible inutile.

## Conséquences

- GitHub reste léger et directement interrogeable.
- Les éléments volumineux restent accessibles sur Drive lorsque leur export est possible.
- La récupération suit un parcours progressif : index, synthèse, références canoniques, puis archive Drive si nécessaire.
- Les relations entre espaces sont vérifiables sans synchronisation bidirectionnelle.
