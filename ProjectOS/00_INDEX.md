# ProjectOS — Index canonique

## Autorité et point d’entrée

GitHub `dalquier/App-perso`, branche `main`, est la source de vérité.

- `BOOTSTRAP.md` : chargeur unique.
- `PROJECT_REGISTRY.md` : projets, alias et références canoniques.

## Noyau

- `core/KERNEL.md`
- `core/LIFECYCLE.md`
- `core/DECISION_ENGINE.md`

## Standards transverses

- `standards/TOOLCHAIN_POLICY.md`
- `standards/CREDIT_OPTIMIZATION.md`
- `standards/QUALITY_UX_SECURITY.md`
- `standards/TOOLS_AND_STORAGE.md`
- `standards/CODE_WORK_ROUTING.md`
- `standards/CODEX_NATIVE_PUBLISHING.md`
- `standards/ARTIFACT_DELIVERY_AND_RECOVERY.md`
- `standards/CODING_STANDARDS.md`
- `standards/DOCUMENTATION.md`
- `standards/TESTING.md`
- `standards/AGENT_HANDOFFS.md`
- `standards/CONVERSATION_NAMING.md`
- `standards/CONVERSATION_MEMORY.md`
- `standards/CONVERSATION_ARCHIVE_PIPELINE.md` : capture directe et incrémentale dans Drive.

## Décisions transverses

- `ADR/ADR-001-FRUGAL-DEVELOPMENT-TOOLCHAIN.md`
- `ADR/ADR-002-PERMANENT-CODEX-CONVERSATION-MEMORY.md`
- `ADR/ADR-003-DIRECT-CONVERSATION-ARCHIVING.md`

## Guides et prompts

- `guides/SHORTCUT_AGENT_HANDOFF.md`
- `guides/CONVERSATION_ARCHIVING.md`
- `prompts/MASTER_PROJECT_PROMPT.md`
- `prompts/ACTION_PROMPTS.md`
- `prompts/CODING_PROMPTS.md`

## Modèles

- `templates/PROJECT_MANIFEST.md`
- `templates/DELIVERY_MANIFEST.md`
- `templates/CONVERSATION_INDEX.md`
- `templates/PROJECT_TIMELINE.md`
- `templates/SESSION_SUMMARY.md`
- `templates/CONVERSATION_ARCHIVE_MANIFEST.json.example`

## Stockages

- GitHub : code, règles, ADR, documentation versionnée, index et synthèses conversationnelles.
- Google Drive : transcription visible intégrale, pièces jointes accessibles, livrables générés et manifeste d’archive.
- Working Copy : copie Git locale sur iPhone.
- iCloud Drive : fichiers locaux iPhone ; aucun transit requis pour l’archive conversationnelle.
- Replit Starter : exécution, tests, travail et déploiement ; jamais source canonique.

Une archive conversationnelle facilite la restitution mais ne remplace jamais les références canoniques.
