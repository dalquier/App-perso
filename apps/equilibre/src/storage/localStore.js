export const STORAGE_KEY = "equilibre.local.v1";
export const STORAGE_VERSION = 1;

export function defaultState() {
  return {
    version: STORAGE_VERSION,
    settings: { saveLocally: true, theme: "system" },
    messages: [],
    lastSession: null,
  };
}

export function migrateState(raw) {
  if (!raw || typeof raw !== "object") return defaultState();
  if (raw.version === STORAGE_VERSION) {
    return {
      ...defaultState(),
      ...raw,
      settings: { ...defaultState().settings, ...raw.settings },
      messages: Array.isArray(raw.messages) ? raw.messages : [],
    };
  }
  return defaultState();
}

export function createStore(storage = globalThis.localStorage) {
  const load = () => {
    try { return migrateState(JSON.parse(storage.getItem(STORAGE_KEY))); }
    catch { return defaultState(); }
  };
  const save = (state) => {
    if (!state.settings.saveLocally) return storage.removeItem(STORAGE_KEY);
    storage.setItem(STORAGE_KEY, JSON.stringify({ ...state, version: STORAGE_VERSION }));
  };
  const clear = () => storage.removeItem(STORAGE_KEY);
  return { load, save, clear };
}
