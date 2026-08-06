import { useMemo, useRef, useState, type ChangeEvent } from "react";
import { CodexCard } from "../components/CodexCard";
import { useCodex } from "../data/CodexContext";
import {
  CODEX_STATUSES,
  makeCodexExport,
  parseCodexExport,
  type CodexConversationStatus,
} from "../domain/codexConversation";
import { Link } from "../routing";

export function CodexList() {
  const { conversations, loading, error, reload, merge } = useCodex();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<
    "active" | "all" | CodexConversationStatus
  >("active");
  const [message, setMessage] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  const shown = useMemo(
    () =>
      conversations.filter(
        (conversation) =>
          (filter === "all" ||
            (filter === "active"
              ? conversation.status !== "archived"
              : conversation.status === filter)) &&
          `${conversation.name} ${conversation.prompt}`
            .toLowerCase()
            .includes(query.trim().toLowerCase()),
      ),
    [conversations, query, filter],
  );

  const exportData = () => {
    const objectUrl = URL.createObjectURL(
      new Blob([JSON.stringify(makeCodexExport(conversations), null, 2)], {
        type: "application/json",
      }),
    );
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = "developeros-codex.json";
    anchor.click();
    URL.revokeObjectURL(objectUrl);
    setMessage("Export Codex téléchargé.");
  };

  const importData = async (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];
    if (!selected) return;

    try {
      const values = parseCodexExport(JSON.parse(await selected.text()));
      const confirmed = confirm(
        `Fusionner ${values.length} conversation(s) ? Les entrées importées ne remplacent une entrée locale de même identifiant que si elles sont plus récentes.`,
      );
      if (!confirmed) return;

      const result = await merge(values);
      setMessage(
        `Import terminé : ${result.added} ajoutée(s), ${result.updated} mise(s) à jour, ${result.skipped} ignorée(s).`,
      );
    } catch (importError) {
      setMessage(
        importError instanceof Error ? importError.message : "Import impossible.",
      );
    } finally {
      event.target.value = "";
    }
  };

  return (
    <section>
      <p className="eyebrow">Historique local</p>
      <div className="module-title">
        <h1>Codex</h1>
        <Link className="secondary button" to="/">
          Projets
        </Link>
      </div>

      {message && (
        <p className="notice" role="status">
          {message}
        </p>
      )}

      <div className="toolbar">
        <label className="search">
          <span>⌕</span>
          <input
            aria-label="Rechercher les conversations"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Nom ou prompt"
          />
        </label>
        <select
          aria-label="Filtrer les conversations"
          value={filter}
          onChange={(event) => setFilter(event.target.value as typeof filter)}
        >
          <option value="active">Non archivées</option>
          <option value="all">Toutes</option>
          {CODEX_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>

      <div className="inline-actions compact">
        <button className="secondary" onClick={exportData}>
          Exporter JSON
        </button>
        <button
          className="secondary"
          onClick={() => fileInput.current?.click()}
        >
          Importer (fusion)
        </button>
        <input
          className="sr-only"
          ref={fileInput}
          aria-label="Importer des conversations Codex"
          type="file"
          accept="application/json,.json"
          onChange={(event) => void importData(event)}
        />
      </div>

      {loading && <p role="status">Chargement…</p>}
      {error && (
        <div className="error" role="alert">
          {error}
          <button onClick={() => void reload()}>Réessayer</button>
        </div>
      )}
      {!loading && !error && !shown.length && (
        <div className="empty">
          <h2>Aucune conversation</h2>
          <p>Créez une entrée, puis copiez son prompt vers Codex.</p>
        </div>
      )}

      <div className="cards">
        {shown.map((conversation) => (
          <CodexCard key={conversation.id} conversation={conversation} />
        ))}
      </div>

      <Link
        className="fab"
        aria-label="Nouvelle conversation"
        to="/codex/new"
      >
        ＋
      </Link>
    </section>
  );
}
