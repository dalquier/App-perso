import { ProjectDetail } from "./pages/ProjectDetail";
import { ProjectForm } from "./pages/ProjectForm";
import { ArchivedProjects } from "./pages/ArchivedProjects";
import { ProjectList } from "./pages/ProjectList";
import { Settings } from "./pages/Settings";
import { ProjectsProvider } from "./data/ProjectsContext";
import { AppRouter, NavLink, RouterSwitch } from "./routing";

export function App() {
  return (
    <AppRouter>
      <ProjectsProvider>
        <div className="app-shell">
          <header>
            <NavLink to="/" className="brand">
              Developer<span>OS</span>
            </NavLink>
            <NavLink
              to="/settings"
              aria-label="Paramètres"
              className="icon-link"
            >
              ⚙︎
            </NavLink>
          </header>
          <main>
            <RouterSwitch
              routes={{
                "/": <ProjectList />,
                "/projects/new": <ProjectForm />,
                "/projects/:id": <ProjectDetail />,
                "/projects/:id/edit": <ProjectForm />,
                "/settings": <Settings />,
                "/settings/archived-projects": <ArchivedProjects />,
              }}
              fallback={
                <section className="empty">
                  <h1>Page introuvable</h1>
                  <NavLink className="button" to="/">
                    Retour aux projets
                  </NavLink>
                </section>
              }
            />
          </main>
        </div>
      </ProjectsProvider>
    </AppRouter>
  );
}
