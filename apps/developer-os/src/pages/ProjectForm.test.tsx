import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProjectsProvider } from "../data/ProjectsContext";
import type { ProjectRepository } from "../data/repository";
import { AppRouter, RouterSwitch } from "../routing";
import { ProjectForm } from "./ProjectForm";

const repo: ProjectRepository = {
  list: async () => [],
  get: async () => undefined,
  save: vi.fn(async (project) => project),
  replaceAll: async () => undefined,
  clear: async () => undefined,
};

function renderForm() {
  history.pushState(null, "", "/projects/new");
  return render(
    <AppRouter>
      <ProjectsProvider repository={repo}>
        <RouterSwitch
          routes={{
            "/projects/new": <ProjectForm />,
            "/projects/:id": <p>Fiche</p>,
          }}
          fallback={<p>Fallback</p>}
        />
      </ProjectsProvider>
    </AppRouter>,
  );
}

beforeEach(() => vi.clearAllMocks());

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

  it("saves a valid project", async () => {
    renderForm();
    await userEvent.type(await screen.findByLabelText(/Nom/), "Nouveau");
    await userEvent.type(
      screen.getByLabelText("Source", { exact: true }),
      "dalquier/App-perso",
    );
    await userEvent.click(
      screen.getAllByRole("button", { name: "Enregistrer" })[0],
    );
    expect(await screen.findByText("Fiche")).toBeVisible();
    expect(repo.save).toHaveBeenCalled();
  });
});
