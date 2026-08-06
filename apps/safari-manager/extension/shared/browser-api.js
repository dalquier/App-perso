export function getBrowserApi(scope = globalThis) {
  const api = scope.browser;
  if (!api?.tabs?.query || !api.tabs.update || !api.tabs.remove) {
    throw new Error("Safari ne donne pas accès à la gestion des onglets.");
  }
  return api;
}

export async function queryAccessibleTabs(api) { return api.tabs.query({}); }
export async function activateTab(api, id) { return api.tabs.update(id, { active: true }); }

export async function removeTabsSafely(api, ids) {
  const removed = [], failed = [];
  for (const id of ids) {
    try { await api.tabs.remove(id); removed.push(id); }
    catch (error) { failed.push({ id, message: error?.message || "Refus de Safari" }); }
  }
  return { removed, failed };
}

export async function readableWindows(api) {
  if (!api.windows?.getAll) return null;
  try { return await api.windows.getAll({ populate: false }); }
  catch { return null; }
}
