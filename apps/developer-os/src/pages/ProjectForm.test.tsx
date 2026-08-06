import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProjectsProvider } from "../data/ProjectsContext";
import type { ProjectRepository } from "../data/repository";
import { AppRouter, RouterSwitch } from "../routing";
import type { Project } from "../domain/project";
import { ProjectDetail } from "./ProjectDetail";
import { ProjectForm } from "./ProjectForm";
import { ProjectList } from "./ProjectList";

const baseProject: Project = {
  id: "11111111-1111-4111-8111-111111111111",
  schemaVersion: 1,
  name: "DeveloperOS",
  aliases: [],
  status: "active",
  priority: "high",
  nextAction: "Valider sur iPhone",
  canonicalSourceType: "github_repo",
  canonicalSource: "dalquier/App-perso",
  lastKnownState: "BUILD-01 prêt",
  isActive: true,
  createdAt: "2026-08-04T00:00:00.000Z",
  updatedAt: "2026-08-04T00:00:00.000Z",
};

function makeRepository(initialProjects: Project[] = []): ProjectRepository {
  let stored = initialProjects;
  return {
    list: async () => stored,
    get: async (id) => stored.find((project) => project.id === id),
    save: vi.fn(async (project) => {
      stored = [
        ...stored.filter((existing) => existing.id !== project.id),
        project,
      ];
      return project;
    }),
    replaceAll: async (projects) => {
      stored = projects;
    },
    clear: async () => {
      stored = [];
    },
  };
}

const repo = makeRepository();

function renderApp(repository: ProjectRepository, path = "/projects/new") {
  history.pushState(null, "", path);
  return render(
    <AppRouter>
      <ProjectsProvider repository={repository}>
        <RouterSwitch
          routes={{
            "/": <ProjectList />,
            "/projects/new": <ProjectForm />,
            "/projects/:id": <ProjectDetail />,
            "/projects/:id/edit": <ProjectForm />,
          }}
          fallback={<p>Fallback</p>}
        />
      </ProjectsProvider>
    </AppRouter>,
  );
}

function renderForm() {
  return renderApp(repo);
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal(
    "confirm",
    vi.fn(() => true),
  );
});

describe("ProjectForm", () => {
  it("uses native reliable selects and reports validation", async () => {
    renderForm();
    await screen.findByRole("heading", { name: "Créer un projet" });
    expect(screen.getByRole("combobox", { name: "État" })).toBeInstanceOf(
      HTMLSelectElement,
    );
    expect(screen.getByRole("combobox", { name: "Priorité" })).toBeInstanceOf(
      HTMLSelectElement,
    );
    await userEvent.click(
      screen.getAllByRole("button", { name: "Enregistrer" })[0],
    );
    expect(await screen.findByText("Le nom est obligatoire.")).toBeVisible();
  });

  it("prefills an editable canonical source for new projects", async () => {
    renderApp(makeRepository());
    const source = await screen.findByLabelText("Source", { exact: true });
    expect(source).toHaveValue("dalquier/App-perso");
    await userEvent.clear(source);
    expect(source).toHaveValue("");
    await userEvent.type(source, "dalquier/Autre-projet");
    expect(source).toHaveValue("dalquier/Autre-projet");
  });

  it("keeps the existing canonical source while editing", async () => {
    const existing = {
      ...baseProject,
      canonicalSource: "dalquier/Projet-existant",
    };
    renderApp(makeRepository([existing]), `/projects/${existing.id}/edit`);
    expect(
      await screen.findByLabelText("Source", { exact: true }),
    ).toHaveValue("dalquier/Projet-existant");
  });

  it("keeps edit history on the previous detail while creation opens the new detail", async () => {
    const repository = makeRepository([baseProject]);
    renderApp(repository, "/");

    await screen.findByRole("heading", { name: "Mes projets" });
    await userEvent.click(
      screen.getAllByRole("link", { name: /DeveloperOS/ })[0],
    );
    expect(
      await screen.findByRole("heading", { name: "DeveloperOS" }),
    ).toBeVisible();

    await userEvent.click(screen.getByRole("link", { name: "Modifier" }));
    await screen.findByRole("heading", { name: "Modifier le projet" });
    await userEvent.click(
      screen.getAllByRole("button", { name: /Annuler/ })[0],
    );
    expect(
      await screen.findByRole("heading", { name: "DeveloperOS" }),
    ).toBeVisible();

    await userEvent.click(screen.getByRole("link", { name: "Modifier" }));
    await userEvent.selectOptions(
      await screen.findByRole("combobox", { name: "Priorité" }),
      "critical",
    );
    await userEvent.click(
      screen.getAllByRole("button", { name: "Enregistrer" })[0],
    );

    expect(await screen.findByText("Critique")).toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: /Retour/ }));
    expect(
      await screen.findByRole("heading", { name: "Mes projets" }),
    ).toBeVisible();

    await userEvent.click(
      screen.getByRole("link", { name: "Nouvelle création rapide" }),
    );
    await userEvent.type(await screen.findByLabelText(/Nom/), "Nouveau");
    await userEvent.click(
      screen.getAllByRole("button", { name: "Enregistrer" })[0],
    );

    expect(
      await screen.findByRole("heading", { name: "Nouveau" }),
    ).toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: /Retour/ }));
    expect(
      await screen.findByRole("heading", { name: "Mes projets" }),
    ).toBeVisible();
  });

  it("saves a valid project", async () => {
    renderForm();
    await userEvent.type(await screen.findByLabelText(/Nom/), "Nouveau");
    await userEvent.click(
      screen.getAllByRole("button", { name: "Enregistrer" })[0],
    );
    expect(
      await screen.findByRole("heading", { name: "Nouveau" }),
    ).toBeVisible();
    expect(repo.save).toHaveBeenCalled();
  });
});
