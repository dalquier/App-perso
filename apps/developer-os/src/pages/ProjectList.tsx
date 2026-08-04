import { useMemo, useState } from "react";
import { Link } from "../routing";
import { ProjectCard } from "../components/ProjectCard";
import { useProjects } from "../data/ProjectsContext";
import { STATUSES, type ProjectStatus } from "../domain/project";
import { labels } from "../ui";
export function ProjectList() {
  const { projects, loading, error, reload } = useProjects();
  const [q, setQ] = useState(""),
    [filter, setFilter] = useState<"all" | ProjectStatus>("all");
  const shown = useMemo(
    () =>
      projects.filter(
        (p) =>
          (filter === "all" || p.status === filter) &&
          `${p.name} ${p.aliases.join(" ")} ${p.nextAction} ${p.lastKnownState}`
            .toLowerCase()
            .includes(q.trim().toLowerCase()),
      ),
    [projects, q, filter],
  );
  const active = projects.find((p) => p.isActive);
  return (
    <section>
      <div className="hero">
        <p className="eyebrow">Poste de pilotage</p>
        <h1>Mes projets</h1>
        {active ? (
          <Link to={`/projects/${active.id}`} className="active-summary">
            <span>Projet actif</span>
            <strong>{active.name}</strong>
            <small>{active.nextAction || "Prochaine action à définir"} →</small>
          </Link>
        ) : (
          <p className="hint">
            Aucun projet actif. Ouvrez un projet pour l’activer.
          </p>
        )}
      </div>
      <div className="toolbar">
        <label className="search">
          <span>⌕</span>
          <input
            aria-label="Rechercher"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher un projet"
          />
        </label>
        <label>
          <span className="sr-only">Filtrer par état</span>
          <select
            aria-label="Filtrer par état"
            value={filter}
            onChange={(e) => setFilter(e.target.value as typeof filter)}
          >
            <option value="all">Tous les états</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {labels.status[s]}
              </option>
            ))}
          </select>
        </label>
      </div>
      {loading && <p role="status">Chargement…</p>}
      {error && (
        <div className="error" role="alert">
          {error}
          <button onClick={() => void reload()}>Réessayer</button>
        </div>
      )}
      {!loading && !error && shown.length === 0 && (
        <div className="empty">
          <div className="empty-icon">◇</div>
          <h2>
            {projects.length ? "Aucun résultat" : "Votre cockpit est prêt"}
          </h2>
          <p>
            {projects.length
              ? "Modifiez la recherche ou le filtre."
              : "Créez votre premier projet pour garder le cap."}
          </p>
          {!projects.length && (
            <Link className="button" to="/projects/new">
              Créer un projet
            </Link>
          )}
        </div>
      )}
      <div className="cards">
        {shown.map((p) => (
          <ProjectCard key={p.id} project={p} />
        ))}
      </div>
      <Link to="/projects/new" className="fab" aria-label="Créer un projet">
        ＋
      </Link>
    </section>
  );
}
