export const CODEX_STATUSES = ["draft", "ready", "running", "waiting", "completed", "failed", "archived"] as const;
export type CodexConversationStatus = (typeof CODEX_STATUSES)[number];
export type CodexConversation = {
  id: string; name: string; status: CodexConversationStatus; prompt: string;
  conversationUrl: string | null; projectId: string | null;
  createdAt: string; updatedAt: string; launchedAt: string | null;
};

export function validateCodexUrl(value: string): string | null {
  if (!value.trim()) return null;
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" && url.hostname === "chatgpt.com" ? url.href : null;
  } catch { return null; }
}

export function promptPreview(prompt: string): string {
  return prompt.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).slice(0, 5).join("\n");
}

export function validateConversation(value: CodexConversation): string[] {
  const errors: string[] = [];
  if (!value.name.trim()) errors.push("Le nom est obligatoire.");
  if (!value.prompt.trim()) errors.push("Le prompt est obligatoire.");
  if (!CODEX_STATUSES.includes(value.status)) errors.push("État inconnu.");
  if (value.conversationUrl && !validateCodexUrl(value.conversationUrl)) errors.push("Le lien doit être une URL HTTPS sur chatgpt.com.");
  return errors;
}

export type CodexExport = { schemaVersion: 1; exportedAt: string; conversations: CodexConversation[] };
export function makeCodexExport(conversations: CodexConversation[]): CodexExport {
  return { schemaVersion: 1, exportedAt: new Date().toISOString(), conversations };
}
export function parseCodexExport(raw: unknown): CodexConversation[] {
  if (!raw || typeof raw !== "object") throw new Error("Export Codex invalide.");
  const data = raw as Partial<CodexExport>;
  if (data.schemaVersion !== 1 || !Array.isArray(data.conversations)) throw new Error("Version d’export Codex incompatible.");
  for (const item of data.conversations) if (validateConversation(item).length) throw new Error("Une conversation importée est invalide.");
  return data.conversations;
}
