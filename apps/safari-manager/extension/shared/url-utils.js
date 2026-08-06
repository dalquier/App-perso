export function normalizeUrl(value) {
  if (typeof value !== "string" || value.trim() === "") return null;
  try {
    const url = new URL(value);
    if (!/^https?:$/.test(url.protocol)) return null;
    url.protocol = url.protocol.toLowerCase();
    url.hostname = url.hostname.toLowerCase();
    if ((url.protocol === "http:" && url.port === "80") ||
        (url.protocol === "https:" && url.port === "443")) url.port = "";
    url.hash = "";
    return url.href;
  } catch {
    return null;
  }
}

export function domainFromUrl(value) {
  try { return new URL(value).hostname || "Domaine indisponible"; }
  catch { return "Domaine indisponible"; }
}
