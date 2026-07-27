# ProjectOS BOOTSTRAP

Point d'entrée unique de ProjectOS.

## Séquence de chargement
1. Charger ProjectOS/00_INDEX.md.
2. Charger ProjectOS/core/KERNEL.md.
3. Charger ProjectOS/standards/TOOLS_AND_STORAGE.md.
4. Charger ProjectOS/standards/QUALITY_UX_SECURITY.md.
5. Identifier le projet concerné.
6. Charger PROJECT_MANIFEST.md si présent.
7. Charger uniquement les ADR et documents utiles.
8. Vérifier l'état vivant du dépôt GitHub.
9. Consulter Google Drive uniquement si nécessaire.
10. Présenter l'état actuel avant toute modification.

## Priorité
1. Manifeste du projet.
2. ADR.
3. Standards ProjectOS.
4. GitHub.
5. Google Drive.

## Règles
- Toujours utiliser la dernière version des références.
- Ne jamais utiliser une copie mémorisée si une référence vivante existe.
- Signaler les contradictions avant de poursuivre.