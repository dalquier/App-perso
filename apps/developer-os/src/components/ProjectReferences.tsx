import { useState } from "react";
import { addReference, normalizeProject, removeReference, type Project } from "../domain/project";

export function ProjectReferences({ project, onSave }: { project: Project; onSave(project: Project): Promise<void> }) {
  const value = normalizeProject(project);
  const [label, setLabel] = useState(""), [url, setUrl] = useState(""), [message, setMessage] = useState(""), [saving, setSaving] = useState(false);
  const add = async () => { if (saving) return; setSaving(true); try { await onSave(addReference(project, label, url)); setLabel(""); setUrl(""); setMessage("Référence ajoutée."); } catch (error) { setMessage(error instanceof Error ? error.message : "Ajout impossible."); } finally { setSaving(false); } };
  const remove = async (id: string, name: string) => { if (!confirm(`Supprimer la référence « ${name} » ?`)) return; await onSave(removeReference(project, id)); setMessage("Référence supprimée."); };
  return <article className="project-tool">
    <h2>Références</h2>
    <label htmlFor="reference-label">Libellé</label><input id="reference-label" value={label} disabled={project.status === "archived"} onChange={(event) => setLabel(event.target.value)} />
    <label htmlFor="reference-url">URL HTTPS</label><input id="reference-url" type="url" inputMode="url" autoCapitalize="none" value={url} disabled={project.status === "archived"} onChange={(event) => setUrl(event.target.value)} placeholder="https://…" />
    <button disabled={saving || project.status === "archived" || !label.trim() || !url.trim()} onClick={() => void add()}>Ajouter la référence</button>
    {message && <p className="notice" role="status">{message}</p>}
    {value.references.length > 0 && <ul className="references-list">{value.references.map((reference) => <li key={reference.id}><div><strong>{reference.label}</strong><small>{reference.url}</small></div><div className="inline-actions"><a className="button secondary" href={reference.url} target="_blank" rel="noopener noreferrer">Ouvrir</a><button className="danger" onClick={() => void remove(reference.id, reference.label)}>Supprimer</button></div></li>)}</ul>}
  </article>;
}
