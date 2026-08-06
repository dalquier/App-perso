export const CODEX_STATUSES = [
  "draft",
  "ready",
  "running",
  "waiting",
  "completed",
  "failed",
  "archived",
] as const;

export type CodexConversationStatus = (typeof CODEX_STATUSES)[number];

export type CodexConversation = {
  id: string;
  name: string;
  status: CodexConversationStatus;
  prompt: string;
  conversationUrl: string | null;
  projectId: string | null;
  createdAt: string;
  updatedAt: string;
  launchedAt: string | null;
};

export type CodexExport = {
  schemaVersion: 1;
  exportedAt: string;
  conversations: CodexConversation[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isIsoDate(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}T/.test(value) &&
    !Number.isNaN(Date.parse(value))
  );
}

function requireString(
  value: unknown,
  field: string,
  { allowEmpty = false }: { allowEmpty?: boolean } = {},
): string {
  if (typeof value !== "string" || (!allowEmpty && !value.trim())) {
    throw new Error(`Conversation importée invalide : ${field}.`);
  }
  return value;
}

export function validateCodexUrl(value: string): string | null {
  if (!value.trim()) return null;
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" && url.hostname === "chatgpt.com"
      ? url.href
      : null;
  } catch {
    return null;
  }
}

export function promptPreview(prompt: string): string {
  return prompt
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 5)
    .join("\n");
}

export function validateConversation(value: CodexConversation): string[] {
  const errors: string[] = [];
  if (!value.name.trim()) errors.push("Le nom est obligatoire.");
  if (!value.prompt.trim()) errors.push("Le prompt est obligatoire.");
  if (!CODEX_STATUSES.includes(value.status)) errors.push("État inconnu.");
  if (value.conversationUrl && !validateCodexUrl(value.conversationUrl)) {
    errors.push("Le lien doit être une URL HTTPS sur chatgpt.com.");
  }
  return errors;
}

export function parseCodexConversation(raw: unknown): CodexConversation {
  if (!isRecord(raw)) {
    throw new Error("Conversation importée invalide : objet attendu.");
  }

  const id = requireString(raw.id, "identifiant manquant").trim();
  const name = requireString(raw.name, "nom manquant");
  const prompt = requireString(raw.prompt, "prompt manquant");

  if (
    typeof raw.status !== "string" ||
    !CODEX_STATUSES.includes(raw.status as CodexConversationStatus)
  ) {
    throw new Error("Conversation importée invalide : état inconnu.");
  }

  let conversationUrl: string | null = null;
  if (raw.conversationUrl !== null) {
    const sourceUrl = requireString(raw.conversationUrl, "lien Codex invalide");
    conversationUrl = validateCodexUrl(sourceUrl);
    if (!conversationUrl) {
      throw new Error(
        "Conversation importée invalide : lien HTTPS chatgpt.com requis.",
      );
    }
  }

  if (raw.projectId !== null && typeof raw.projectId !== "string") {
    throw new Error("Conversation importée invalide : projet associé.");
  }

  if (!isIsoDate(raw.createdAt) || !isIsoDate(raw.updatedAt)) {
    throw new Error("Conversation importée invalide : date invalide.");
  }

  if (raw.launchedAt !== null && !isIsoDate(raw.launchedAt)) {
    throw new Error("Conversation importée invalide : date de lancement.");
  }

  return {
    id,
    name,
    prompt,
    status: raw.status as CodexConversationStatus,
    conversationUrl,
    projectId: raw.projectId as string | null,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    launchedAt: raw.launchedAt as string | null,
  };
}

export function makeCodexExport(
  conversations: CodexConversation[],
): CodexExport {
  return {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    conversations,
  };
}

export function parseCodexExport(raw: unknown): CodexConversation[] {
  if (!isRecord(raw)) throw new Error("Export Codex invalide.");
  if (raw.schemaVersion !== 1 || !Array.isArray(raw.conversations)) {
    throw new Error("Version d’export Codex incompatible.");
  }
  return raw.conversations.map(parseCodexConversation);
}
