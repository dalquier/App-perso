import { ProjectCard } from "../components/ProjectCard";
import { useProjects } from "../data/ProjectsContext";
import { Link, useNavigate } from "../routing";

export function ArchivedProjects() {
  const nav = useNavigate();
  const { projects, loading, error, reload } = useProjects();
  const archived = projects.filter((project) => project.status === "archived");

  return (
    <section>
      <button className="back" onClick={() => nav(-1)}>
        ‹ Retour
      </button>
      <p className="eyebrow">Projets restaurables</p>
      <h1>Projets archivés</h1>
      {loading && <p role="status">Chargement…</p>}
      {error && (
        <div className="error" role="alert">
          {error}
          <button onClick={() => void reload()}>Réessayer</button>
        </div>
      )}
      {!loading && !error && archived.length === 0 && (
        <div className="empty">
          <div className="empty-icon">◇</div>
          <h2>Aucun projet archivé</h2>
          <p>Les projets archivés apparaîtront ici et resteront restaurables.</p>
          <Link className="button" to="/">
            Retour aux projets
          </Link>
        </div>
      )}
      <div className="cards" aria-label="Liste des projets archivés">
        {archived.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </section>
  );
}
