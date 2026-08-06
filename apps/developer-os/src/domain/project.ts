export const SCHEMA_VERSION = 1;

export const STATUSES = [
  "idea",
  "active",
  "blocked",
  "paused",
  "review",
  "completed",
  "archived",
] as const;

export const PRIORITIES = ["low", "normal", "high", "critical"] as const;

export const SOURCE_TYPES = [
  "github_repo",
  "github_path",
  "local_folder",
  "replit",
  "other",
] as const;

export const PROJECT_LIMITS = {
  importBytes: 512 * 1024,
  name: 120,
  alias: 80,
  aliases: 12,
  nextAction: 1_000,
  canonicalSource: 500,
  lastKnownState: 2_000,
} as const;

export type ProjectStatus = (typeof STATUSES)[number];
export type Priority = (typeof PRIORITIES)[number];
export type SourceType = (typeof SOURCE_TYPES)[number];

export interface Project {
  id: string;
  schemaVersion: number;
  name: string;
  aliases: string[];
  status: ProjectStatus;
  priority: Priority;
  nextAction: string;
  canonicalSourceType: SourceType;
  canonicalSource: string;
  lastKnownState: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ProjectDraft = Omit<
  Project,
  "id" | "schemaVersion" | "createdAt" | "updatedAt"
>;

const DANGEROUS_SOURCE_PROTOCOLS = /^(javascript|data|vbscript):/i;
function hasControlChars(value: string): boolean {
  return Array.from(value).some(
    (char) => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127,
  );
}
const GITHUB_REPO = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
const GITHUB_PATH =
  /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\/(blob|tree)\/[A-Za-z0-9_./-]+$/;
const LOCAL_EXECUTABLE = /\.(app|command|exe|bat|cmd|com|ps1|scr|sh)$/i;

export const emptyDraft = (): ProjectDraft => ({
  name: "",
  aliases: [],
  status: "idea",
  priority: "normal",
  nextAction: "",
  canonicalSourceType: "github_repo",
  canonicalSource: "dalquier/App-perso",
  lastKnownState: "",
  isActive: false,
});

export function validateCanonicalSource(
  type: SourceType,
  rawSource: string,
): string | null {
  const source = String(rawSource).trim();
  if (!source) return null;
  if (hasControlChars(source))
    return "La source contient un caractère de contrôle interdit.";
  if (DANGEROUS_SOURCE_PROTOCOLS.test(source))
    return "Le protocole de cette source est interdit.";

  let url: URL | null = null;
  try {
    url = new URL(source);
  } catch {
    url = null;
  }

  if (url) {
    if (url.protocol !== "https:")
      return "Seules les URL HTTPS sont acceptées.";
    if (url.username || url.password)
      return "Les URL avec identifiants intégrés sont refusées.";
  }

  if (type === "github_repo") {
    if (url) {
      if (
        url.hostname !== "github.com" ||
        url.pathname.split("/").filter(Boolean).length !== 2
      ) {
        return "La source GitHub doit viser un dépôt sous la forme owner/repo ou https://github.com/owner/repo.";
      }
      return null;
    }
    return GITHUB_REPO.test(source)
      ? null
      : "Le dépôt GitHub doit être au format owner/repo.";
  }

  if (type === "github_path") {
    if (url) {
      if (
        url.hostname !== "github.com" ||
        !/(\/blob\/|\/tree\/)/.test(url.pathname)
      ) {
        return "Le chemin GitHub doit être une URL HTTPS GitHub /blob/ ou /tree/.";
      }
      return null;
    }
    return GITHUB_PATH.test(source)
      ? null
      : "Le chemin GitHub doit documenter owner/repo/blob|tree/ref/path.";
  }

  if (type === "local_folder") {
    if (url)
      return "Un dossier local doit être renseigné comme texte ou chemin local, pas comme URL.";
    if (LOCAL_EXECUTABLE.test(source))
      return "La source locale ne doit pas pointer vers un fichier exécutable.";
    return null;
  }

  if (type === "replit") {
    if (url && !/(^|\.)replit\.(com|app|dev)$/.test(url.hostname)) {
      return "La source Replit doit être une URL HTTPS Replit ou une référence textuelle.";
    }
    return null;
  }

  return null;
}

export function validateDraft(draft: ProjectDraft): Record<string, string> {
  const errors: Record<string, string> = {};
  const name = draft.name.trim();

  if (!name) errors.name = "Le nom est obligatoire.";
  if (name.length > PROJECT_LIMITS.name)
    errors.name = `Le nom ne peut pas dépasser ${PROJECT_LIMITS.name} caractères.`;
  if (draft.aliases.length > PROJECT_LIMITS.aliases)
    errors.aliases = `Maximum ${PROJECT_LIMITS.aliases} alias.`;
  if (draft.aliases.some((alias) => alias.length > PROJECT_LIMITS.alias))
    errors.aliases = `Chaque alias est limité à ${PROJECT_LIMITS.alias} caractères.`;
  if (draft.nextAction.length > PROJECT_LIMITS.nextAction)
    errors.nextAction = `La prochaine action est limitée à ${PROJECT_LIMITS.nextAction} caractères.`;
  if (draft.lastKnownState.length > PROJECT_LIMITS.lastKnownState)
    errors.lastKnownState = `Le dernier état connu est limité à ${PROJECT_LIMITS.lastKnownState} caractères.`;
  if (draft.canonicalSource.length > PROJECT_LIMITS.canonicalSource)
    errors.canonicalSource = `La source ne peut pas dépasser ${PROJECT_LIMITS.canonicalSource} caractères.`;

  const sourceError = validateCanonicalSource(
    draft.canonicalSourceType,
    draft.canonicalSource,
  );
  if (sourceError) errors.canonicalSource = sourceError;

  if (draft.status === "archived" && draft.isActive) {
    errors.isActive = "Un projet archivé ne peut pas être le projet actif.";
  }

  return errors;
}

export function createProject(
  draft: ProjectDraft,
  now = new Date().toISOString(),
): Project {
  return {
    id: crypto.randomUUID(),
    schemaVersion: SCHEMA_VERSION,
    name: draft.name.trim(),
    aliases: draft.aliases.map((alias) => alias.trim()).filter(Boolean),
    status: draft.status,
    priority: draft.priority,
    nextAction: String(draft.nextAction),
    canonicalSourceType: draft.canonicalSourceType,
    canonicalSource: String(draft.canonicalSource).trim(),
    lastKnownState: String(draft.lastKnownState),
    isActive: draft.status === "archived" ? false : draft.isActive,
    createdAt: now,
    updatedAt: now,
  };
}
