import { domainFromUrl } from "./url-utils.js";

export function modelTab(raw = {}) {
  const id = Number.isInteger(raw.id) ? raw.id : null;
  const url = typeof raw.url === "string" && raw.url ? raw.url : "";
  const title = typeof raw.title === "string" && raw.title.trim()
    ? raw.title.trim() : (url ? domainFromUrl(url) : "Onglet sans titre");
  return {
    id, windowId: Number.isInteger(raw.windowId) ? raw.windowId : null,
    active: raw.active === true, title, url,
    domain: url ? domainFromUrl(url) : "URL non accessible"
  };
}

export function filterTabs(tabs, query) {
  const needle = String(query || "").trim().toLocaleLowerCase("fr");
  if (!needle) return tabs;
  return tabs.filter((tab) => [tab.title, tab.domain, tab.url]
    .some((value) => String(value).toLocaleLowerCase("fr").includes(needle)));
}

export function safeClosableIds(tabs, selectedIds) {
  const existing = new Set(tabs.map((tab) => tab.id).filter(Number.isInteger));
  return [...selectedIds].filter((id) => Number.isInteger(id) && existing.has(id));
}
