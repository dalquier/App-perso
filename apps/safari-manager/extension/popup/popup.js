import { getBrowserApi, queryAccessibleTabs, activateTab, removeTabsSafely, readableWindows } from "../shared/browser-api.js";
import { modelTab, filterTabs, safeClosableIds } from "../shared/tab-model.js";
import { duplicateGroups, duplicateRemovalPlan } from "../shared/duplicate-detector.js";

const elements = Object.fromEntries(["count","refresh","search","notice","select-filtered","clear-selection","duplicates","duplicate-groups","prepare-duplicates","tabs","empty","selected-count","prepare-close","confirm","confirm-title","confirm-summary","confirm-close"].map((id) => [id, document.getElementById(id)]));
const state = { api: null, tabs: [], selected: new Set(), pending: [], groups: [] };
const escapeText = (value) => String(value).replace(/[&<>'"]/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));

function visibleTabs() { return filterTabs(state.tabs, elements.search.value); }
function updateSelection() {
  const count = state.selected.size;
  elements["selected-count"].textContent = `${count} sélectionné${count > 1 ? "s" : ""}`;
  elements["prepare-close"].disabled = count === 0;
}
function render() {
  const visible = visibleTabs();
  elements.count.textContent = `${state.tabs.length} onglet${state.tabs.length > 1 ? "s" : ""}`;
  elements.tabs.innerHTML = visible.map((tab) => `<li class="tab${tab.active ? " active" : ""}"><label aria-label="Sélectionner ${escapeText(tab.title)}"><input type="checkbox" data-select="${tab.id}" ${state.selected.has(tab.id) ? "checked" : ""}></label><button data-activate="${tab.id}"><span class="title">${escapeText(tab.title)}</span><span class="domain">${escapeText(tab.domain)}${tab.windowId === null ? "" : ` · Fenêtre ${tab.windowId}`}</span><span class="url">${escapeText(tab.url || "URL non accessible — permission possiblement refusée")}</span></button></li>`).join("");
  elements.empty.hidden = visible.length > 0;
  elements.empty.textContent = state.tabs.length ? "Aucun résultat de recherche." : "Aucun onglet accessible.";
  elements.duplicates.hidden = state.groups.length === 0;
  elements["duplicate-groups"].innerHTML = state.groups.map((group) => `<p class="duplicate-group"><strong>${group.tabs.length} onglets</strong> · ${escapeText(group.tabs[0].domain)}</p>`).join("");
  updateSelection();
}
async function refresh() {
  elements.notice.textContent = "Chargement des onglets…";
  try {
    state.api ||= getBrowserApi();
    const raw = await queryAccessibleTabs(state.api);
    state.tabs = (Array.isArray(raw) ? raw : []).map(modelTab).filter((tab) => Number.isInteger(tab.id));
    const ids = new Set(state.tabs.map((tab) => tab.id));
    state.selected = new Set([...state.selected].filter((id) => ids.has(id)));
    state.groups = duplicateGroups(state.tabs);
    const inaccessible = state.tabs.filter((tab) => !tab.url).length;
    const windows = await readableWindows(state.api);
    elements.notice.textContent = inaccessible ? `${inaccessible} URL non accessible : vérifiez les permissions de sites.` : (windows === null ? "" : `${windows.length} fenêtre${windows.length > 1 ? "s" : ""} accessible${windows.length > 1 ? "s" : ""}.`);
    render();
  } catch (error) {
    elements.notice.textContent = `${error.message} Activez Safari Manager dans Réglages > Safari > Extensions et accordez l’accès aux sites.`;
    state.tabs = []; state.groups = []; render();
  }
}
function prepare(ids, title, detail) {
  state.pending = ids;
  const domains = [...new Set(state.tabs.filter((tab) => ids.includes(tab.id)).map((tab) => tab.domain))].slice(0, 3);
  elements["confirm-title"].textContent = title;
  elements["confirm-summary"].textContent = `${ids.length} onglet${ids.length > 1 ? "s" : ""} concerné${ids.length > 1 ? "s" : ""}. ${detail} Domaines : ${domains.join(", ") || "indisponibles"}.`;
  elements.confirm.showModal();
}
elements.refresh.addEventListener("click", refresh);
elements.search.addEventListener("input", render);
elements["select-filtered"].addEventListener("click", () => { visibleTabs().forEach((tab) => state.selected.add(tab.id)); render(); });
elements["clear-selection"].addEventListener("click", () => { state.selected.clear(); render(); });
elements.tabs.addEventListener("change", (event) => { const id = Number(event.target.dataset.select); if (!Number.isInteger(id)) return; event.target.checked ? state.selected.add(id) : state.selected.delete(id); updateSelection(); });
elements.tabs.addEventListener("click", async (event) => { const button = event.target.closest("[data-activate]"); if (!button) return; try { await activateTab(state.api, Number(button.dataset.activate)); elements.notice.textContent = "Onglet activé."; await refresh(); } catch { elements.notice.textContent = "Safari a refusé d’activer cet onglet. Vérifiez qu’il existe encore et que l’extension est autorisée."; } });
elements["prepare-close"].addEventListener("click", () => prepare(safeClosableIds(state.tabs, state.selected), "Fermer la sélection ?", "Cette action est irréversible."));
elements["prepare-duplicates"].addEventListener("click", () => { const plan = duplicateRemovalPlan(state.groups); prepare(plan.remove, "Fermer les doublons ?", `${plan.keep.length} onglet${plan.keep.length > 1 ? "s" : ""} conservé${plan.keep.length > 1 ? "s" : ""}.`); });
elements.confirm.addEventListener("close", async () => { if (elements.confirm.returnValue !== "confirm" || !state.pending.length) return; const expected = state.pending.length; const result = await removeTabsSafely(state.api, state.pending); state.pending = []; state.selected.clear(); await refresh(); elements.notice.textContent = result.failed.length ? `${result.removed.length}/${expected} onglets fermés. ${result.failed.length} échec${result.failed.length > 1 ? "s" : ""} : Safari a refusé certaines fermetures.` : `${result.removed.length} onglet${result.removed.length > 1 ? "s" : ""} fermé${result.removed.length > 1 ? "s" : ""} avec succès.`; });
refresh();
