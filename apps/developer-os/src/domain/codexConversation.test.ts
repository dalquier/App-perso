import { describe, expect, it } from "vitest";
import {
  parseCodexExport,
  promptPreview,
  validateCodexUrl,
  validateConversation,
  type CodexConversation,
} from "./codexConversation";

const conversation: CodexConversation = {
  id: "test",
  name: "Essai",
  status: "draft",
  prompt: "contenu factice",
  conversationUrl: null,
  projectId: null,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
  launchedAt: null,
};

function exported(value: unknown) {
  return {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    conversations: [value],
  };
}

describe("Codex conversation", () => {
  it("valide le modèle", () => {
    expect(validateConversation(conversation)).toEqual([]);
  });

  it("extrait exactement cinq lignes non vides", () => {
    expect(promptPreview(" un\n\n deux\n trois\nquatre\ncinq\nsix")).toBe(
      "un\ndeux\ntrois\nquatre\ncinq",
    );
  });

  it("valide seulement chatgpt.com en HTTPS", () => {
    expect(validateCodexUrl("https://chatgpt.com/codex/example")).toContain(
      "chatgpt.com",
    );
    expect(validateCodexUrl("javascript:alert(1)")).toBeNull();
    expect(validateCodexUrl("https://evil.example")).toBeNull();
  });

  it("rejette un objet sans nom avec une erreur métier", () => {
    const withoutName: Partial<CodexConversation> = { ...conversation };
    delete withoutName.name;
    expect(() => parseCodexExport(exported(withoutName))).toThrow(
      "nom manquant",
    );
  });

  it("rejette une date invalide", () => {
    expect(() =>
      parseCodexExport(exported({ ...conversation, updatedAt: "demain" })),
    ).toThrow("date invalide");
  });

  it("rejette un statut inconnu", () => {
    expect(() =>
      parseCodexExport(exported({ ...conversation, status: "mystery" })),
    ).toThrow("état inconnu");
  });

  it("rejette une URL dangereuse", () => {
    expect(() =>
      parseCodexExport(
        exported({ ...conversation, conversationUrl: "javascript:alert(1)" }),
      ),
    ).toThrow("lien HTTPS chatgpt.com requis");
  });
});
