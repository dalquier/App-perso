import { Link } from "../routing";
import type { Project } from "../domain/project";
import { labels } from "../ui";
export function ProjectCard({ project }: { project: Project }) {
  return (
    <Link
      to={`/projects/${project.id}`}
      className={`card ${project.isActive ? "active-card" : ""}`}
    >
      <div className="card-top">
        <span className={`status status-${project.status}`}>
          {labels.status[project.status]}
        </span>
        {project.isActive && <span className="active-pill">● Actif</span>}
      </div>
      <h2>{project.name}</h2>
      <p>{project.lastKnownState || "Aucun état renseigné"}</p>
      <div className="card-bottom">
        <span>Priorité {labels.priority[project.priority]}</span>
        <span aria-hidden>›</span>
      </div>
    </Link>
  );
}
