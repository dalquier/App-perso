import { normalizeUrl } from "./url-utils.js";

export function duplicateGroups(tabs) {
  const byUrl = new Map();
  for (const tab of tabs) {
    const key = normalizeUrl(tab.url);
    if (!key || !Number.isInteger(tab.id)) continue;
    if (!byUrl.has(key)) byUrl.set(key, []);
    byUrl.get(key).push(tab);
  }
  return [...byUrl.entries()].filter(([, group]) => group.length > 1)
    .map(([normalizedUrl, tabs]) => ({ normalizedUrl, tabs }));
}

export function duplicateRemovalPlan(groups) {
  const keep = [], remove = [];
  for (const group of groups) {
    const keeper = group.tabs.find((tab) => tab.active) || group.tabs[0];
    if (!keeper || !Number.isInteger(keeper.id)) continue;
    keep.push(keeper.id);
    remove.push(...group.tabs.filter((tab) => tab.id !== keeper.id)
      .map((tab) => tab.id).filter(Number.isInteger));
  }
  return { keep, remove };
}
