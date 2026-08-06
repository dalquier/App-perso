import { useEffect, useMemo, useState } from "react";
import { useCodex } from "../data/CodexContext";
import { useProjects } from "../data/ProjectsContext";
import {
  CODEX_STATUSES,
  validateCodexUrl,
  validateConversation,
  type CodexConversation,
  type CodexConversationStatus,
} from "../domain/codexConversation";
import { Link, useNavigate, useParams } from "../routing";

const CODEX_URL = "https://chatgpt.com/codex/";

export function CodexForm() {
  const { id } = useParams();
  const {
    conversations,
    loading,
    save,
    remove,
  } = useCodex();
  const { projects } = useProjects();
  const navigate = useNavigate();
  const existing = useMemo(
    () => conversations.find((conversation) => conversation.id === id),
    [conversations, id],
  );

  const [name, setName] = useState("");
  const [prompt, setPrompt] = useState("");
  const [projectId, setProjectId] = useState("");
  const [status, setStatus] = useState<CodexConversationStatus>("draft");
  const [url, setUrl] = useState("");
  const [message, setMessage] = useState("");
  const [clipboardFallback, setClipboardFallback] = useState(false);
  const [openFallback, setOpenFallback] = useState(false);
  const [hydratedId, setHydratedId] = useState<string | null>(
    id ? null : "new",
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id || loading || !existing || hydratedId === existing.id) return;
    setName(existing.name);
    setPrompt(existing.prompt);
    setProjectId(existing.projectId ?? "");
    setStatus(existing.status);
    setUrl(existing.conversationUrl ?? "");
    setHydratedId(existing.id);
  }, [existing, hydratedId, id, loading]);

  const buildConversation = (launch = false): CodexConversation => {
    const now = new Date().toISOString();
    const validUrl = url ? validateCodexUrl(url) : null;
    return {
      id: existing?.id ?? crypto.randomUUID(),
      name: name.trim(),
      prompt,
      status: launch
        ? "ready"
        : validUrl && status === "ready"
          ? "running"
          : status,
      conversationUrl: validUrl,
      projectId: projectId || null,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      launchedAt: launch ? now : (existing?.launchedAt ?? null),
    };
  };

  const copyPrompt = async (value: string) => {
    if (!navigator.clipboard) throw new Error("Clipboard indisponible");
    await navigator.clipboard.writeText(value);
  };

  const persist = async (launch = false) => {
    const value = buildConversation(launch);
    const errors = validateConversation(value);
    if (url && !value.conversationUrl) {
      errors.push("Le lien doit utiliser HTTPS sur chatgpt.com.");
    }
    if (errors.length) {
      setMessage(errors.join(" "));
      return;
    }

    let reservedWindow: Window | null = null;
    if (launch) {
      reservedWindow = window.open("about:blank", "_blank");
      if (reservedWindow) reservedWindow.opener = null;
    }

    setSaving(true);
    setMessage("");
    setClipboardFallback(false);
    setOpenFallback(false);

    try {
      await save(value);
    } catch {
      reservedWindow?.close();
      setMessage("Impossible d’enregistrer la conversation. Codex n’a pas été ouvert.");
      setSaving(false);
      return;
    }

    if (!launch) {
      setSaving(false);
      navigate(`/codex/${value.id}`);
      return;
    }

    try {
      await copyPrompt(value.prompt);
      setMessage("Prompt copié. Collez-le puis validez dans Codex.");
    } catch {
      setClipboardFallback(true);
      setMessage(
        "Copie impossible. Le prompt reste enregistré et sélectionnable ci-dessous.",
      );
    }

    if (reservedWindow) {
      try {
        reservedWindow.location.replace(CODEX_URL);
      } catch {
        reservedWindow.close();
        setOpenFallback(true);
        setMessage((current) => `${current} Utilisez le bouton Ouvrir Codex.`);
      }
    } else {
      setOpenFallback(true);
      setMessage((current) => `${current} Utilisez le bouton Ouvrir Codex.`);
    }

    setSaving(false);
  };

  if (id && (loading || hydratedId !== id)) {
    return <p role="status">Chargement…</p>;
  }

  if (id && !existing) {
    return (
      <section>
        <h1>Conversation introuvable</h1>
        <Link to="/codex">Retour à l’historique</Link>
      </section>
    );
  }

  return (
    <section>
      <button className="back" onClick={() => navigate(-1)}>
        ‹ Retour
      </button>
      <h1>{existing ? "Modifier" : "Nouvelle conversation"}</h1>

      {message && (
        <p
          className={clipboardFallback || openFallback ? "error" : "notice"}
          role="status"
        >
          {message}
        </p>
      )}

      <div className="form-section">
        <label>
          Nom *
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            disabled={saving}
          />
        </label>
        <label>
          Prompt *
          <textarea
            rows={10}
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            disabled={saving}
          />
        </label>
        <label>
          Projet associé
          <select
            value={projectId}
            onChange={(event) => setProjectId(event.target.value)}
            disabled={saving}
          >
            <option value="">Aucun</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </label>
        {existing && (
          <>
            <label>
              État
              <select
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value as CodexConversationStatus)
                }
                disabled={saving}
              >
                {CODEX_STATUSES.map((conversationStatus) => (
                  <option key={conversationStatus} value={conversationStatus}>
                    {conversationStatus}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Lien Codex
              <input
                inputMode="url"
                placeholder="https://chatgpt.com/..."
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                disabled={saving}
              />
            </label>
          </>
        )}
      </div>

      {(clipboardFallback || openFallback) && (
        <div className="form-section">
          {clipboardFallback && (
            <label>
              Prompt à copier
              <textarea
                readOnly
                rows={8}
                value={prompt}
                onFocus={(event) => event.currentTarget.select()}
              />
            </label>
          )}
          {clipboardFallback && (
            <button
              onClick={() =>
                void copyPrompt(prompt)
                  .then(() => {
                    setClipboardFallback(false);
                    setMessage("Prompt copié.");
                  })
                  .catch(() =>
                    setMessage("Sélectionnez le texte et utilisez Copier."),
                  )
              }
            >
              Copier à nouveau
            </button>
          )}
          {openFallback && (
            <a
              className="secondary button"
              href={CODEX_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              Ouvrir Codex
            </a>
          )}
        </div>
      )}

      <div className="sticky-actions">
        <button
          className="secondary"
          disabled={saving}
          onClick={() => void persist(false)}
        >
          {existing ? "Enregistrer" : "Enregistrer comme brouillon"}
        </button>
        <button disabled={saving} onClick={() => void persist(true)}>
          {saving ? "Enregistrement…" : "Lancer dans Codex"}
        </button>
      </div>

      {existing && (
        <div className="inline-actions">
          <button
            className="secondary"
            disabled={saving}
            onClick={() =>
              void save({ ...buildConversation(), status: "archived" }).then(
                () => navigate("/codex"),
              )
            }
          >
            Archiver
          </button>
          <button
            className="danger"
            disabled={saving}
            onClick={() => {
              if (confirm("Supprimer définitivement cette conversation ?")) {
                void remove(existing.id).then(() => navigate("/codex"));
              }
            }}
          >
            Supprimer
          </button>
        </div>
      )}

      <p className="hint">
        DeveloperOS copie seulement le prompt et ouvre Codex. Vous devez le
        coller et le valider vous-même.
      </p>
      <Link to="/codex">Retour à l’historique</Link>
    </section>
  );
}
