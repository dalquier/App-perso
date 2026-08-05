import { Link, useNavigate, useParams } from "../routing";
import { useProjects } from "../data/ProjectsContext";
import { labels } from "../ui";
export function ProjectDetail() {
  const { id } = useParams(),
    nav = useNavigate();
  const { projects, save, loading } = useProjects();
  const p = projects.find((x) => x.id === id);
  if (loading) return <p role="status">Chargement…</p>;
  if (!p)
    return (
      <section className="empty">
        <h1>Projet introuvable</h1>
        <Link to="/">Retour</Link>
      </section>
    );
  const activate = async () => {
    await save({ ...p, isActive: true, updatedAt: new Date().toISOString() });
  };
  const archive = async () => {
    if (
      !confirm(
        "Archiver le projet ? Il restera restaurable depuis les réglages, dans Projets archivés.",
      )
    )
      return;
    await save({
      ...p,
      status: "archived",
      isActive: false,
      updatedAt: new Date().toISOString(),
    });
    nav("/", { replace: true });
  };
  const restore = async () => {
    await save({
      ...p,
      status: "paused",
      isActive: false,
      updatedAt: new Date().toISOString(),
    });
  };
  return (
    <section>
      <button className="back" onClick={() => nav(-1)}>
        ‹ Retour
      </button>
      <div className="detail-title">
        <div>
          <span className={`status status-${p.status}`}>
            {labels.status[p.status]}
          </span>
          <h1>{p.name}</h1>
          {p.aliases.length > 0 && <p>{p.aliases.join(" · ")}</p>}
        </div>
        <Link className="secondary button" to={`/projects/${p.id}/edit`}>
          Modifier
        </Link>
      </div>
      {p.status === "archived" ? (
        <button className="wide secondary" onClick={() => void restore()}>
          Restaurer le projet
        </button>
      ) : p.isActive ? (
        <div className="active-banner">● Projet actif</div>
      ) : (
        <button className="wide secondary" onClick={() => void activate()}>
          Définir comme projet actif
        </button>
      )}
      {p.status !== "archived" && (
        <button className="wide danger" onClick={() => void archive()}>
          Archiver le projet
        </button>
      )}
      <div className="detail-grid">
        <article>
          <h2>Prochaine action</h2>
          <p className="important">{p.nextAction || "Non renseignée"}</p>
        </article>
        <article>
          <h2>Dernier état connu</h2>
          <p>{p.lastKnownState || "Non renseigné"}</p>
        </article>
        <article>
          <h2>Source canonique</h2>
          <small>{labels.source[p.canonicalSourceType]}</small>
          <p className="break">{p.canonicalSource || "Non renseignée"}</p>
        </article>
        <article>
          <h2>Informations</h2>
          <dl>
            <div>
              <dt>Priorité</dt>
              <dd>{labels.priority[p.priority]}</dd>
            </div>
            <div>
              <dt>Créé</dt>
              <dd>{new Date(p.createdAt).toLocaleDateString("fr-FR")}</dd>
            </div>
            <div>
              <dt>Mis à jour</dt>
              <dd>{new Date(p.updatedAt).toLocaleString("fr-FR")}</dd>
            </div>
          </dl>
        </article>
      </div>
    </section>
  );
}
