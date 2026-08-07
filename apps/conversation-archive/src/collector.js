import { createHash, randomUUID } from "node:crypto";
import { createWriteStream } from "node:fs";
import { access, mkdir, readFile, rename, rm } from "node:fs/promises";
import { basename, dirname, extname, join } from "node:path";
import { pipeline } from "node:stream/promises";
import { Readable, Transform } from "node:stream";
import { atomicWriteJson } from "./atomic.js";

const REDIRECT_CODES = new Set([301, 302, 303, 307, 308]);
const RETRYABLE_CODES = new Set([408, 425, 429, 500, 502, 503, 504]);
const REFRESHABLE_CODES = new Set([401, 403]);
const FINAL_DOWNLOAD_STATES = new Set([
  "buffered",
  "drive_pending",
  "drive_uploaded",
  "drive_verified"
]);

export const FILE_STATUSES = Object.freeze([
  "detected",
  "download_started",
  "retrying",
  "buffered",
  "drive_pending",
  "drive_uploaded",
  "drive_verified",
  "missing",
  "failed"
]);

export class CollectorError extends Error {
  constructor(code, message, options = {}) {
    super(message, options);
    this.name = "CollectorError";
    this.code = code;
    this.retryable = Boolean(options.retryable);
    this.httpStatus = options.httpStatus;
  }
}

function safeId(value) {
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,127}$/.test(value)) {
    throw new CollectorError("INVALID_SOURCE_ID", "sourceId must be a safe, stable identifier");
  }
  return value;
}

export function sanitizeFilename(value, fallback = "download.bin") {
  const leaf = basename(String(value || ""))
    .normalize("NFKC")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/[\\/:*?"<>|]/g, "_")
    .replace(/^\.+/, "")
    .trim();
  const candidate = leaf || fallback;
  return candidate.slice(0, 180) || fallback;
}

function filenameFromDisposition(value) {
  if (!value) return undefined;
  const utf8 = /filename\*=UTF-8''([^;]+)/i.exec(value);
  if (utf8) {
    try {
      return decodeURIComponent(utf8[1].trim());
    } catch {
      return utf8[1].trim();
    }
  }
  const plain = /filename="?([^";]+)"?/i.exec(value);
  return plain?.[1]?.trim();
}

function normalizeMime(value) {
  return String(value || "application/octet-stream")
    .split(";", 1)[0]
    .trim()
    .toLowerCase();
}

function isAllowedMime(mime, allowedMimeTypes) {
  if (!allowedMimeTypes?.length) return true;
  return allowedMimeTypes.some((allowed) => {
    const normalized = normalizeMime(allowed);
    return normalized.endsWith("/*")
      ? mime.startsWith(normalized.slice(0, -1))
      : mime === normalized;
  });
}

function validateUrl(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new CollectorError("INVALID_URL", "URL is invalid");
  }
  if (!new Set(["http:", "https:"]).has(url.protocol)) {
    throw new CollectorError("INVALID_URL_PROTOCOL", "Only HTTP(S) URLs are accepted");
  }
  return url;
}

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function loadJson(path) {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return undefined;
    throw error;
  }
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function errorForHttp(response) {
  return new CollectorError(
    `HTTP_${response.status}`,
    `Download failed with HTTP ${response.status}`,
    { retryable: RETRYABLE_CODES.has(response.status), httpStatus: response.status }
  );
}

export class FileCollector {
  constructor({
    rootDir,
    fetchImpl = globalThis.fetch,
    timeoutMs = 15_000,
    maxBytes = 100 * 1024 * 1024,
    maxRedirects = 4,
    maxAttempts = 3,
    retryBaseMs = 100,
    now = () => new Date()
  }) {
    if (!rootDir) throw new TypeError("rootDir is required");
    if (typeof fetchImpl !== "function") throw new TypeError("fetch is unavailable");
    this.rootDir = rootDir;
    this.fetchImpl = fetchImpl;
    this.timeoutMs = timeoutMs;
    this.maxBytes = maxBytes;
    this.maxRedirects = maxRedirects;
    this.maxAttempts = maxAttempts;
    this.retryBaseMs = retryBaseMs;
    this.now = now;
  }

  pathsFor(sourceId) {
    const id = safeId(sourceId);
    const recordDir = join(this.rootDir, "records", id);
    return {
      recordDir,
      metadataPath: join(recordDir, "metadata.json"),
      payloadDir: join(recordDir, "payload")
    };
  }

  async collect({
    sourceId,
    url,
    originalName,
    expectedMime,
    allowedMimeTypes,
    maxBytes = this.maxBytes,
    refreshUrl
  }) {
    const paths = this.pathsFor(sourceId);
    await mkdir(paths.recordDir, { recursive: true });
    const previous = await loadJson(paths.metadataPath);
    if (
      previous &&
      FINAL_DOWNLOAD_STATES.has(previous.status) &&
      previous.localPath &&
      await exists(previous.localPath)
    ) {
      return { ...previous, idempotentHit: true };
    }

    let currentUrl = validateUrl(url).toString();
    let refreshed = false;
    let lastError;
    let attemptsMade = 0;
    const base = {
      sourceId,
      sourceUrl: currentUrl,
      originalName: originalName || null,
      status: "detected",
      detectedAt: previous?.detectedAt || this.now().toISOString(),
      updatedAt: this.now().toISOString(),
      attempts: previous?.attempts || 0
    };
    await atomicWriteJson(paths.metadataPath, base);

    for (let attempt = 1; attempt <= this.maxAttempts; attempt += 1) {
      attemptsMade = attempt;
      const state = {
        ...base,
        sourceUrl: currentUrl,
        status: attempt === 1 ? "download_started" : "retrying",
        attempts: base.attempts + attempt,
        updatedAt: this.now().toISOString()
      };
      await atomicWriteJson(paths.metadataPath, state);
      try {
        const result = await this.#downloadOnce({
          sourceId,
          url: currentUrl,
          paths,
          originalName,
          expectedMime,
          allowedMimeTypes,
          maxBytes
        });
        const complete = {
          ...state,
          ...result,
          status: "buffered",
          bufferedAt: this.now().toISOString(),
          updatedAt: this.now().toISOString()
        };
        await atomicWriteJson(paths.metadataPath, complete);
        return complete;
      } catch (error) {
        lastError = error;
        const canRefresh =
          !refreshed &&
          typeof refreshUrl === "function" &&
          REFRESHABLE_CODES.has(error.httpStatus);
        if (canRefresh) {
          currentUrl = validateUrl(await refreshUrl({ sourceId, error })).toString();
          refreshed = true;
          continue;
        }
        if (!error.retryable || attempt === this.maxAttempts) break;
        await wait(this.retryBaseMs * 2 ** (attempt - 1));
      }
    }

    const failed = {
      ...base,
      sourceUrl: currentUrl,
      status: lastError?.code === "HTTP_404" ? "missing" : "failed",
      attempts: base.attempts + attemptsMade,
      updatedAt: this.now().toISOString(),
      error: {
        code: lastError?.code || "UNKNOWN",
        message: lastError?.message || "Unknown download error"
      }
    };
    await atomicWriteJson(paths.metadataPath, failed);
    throw lastError;
  }

  async #fetchFollowingRedirects(initialUrl, signal) {
    let url = validateUrl(initialUrl);
    for (let count = 0; ; count += 1) {
      let response;
      try {
        response = await this.fetchImpl(url, { redirect: "manual", signal });
      } catch (error) {
        if (error.name === "AbortError") throw error;
        throw new CollectorError("NETWORK_ERROR", "Network request failed", {
          retryable: true,
          cause: error
        });
      }
      if (!REDIRECT_CODES.has(response.status)) return { response, finalUrl: url.toString() };
      if (count >= this.maxRedirects) {
        await response.body?.cancel().catch(() => {});
        throw new CollectorError("TOO_MANY_REDIRECTS", "Redirect limit exceeded");
      }
      const location = response.headers.get("location");
      await response.body?.cancel().catch(() => {});
      if (!location) throw new CollectorError("INVALID_REDIRECT", "Redirect has no Location header");
      url = validateUrl(new URL(location, url).toString());
    }
  }

  async #downloadOnce({
    sourceId,
    url,
    paths,
    originalName,
    expectedMime,
    allowedMimeTypes,
    maxBytes
  }) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    let temporaryPath;
    try {
      const { response, finalUrl } = await this.#fetchFollowingRedirects(url, controller.signal);
      if (!response.ok) throw errorForHttp(response);
      if (!response.body) throw new CollectorError("EMPTY_BODY", "Response has no body", { retryable: true });

      const mimeType = normalizeMime(response.headers.get("content-type"));
      if (expectedMime && mimeType !== normalizeMime(expectedMime)) {
        throw new CollectorError("MIME_MISMATCH", `Expected ${expectedMime}, received ${mimeType}`);
      }
      if (!isAllowedMime(mimeType, allowedMimeTypes)) {
        throw new CollectorError("MIME_NOT_ALLOWED", `MIME type ${mimeType} is not allowed`);
      }

      const declaredLength = Number(response.headers.get("content-length"));
      if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
        throw new CollectorError("SIZE_LIMIT", `Declared size ${declaredLength} exceeds ${maxBytes}`);
      }

      const dispositionName = filenameFromDisposition(response.headers.get("content-disposition"));
      const urlName = decodeURIComponent(new URL(finalUrl).pathname.split("/").pop() || "");
      const filename = sanitizeFilename(originalName || dispositionName || urlName);
      const extension = extname(filename);
      const stableFilename = `${sourceId}${extension || ".bin"}`;
      const finalPath = join(paths.payloadDir, stableFilename);
      temporaryPath = join(paths.payloadDir, `.${stableFilename}.${randomUUID()}.part`);
      await mkdir(dirname(temporaryPath), { recursive: true });

      const hash = createHash("sha256");
      let sizeBytes = 0;
      const meter = new Transform({
        transform(chunk, _encoding, callback) {
          sizeBytes += chunk.length;
          if (sizeBytes > maxBytes) {
            callback(new CollectorError("SIZE_LIMIT", `Downloaded content exceeds ${maxBytes}`));
            return;
          }
          hash.update(chunk);
          callback(null, chunk);
        }
      });
      await pipeline(
        Readable.fromWeb(response.body),
        meter,
        createWriteStream(temporaryPath, { flags: "wx", mode: 0o600 })
      );
      await rename(temporaryPath, finalPath);
      temporaryPath = undefined;
      return {
        finalUrl,
        filename,
        storedFilename: stableFilename,
        mimeType,
        sizeBytes,
        sha256: hash.digest("hex"),
        localPath: finalPath
      };
    } catch (error) {
      if (error.name === "AbortError") {
        throw new CollectorError("TIMEOUT", `Download exceeded ${this.timeoutMs} ms`, {
          retryable: true,
          cause: error
        });
      }
      throw error;
    } finally {
      clearTimeout(timeout);
      if (temporaryPath) await rm(temporaryPath, { force: true }).catch(() => {});
    }
  }

  async setDriveStatus(sourceId, status) {
    if (!new Set(["drive_pending", "drive_uploaded", "drive_verified"]).has(status)) {
      throw new CollectorError("INVALID_STATUS", "Invalid Drive status transition");
    }
    const { metadataPath } = this.pathsFor(sourceId);
    const metadata = await loadJson(metadataPath);
    if (!metadata || !FINAL_DOWNLOAD_STATES.has(metadata.status)) {
      throw new CollectorError("NOT_BUFFERED", "File must be buffered before Drive state changes");
    }
    const updated = {
      ...metadata,
      status,
      updatedAt: this.now().toISOString(),
      ...(status === "drive_verified" ? { driveVerifiedAt: this.now().toISOString() } : {})
    };
    await atomicWriteJson(metadataPath, updated);
    return updated;
  }

  async purgeVerified({ retentionDays = 30 } = {}) {
    if (!Number.isFinite(retentionDays) || retentionDays < 0) {
      throw new TypeError("retentionDays must be a non-negative number");
    }
    const recordsDir = join(this.rootDir, "records");
    const { readdir } = await import("node:fs/promises");
    const entries = await readdir(recordsDir, { withFileTypes: true }).catch((error) => {
      if (error.code === "ENOENT") return [];
      throw error;
    });
    const cutoff = this.now().getTime() - retentionDays * 24 * 60 * 60 * 1000;
    const result = { purged: [], retained: [], invalid: [] };
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const recordDir = join(recordsDir, entry.name);
      try {
        const metadata = await loadJson(join(recordDir, "metadata.json"));
        const verifiedAt = Date.parse(metadata?.driveVerifiedAt || "");
        if (metadata?.status === "drive_verified" && Number.isFinite(verifiedAt) && verifiedAt <= cutoff) {
          await rm(recordDir, { recursive: true, force: true });
          result.purged.push(entry.name);
        } else {
          result.retained.push(entry.name);
        }
      } catch {
        result.invalid.push(entry.name);
      }
    }
    return result;
  }
}
