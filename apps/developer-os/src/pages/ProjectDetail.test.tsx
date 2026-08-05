import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProjectsProvider } from "../data/ProjectsContext";
import type { ProjectRepository } from "../data/repository";
import { AppRouter, RouterSwitch } from "../routing";
import type { Project } from "../domain/project";
import { ArchivedProjects } from "./ArchivedProjects";
import { ProjectDetail } from "./ProjectDetail";
import { ProjectList } from "./ProjectList";
import { Settings } from "./Settings";

const project: Project = {
  id: "11111111-1111-4111-8111-111111111111",
  schemaVersion: 1,
  name: "DeveloperOS",
  aliases: [],
  status: "active",
  priority: "high",
  nextAction: "Valider",
  canonicalSourceType: "github_repo",
  canonicalSource: "dalquier/App-perso",
  lastKnownState: "Prêt",
  isActive: true,
  createdAt: "2026-08-04T00:00:00.000Z",
  updatedAt: "2026-08-04T00:00:00.000Z",
};

function makeRepository(initialProjects: Project[]): ProjectRepository {
  let stored = initialProjects;
  return {
    list: async () => stored,
    get: async (id) => stored.find((p) => p.id === id),
    save: vi.fn(async (p) => {
      stored = [...stored.filter((existing) => existing.id !== p.id), p];
      return p;
    }),
    replaceAll: vi.fn(),
    clear: vi.fn(),
  };
}

function setup(repository: ProjectRepository, path = `/projects/${project.id}`) {
  history.pushState(null, "", path);
  render(
    <AppRouter>
      <ProjectsProvider repository={repository}>
        <RouterSwitch
          routes={{
            "/": <ProjectList />,
            "/projects/:id": <ProjectDetail />,
            "/settings": <Settings />,
            "/settings/archived-projects": <ArchivedProjects />,
          }}
          fallback={<p>Fallback</p>}
        />
      </ProjectsProvider>
    </AppRouter>,
  );
}

beforeEach(() => {
  vi.stubGlobal("confirm", vi.fn(() => true));
});

describe("ProjectDetail archive and restore", () => {
  it("asks explicit confirmation and cancels archiving without mutation", async () => {
    vi.stubGlobal("confirm", vi.fn(() => false));
    const repository = makeRepository([project]);
    setup(repository);

    await userEvent.click(await screen.findByRole("button", { name: "Archiver le projet" }));

    expect(confirm).toHaveBeenCalledWith(expect.stringContaining("restaurable"));
    expect(repository.save).not.toHaveBeenCalled();
  });

  it("archives an active project without activating another project", async () => {
    const other = { ...project, id: "22222222-2222-4222-8222-222222222222", name: "Autre", isActive: false };
    const repository = makeRepository([project, other]);
    setup(repository);

    await userEvent.click(await screen.findByRole("button", { name: "Archiver le projet" }));

    await waitFor(() => expect(screen.getByRole("heading", { name: "Mes projets" })).toBeVisible());
    expect(repository.save).toHaveBeenCalledWith(expect.objectContaining({ id: project.id, status: "archived", isActive: false }));
    expect(screen.queryByText("DeveloperOS")).not.toBeInTheDocument();
    expect(screen.getByText("Autre")).toBeVisible();
  });

  it("opens archived projects from settings and restores without reactivation", async () => {
    const archived = { ...project, status: "archived" as const, isActive: false };
    const repository = makeRepository([archived]);
    setup(repository, "/settings");

    await userEvent.click(await screen.findByRole("link", { name: "Projets archivés" }));
    await userEvent.click(await screen.findByRole("link", { name: /DeveloperOS/ }));

    expect(await screen.findByRole("button", { name: "Restaurer le projet" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "Définir comme projet actif" })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Restaurer le projet" }));

    await waitFor(() => expect(repository.save).toHaveBeenCalledWith(expect.objectContaining({ id: project.id, status: "paused", isActive: false, createdAt: project.createdAt })));
  });
});
