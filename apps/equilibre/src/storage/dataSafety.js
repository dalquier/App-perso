import { EQUILIBRE_RELEASE } from "../release.js";
import { migrateState, STORAGE_VERSION } from "./localStore.js";

export const PORTABLE_BACKUP_FORMAT = "equilibre-portable-backup";
export const PORTABLE_BACKUP_VERSION = 1;
export const MAX_PORTABLE_BACKUP_BYTES = 5 * 1024 * 1024;

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.keys(value).sort().reduce((result, key) => {
    if (value[key] !== undefined) result[key] = canonicalize(value[key]);
    return result;
  }, {});
}

export function canonicalJson(value) {
  return JSON.stringify(canonicalize(value));
}

async function sha256Hex(value, cryptoRef = globalThis.crypto) {
  if (!cryptoRef?.subtle) throw new Error("Le contrôle d’intégrité SHA-256 n’est pas disponible.");
  const bytes = new TextEncoder().encode(value);
  const digest = await cryptoRef.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

const sortedIds = (items) => items.map((item) => String(item?.id || "")).filter(Boolean).sort();

export function inspectStateInventory(state) {
  const conversations = Array.isArray(state?.conversations) ? state.conversations : [];
  const messages = conversations.flatMap((conversation) => Array.isArray(conversation.messages) ? conversation.messages : []);
  const protocolRuns = Array.isArray(state?.protocolRuns) ? state.protocolRuns : [];
  const sessionRecords = Array.isArray(state?.sessionRecords) ? state.sessionRecords : [];
  const memoryEntries = Array.isArray(state?.memoryEntries) ? state.memoryEntries : [];

  return {
    storageVersion: state?.version ?? null,
    storageRevision: state?.storageRevision ?? null,
    counts: {
      conversations: conversations.length,
      messages: messages.length,
      protocolRuns: protocolRuns.length,
      sessionRecords: sessionRecords.length,
      memoryEntries: memoryEntries.length,
      legacySession: state?.lastSession ? 1 : 0,
    },
    ids: {
      conversations: sortedIds(conversations),
      messages: sortedIds(messages),
      protocolRuns: sortedIds(protocolRuns),
      sessionRecords: sortedIds(sessionRecords),
      memoryEntries: sortedIds(memoryEntries),
      legacySession: state?.lastSession?.id ? [String(state.lastSession.id)] : [],
    },
  };
}

function backupBody({ createdAt, source, inventory, payload }) {
  return {
    format: PORTABLE_BACKUP_FORMAT,
    formatVersion: PORTABLE_BACKUP_VERSION,
    createdAt,
    source,
    inventory,
    payload,
  };
}

export async function createPortableBackup(state, {
  now = new Date(),
  release = EQUILIBRE_RELEASE,
  cryptoRef = globalThis.crypto,
} = {}) {
  const normalized = migrateState(structuredClone(state));
  const {
    storageError: _storageError,
    writesBlocked: _writesBlocked,
    futureStorageActive: _futureStorageActive,
    ...payload
  } = normalized;
  if (payload.version !== STORAGE_VERSION) throw new Error("La sauvegarde exige un état v4 valide.");
  const body = backupBody({
    createdAt: now.toISOString(),
    source: {
      releaseId: release.releaseId,
      storageSchema: release.storageSchema,
      storageRevision: payload.storageRevision,
    },
    inventory: inspectStateInventory(payload),
    payload,
  });
  const digest = await sha256Hex(canonicalJson(body), cryptoRef);
  return { ...body, integrity: { algorithm: "SHA-256", digest } };
}

function serializedByteLength(value) {
  return new TextEncoder().encode(value).byteLength;
}

export async function parsePortableBackup(serialized, {
  cryptoRef = globalThis.crypto,
  maxBytes = MAX_PORTABLE_BACKUP_BYTES,
} = {}) {
  if (typeof serialized !== "string" || !serialized.trim()) throw new Error("Le fichier de sauvegarde est vide.");
  if (serializedByteLength(serialized) > maxBytes) throw new Error("Le fichier de sauvegarde dépasse la taille autorisée.");

  let candidate;
  try {
    candidate = JSON.parse(serialized);
  } catch {
    throw new Error("Le fichier de sauvegarde n’est pas un JSON valide.");
  }
  if (!candidate || Array.isArray(candidate) || typeof candidate !== "object") throw new Error("Format de sauvegarde invalide.");
  if (candidate.format !== PORTABLE_BACKUP_FORMAT || candidate.formatVersion !== PORTABLE_BACKUP_VERSION) {
    throw new Error("Version de sauvegarde non prise en charge.");
  }
  if (candidate.integrity?.algorithm !== "SHA-256" || !/^[0-9a-f]{64}$/.test(candidate.integrity?.digest || "")) {
    throw new Error("Empreinte de sauvegarde invalide.");
  }

  const body = backupBody(candidate);
  const digest = await sha256Hex(canonicalJson(body), cryptoRef);
  if (digest !== candidate.integrity.digest) throw new Error("La sauvegarde a été modifiée ou endommagée.");

  const state = migrateState(candidate.payload);
  if (state.version !== STORAGE_VERSION || candidate.source?.storageSchema !== STORAGE_VERSION) {
    throw new Error("Le schéma de stockage de cette sauvegarde n’est pas compatible.");
  }
  const inventory = inspectStateInventory(state);
  if (canonicalJson(inventory) !== canonicalJson(candidate.inventory)) {
    throw new Error("L’inventaire de la sauvegarde ne correspond pas à son contenu.");
  }
  return { state, inventory, metadata: { createdAt: candidate.createdAt, source: candidate.source } };
}

export function portableBackupFilename(now = new Date()) {
  const timestamp = now.toISOString().replace(/[:.]/g, "-");
  return `equilibre-backup-${timestamp}.json`;
}

export async function deliverPortableBackup(serialized, filename, runtime = globalThis) {
  const options = { type: "application/json" };
  const file = runtime.File ? new runtime.File([serialized], filename, options) : null;
  if (file && runtime.navigator?.share && runtime.navigator?.canShare?.({ files: [file] })) {
    await runtime.navigator.share({ files: [file], title: "Sauvegarde Équilibre" });
    return "shared";
  }

  const blob = file || new runtime.Blob([serialized], options);
  const url = runtime.URL.createObjectURL(blob);
  const anchor = runtime.document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.hidden = true;
  runtime.document.body.append(anchor);
  anchor.click();
  anchor.remove();
  runtime.setTimeout(() => runtime.URL.revokeObjectURL(url), 0);
  return "downloaded";
}
