import { useRef, useState } from "react";
import { addResume, normalizeProject, type Project } from "../domain/project";

export function ProjectResume({ project, onSave }: { project: Project; onSave(project: Project): Promise<void> }) {
  const value = normalizeProject(project);
  const [text, setText] = useState(value.resumeText);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const submit = async () => {
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    try { await onSave(addResume(project, text)); setMessage("Point de reprise enregistré."); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Enregistrement impossible."); }
    finally { savingRef.current = false; setSaving(false); }
  };
  return <article className="project-tool">
    <h2>Reprise</h2>
    <label htmlFor="resume">Point de reprise courant</label>
    <textarea id="resume" rows={4} value={text} disabled={project.status === "archived"} onChange={(event) => setText(event.target.value)} placeholder="Où reprendre, avec quel contexte et quelle prochaine étape ?" />
    <button disabled={saving || project.status === "archived" || !text.trim()} onClick={() => void submit()}>{saving ? "Enregistrement…" : "Enregistrer la reprise"}</button>
    {message && <p className="notice" role="status">{message}</p>}
    {value.resumeHistory.length > 0 && <div className="history"><h3>Historique</h3><ol>{value.resumeHistory.map((entry) => <li key={entry.id}><time dateTime={entry.createdAt}>{new Date(entry.createdAt).toLocaleString("fr-FR")}</time><p>{entry.text}</p></li>)}</ol></div>}
  </article>;
}
