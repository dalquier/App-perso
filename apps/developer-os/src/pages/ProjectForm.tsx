import { useEffect, useRef, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "../routing";
import { useProjects } from "../data/ProjectsContext";
import {
  createProject,
  emptyDraft,
  PRIORITIES,
  SOURCE_TYPES,
  STATUSES,
  validateDraft,
  type ProjectDraft,
} from "../domain/project";
import { labels } from "../ui";
export function ProjectForm() {
  const { id } = useParams(),
    nav = useNavigate(),
    { projects, save, loading } = useProjects(),
    existing = projects.find((p) => p.id === id);
  const [draft, setDraft] = useState<ProjectDraft>(emptyDraft()),
    [errors, setErrors] = useState<Record<string, string>>({}),
    [saving, setSaving] = useState(false),
    [dirty, setDirty] = useState(false),
    [message, setMessage] = useState("");
  const initialized = useRef(false);
  useEffect(() => {
    if (!initialized.current && !loading) {
      if (existing)
        setDraft({
          name: existing.name,
          aliases: existing.aliases,
          status: existing.status,
          priority: existing.priority,
          nextAction: existing.nextAction,
          canonicalSourceType: existing.canonicalSourceType,
          canonicalSource: existing.canonicalSource,
          lastKnownState: existing.lastKnownState,
          isActive: existing.isActive,
        });
      initialized.current = true;
    }
  }, [existing, loading]);
  useEffect(() => {
    const before = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    addEventListener("beforeunload", before);
    return () => removeEventListener("beforeunload", before);
  }, [dirty]);
  const set = <K extends keyof ProjectDraft>(k: K, v: ProjectDraft[K]) => {
    setDraft((d) => ({ ...d, [k]: v }));
    setDirty(true);
    setErrors((e) => ({ ...e, [k]: "" }));
  };
  const leave = () => {
    if (!dirty || confirm("Abandonner les modifications non enregistrées ?"))
      nav(-1);
  };
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const found = validateDraft(draft);
    if (Object.keys(found).length) {
      setErrors(found);
      setMessage("Corrigez les champs signalés.");
      document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      const p = existing
        ? {
            ...existing,
            ...draft,
            name: draft.name.trim(),
            updatedAt: new Date().toISOString(),
          }
        : createProject(draft);
      await save(p);
      setDirty(false);
      if (existing) nav(-1);
      else nav(`/projects/${p.id}`, { replace: true });
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setSaving(false);
    }
  };
  if (id && !loading && !existing)
    return (
      <section className="empty">
        <h1>Projet introuvable</h1>
        <button onClick={() => nav("/")}>Retour</button>
      </section>
    );
  return (
    <section>
      <button className="back" type="button" onClick={leave}>
        ‹ Annuler
      </button>
      <form onSubmit={(e) => void submit(e)} noValidate>
        <div className="form-title">
          <div>
            <p className="eyebrow">
              {existing ? "Mise à jour" : "Nouveau projet"}
            </p>
            <h1>{existing ? "Modifier le projet" : "Créer un projet"}</h1>
          </div>
          <button disabled={saving} type="submit">
            {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>
        {message && (
          <p className="error" role="alert">
            {message}
          </p>
        )}
        <div className="form-section">
          <label>
            Nom <strong>*</strong>
            <input
              autoFocus
              name="name"
              value={draft.name}
              onChange={(e) => set("name", e.target.value)}
              aria-invalid={!!errors.name}
              aria-describedby="name-error"
            />
          </label>
          {errors.name && (
            <small id="name-error" className="field-error">
              {errors.name}
            </small>
          )}
          <label>
            Alias <small>(séparés par des virgules)</small>
            <input
              value={draft.aliases.join(", ")}
              onChange={(e) =>
                set(
                  "aliases",
                  e.target.value
                    .split(",")
                    .map((x) => x.trim())
                    .filter(Boolean),
                )
              }
            />
          </label>
          <div className="two-cols">
            <div>
              <label htmlFor="project-status">État</label>
              <select
                id="project-status"
                value={draft.status}
                onChange={(e) =>
                  set("status", e.target.value as ProjectDraft["status"])
                }
              >
                {STATUSES.map((s) => (
                  <option value={s} key={s}>
                    {labels.status[s]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="project-priority">Priorité</label>
              <select
                id="project-priority"
                value={draft.priority}
                onChange={(e) =>
                  set("priority", e.target.value as ProjectDraft["priority"])
                }
              >
                {PRIORITIES.map((p) => (
                  <option value={p} key={p}>
                    {labels.priority[p]}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <label className="check">
            <input
              type="checkbox"
              checked={draft.isActive}
              onChange={(e) => set("isActive", e.target.checked)}
            />
            <span>
              Définir comme projet actif
              <small>Remplace automatiquement le projet actif actuel.</small>
            </span>
          </label>
        </div>
        <div className="form-section">
          <h2>Reprise</h2>
          <label>
            Prochaine action
            <textarea
              rows={3}
              value={draft.nextAction}
              onChange={(e) => set("nextAction", e.target.value)}
              placeholder="La prochaine étape concrète…"
            />
          </label>
          <label>
            Dernier état connu
            <textarea
              rows={4}
              value={draft.lastKnownState}
              onChange={(e) => set("lastKnownState", e.target.value)}
              placeholder="Où en est le projet ?"
            />
          </label>
        </div>
        <div className="form-section">
          <h2>Source canonique</h2>
          <label>
            Type
            <select
              value={draft.canonicalSourceType}
              onChange={(e) =>
                set(
                  "canonicalSourceType",
                  e.target.value as ProjectDraft["canonicalSourceType"],
                )
              }
            >
              {SOURCE_TYPES.map((s) => (
                <option value={s} key={s}>
                  {labels.source[s]}
                </option>
              ))}
            </select>
          </label>
          <label>
            Source
            <input
              value={draft.canonicalSource}
              onChange={(e) => set("canonicalSource", e.target.value)}
              aria-invalid={!!errors.canonicalSource}
              placeholder="dalquier/App-perso ou chemin…"
            />
          </label>
          {errors.canonicalSource && (
            <small className="field-error">{errors.canonicalSource}</small>
          )}
        </div>
        <div className="sticky-actions">
          <button type="button" className="secondary" onClick={leave}>
            Annuler
          </button>
          <button disabled={saving} type="submit">
            Enregistrer
          </button>
        </div>
      </form>
    </section>
  );
}
