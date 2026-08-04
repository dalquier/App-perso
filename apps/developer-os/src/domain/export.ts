import {
  PRIORITIES,
  PROJECT_LIMITS,
  SCHEMA_VERSION,
  SOURCE_TYPES,
  STATUSES,
  validateCanonicalSource,
  type Project,
  type SourceType,
} from "./project";

export interface ProjectExport {
  app: "DeveloperOS";
  schemaVersion: number;
  exportedAt: string;
  projects: Project[];
}

export interface ParseExportResult extends ProjectExport {
  warnings: string[];
}

const CANONICAL_KEYS = [
  "id",
  "schemaVersion",
  "name",
  "aliases",
  "status",
  "priority",
  "nextAction",
  "canonicalSourceType",
  "canonicalSource",
  "lastKnownState",
  "isActive",
  "createdAt",
  "updatedAt",
] as const;

const DANGEROUS_KEYS = new Set(["__proto__", "prototype", "constructor"]);
const CANONICAL_KEY_SET = new Set<string>(CANONICAL_KEYS);

const isString = (value: unknown): value is string => typeof value === "string";

function assertPlainObject(
  value: unknown,
  label: string,
): asserts value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} doit être un objet.`);
  }
}

function assertSafeKeys(value: unknown, label: string): void {
  if (!value || typeof value !== "object") return;
  for (const key of Object.keys(value)) {
    if (DANGEROUS_KEYS.has(key))
      throw new Error(`Clé dangereuse refusée dans ${label}.`);
    assertSafeKeys((value as Record<string, unknown>)[key], `${label}.${key}`);
  }
}

function asIsoDate(value: unknown, label: string): string {
  if (!isString(value) || Number.isNaN(Date.parse(value)))
    throw new Error(`${label} doit être une date ISO valide.`);
  return value;
}

export function makeExport(projects: Project[]): ProjectExport {
  return {
    app: "DeveloperOS",
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    projects,
  };
}

export function parseExport(value: unknown): ParseExportResult {
  assertSafeKeys(value, "export");
  assertPlainObject(value, "Le fichier JSON");

  if (
    value.app !== "DeveloperOS" ||
    value.schemaVersion !== SCHEMA_VERSION ||
    !Array.isArray(value.projects)
  ) {
    throw new Error("Format ou version d’export incompatible.");
  }

  const warnings: string[] = [];
  const ids = new Set<string>();
  const projects = value.projects.map((raw, index) =>
    parseProject(raw, index, ids, warnings),
  );

  if (projects.filter((project) => project.isActive).length > 1) {
    throw new Error("L’import contient plusieurs projets actifs.");
  }

  return {
    app: "DeveloperOS",
    schemaVersion: SCHEMA_VERSION,
    exportedAt: asIsoDate(value.exportedAt, "exportedAt"),
    projects,
    warnings,
  };
}

function parseProject(
  raw: unknown,
  index: number,
  ids: Set<string>,
  warnings: string[],
): Project {
  assertPlainObject(raw, `Projet ${index + 1}`);
  const unknownKeys = Object.keys(raw).filter(
    (key) => !CANONICAL_KEY_SET.has(key),
  );
  if (unknownKeys.length)
    warnings.push(
      `Projet ${index + 1}: champs ignorés ${unknownKeys.join(", ")}.`,
    );

  const id = raw.id;
  if (!isString(id) || !id || ids.has(id))
    throw new Error(
      "Un projet importé possède un identifiant invalide ou dupliqué.",
    );
  ids.add(id);

  const name = raw.name;
  if (
    !isString(name) ||
    !name.trim() ||
    name.trim().length > PROJECT_LIMITS.name
  )
    throw new Error("Un projet importé a un nom invalide.");

  const status = raw.status;
  if (!STATUSES.includes(status as never))
    throw new Error("Un projet importé a un état invalide.");

  const priority = raw.priority;
  if (!PRIORITIES.includes(priority as never))
    throw new Error("Un projet importé a une priorité invalide.");

  const canonicalSourceType = raw.canonicalSourceType;
  if (!SOURCE_TYPES.includes(canonicalSourceType as never))
    throw new Error("Un projet importé a un type de source invalide.");

  const aliases = raw.aliases;
  if (
    !Array.isArray(aliases) ||
    aliases.length > PROJECT_LIMITS.aliases ||
    !aliases.every(isString)
  ) {
    throw new Error("Un projet importé a des alias invalides.");
  }

  const canonicalSource = raw.canonicalSource;
  if (
    !isString(canonicalSource) ||
    canonicalSource.length > PROJECT_LIMITS.canonicalSource
  ) {
    throw new Error("Un projet importé a une source invalide.");
  }
  const sourceError = validateCanonicalSource(
    canonicalSourceType as SourceType,
    canonicalSource,
  );
  if (sourceError) throw new Error(sourceError);

  const nextAction = raw.nextAction;
  if (!isString(nextAction) || nextAction.length > PROJECT_LIMITS.nextAction)
    throw new Error("Un projet importé a une prochaine action invalide.");

  const lastKnownState = raw.lastKnownState;
  if (
    !isString(lastKnownState) ||
    lastKnownState.length > PROJECT_LIMITS.lastKnownState
  ) {
    throw new Error("Un projet importé a un dernier état connu invalide.");
  }

  const isActive = raw.isActive;
  if (typeof isActive !== "boolean")
    throw new Error("Un projet importé a un indicateur actif invalide.");
  if (status === "archived" && isActive)
    throw new Error("Un projet archivé ne peut pas être actif.");

  const createdAt = asIsoDate(raw.createdAt, "createdAt");
  const updatedAt = asIsoDate(raw.updatedAt, "updatedAt");
  if (Date.parse(updatedAt) < Date.parse(createdAt))
    throw new Error("updatedAt doit être postérieur ou égal à createdAt.");

  return {
    id,
    schemaVersion: SCHEMA_VERSION,
    name: name.trim(),
    aliases: aliases.map((alias) => alias.trim()).filter(Boolean),
    status: status as Project["status"],
    priority: priority as Project["priority"],
    nextAction,
    canonicalSourceType: canonicalSourceType as Project["canonicalSourceType"],
    canonicalSource: canonicalSource.trim(),
    lastKnownState,
    isActive,
    createdAt,
    updatedAt,
  };
}

export async function parseExportFile(file: File): Promise<ParseExportResult> {
  if (file.size > PROJECT_LIMITS.importBytes) {
    throw new Error(
      `Le fichier d’import dépasse ${PROJECT_LIMITS.importBytes / 1024} Ko.`,
    );
  }
  const text = await readFileText(file);
  return parseExport(JSON.parse(text));
}

function readFileText(file: File): Promise<string> {
  if (typeof file.text === "function") return file.text();
  if (typeof file.arrayBuffer === "function") {
    return file
      .arrayBuffer()
      .then((buffer) => new TextDecoder().decode(buffer));
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () =>
      reject(reader.error ?? new Error("Lecture du fichier impossible."));
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.readAsText(file);
  });
}
