const textEncoder = new TextEncoder();

function canonicalValue(value, { root = false } = {}) {
  if (Array.isArray(value)) return value.map((item) => canonicalValue(item));
  if (!value || typeof value !== "object") return value;

  const result = {};
  for (const key of Object.keys(value).sort()) {
    if (root && key === "digest") continue;
    result[key] = canonicalValue(value[key]);
  }
  return result;
}

export function canonicalProtocolJson(definition) {
  return JSON.stringify(canonicalValue(definition, { root: true }));
}

export async function protocolDefinitionDigest(definition) {
  const bytes = textEncoder.encode(canonicalProtocolJson(definition));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}
