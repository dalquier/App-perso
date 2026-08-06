import { ProjectDetail } from "./pages/ProjectDetail";
import { ProjectForm } from "./pages/ProjectForm";
import { ArchivedProjects } from "./pages/ArchivedProjects";
import { ProjectList } from "./pages/ProjectList";
import { Settings } from "./pages/Settings";
import { ProjectsProvider } from "./data/ProjectsContext";
import { AppRouter, NavLink, RouterSwitch } from "./routing";
import { CodexProvider } from "./data/CodexContext";
import { CodexList } from "./pages/CodexList";
import { CodexForm } from "./pages/CodexForm";
import { CodexDetail } from "./pages/CodexDetail";

export function App() {
  return (
    <AppRouter>
      <ProjectsProvider>
       <CodexProvider>
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
            <NavLink to="/codex" className="header-codex">Codex</NavLink>
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
                "/codex": <CodexList />,
                "/codex/new": <CodexForm />,
                "/codex/:id": <CodexDetail />,
                "/codex/:id/edit": <CodexForm />,
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
       </CodexProvider>
      </ProjectsProvider>
    </AppRouter>
  );
}
