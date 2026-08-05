# Handoff temporaire — Équilibre BUILD-02

- Projet : equilibre / Équilibre
- Branche logique : equilibre/build-02-persistent-conversations
- Objectif : conversation écrite persistante locale multi-conversations.
- État initial : sandbox sans remote visible ; branche locale `work`, puis branche dédiée créée localement ; `apps/equilibre/` existant inventorié.
- Références consultées : BOOTSTRAP, manifeste, master build prompt, roadmap, contrat parallèle, ADR Équilibre, standards ProjectOS code/tests/qualité/sécurité/handoff.
- Changements : domaine conversation, stockage v2 avec migration BUILD-01, fournisseur progressif local annulable, UI historique/renommage/suppression/modes, docs BUILD-02.
- Tests : `npm test` 24/24 ; `npm run build` réussi.
- Limites : publication PR non réalisable depuis le terminal sans remote ni outil `make_pr` disponible ; utiliser publication native Codex si disponible.
- Risques : recette iPhone réelle non exécutée dans le sandbox ; streaming réel OpenAI hors périmètre.
- Retour arrière : revert du commit BUILD-02 ; données locales effaçables via réglages.
