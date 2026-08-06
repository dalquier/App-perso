import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppRouter } from "../routing";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProjectsProvider } from "../data/ProjectsContext";
import type { ProjectRepository } from "../data/repository";
import { makeExport } from "../domain/export";
import type { Project } from "../domain/project";
import { Settings } from "./Settings";

const existing: Project = {
  id: "11111111-1111-4111-8111-111111111111",
  schemaVersion: 1,
  name: "Existing",
  aliases: [],
  status: "active",
  priority: "normal",
  nextAction: "",
  canonicalSourceType: "github_repo",
  canonicalSource: "dalquier/App-perso",
  lastKnownState: "",
  isActive: true,
  createdAt: "2026-08-04T00:00:00.000Z",
  updatedAt: "2026-08-04T00:00:00.000Z",
};

const incoming: Project = {
  ...existing,
  id: "22222222-2222-4222-8222-222222222222",
  name: "Incoming",
  isActive: false,
};

function setup(repository: ProjectRepository) {
  history.pushState(null, "", "/settings");
  return render(
    <AppRouter>
      <ProjectsProvider repository={repository}>
        <Settings />
      </ProjectsProvider>
    </AppRouter>,
  );
}

beforeEach(() => {
  vi.stubGlobal(
    "confirm",
    vi.fn(() => true),
  );
  vi.stubGlobal("URL", {
    createObjectURL: vi.fn(() => "blob:test"),
    revokeObjectURL: vi.fn(),
  });
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(
    () => undefined,
  );
});

describe("Settings import backup", () => {
  it("offers a backup before replacement and can cancel without mutation", async () => {
    const replaceAll = vi.fn();
    setup({
      list: async () => [existing],
      get: async () => existing,
      save: vi.fn(),
      replaceAll,
      clear: vi.fn(),
    });

    const file = new File(
      [JSON.stringify(makeExport([incoming]))],
      "import.json",
      { type: "application/json" },
    );
    await userEvent.upload(
      screen.getByLabelText("Fichier JSON à importer"),
      file,
    );

    expect(await screen.findByText(/sauvegarde récupérable/)).toBeVisible();
    expect(HTMLAnchorElement.prototype.click).toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: "Annuler" }));
    expect(replaceAll).not.toHaveBeenCalled();
  });

  it("replaces after backup was offered and explicit confirmation", async () => {
    const replaceAll = vi.fn();
    setup({
      list: async () => [existing],
      get: async () => existing,
      save: vi.fn(),
      replaceAll,
      clear: vi.fn(),
    });

    const file = new File(
      [JSON.stringify(makeExport([incoming]))],
      "import.json",
      { type: "application/json" },
    );
    await userEvent.upload(
      screen.getByLabelText("Fichier JSON à importer"),
      file,
    );
    await userEvent.click(
      await screen.findByRole("button", { name: "Confirmer" }),
    );

    await waitFor(() => expect(replaceAll).toHaveBeenCalledWith([incoming]));
  });

  it("shows import warnings and requires explicit acknowledgement before replacement", async () => {
    const replaceAll = vi.fn();
    setup({
      list: async () => [existing],
      get: async () => existing,
      save: vi.fn(),
      replaceAll,
      clear: vi.fn(),
    });

    const file = new File(
      [
        JSON.stringify(
          makeExport([{ ...incoming, unexpected: "drop me" } as Project]),
        ),
      ],
      "warning.json",
      { type: "application/json" },
    );
    await userEvent.upload(
      screen.getByLabelText("Fichier JSON à importer"),
      file,
    );

    expect(await screen.findByText("Avertissements d’import")).toBeVisible();
    expect(screen.getByText(/champs ignorés/)).toBeVisible();
    const confirm = screen.getByRole("button", { name: "Confirmer" });
    expect(confirm).toBeDisabled();

    await userEvent.click(
      screen.getByLabelText(/J’accepte que les champs signalés soient ignorés/),
    );
    expect(confirm).toBeEnabled();
    await userEvent.click(confirm);

    await waitFor(() =>
      expect(replaceAll).toHaveBeenCalledWith([
        expect.objectContaining({ id: incoming.id, name: incoming.name }),
      ]),
    );
  });

  it("keeps data untouched on invalid import", async () => {
    const replaceAll = vi.fn();
    setup({
      list: async () => [existing],
      get: async () => existing,
      save: vi.fn(),
      replaceAll,
      clear: vi.fn(),
    });

    const file = new File(['{"bad":true}'], "bad.json", {
      type: "application/json",
    });
    await userEvent.upload(
      screen.getByLabelText("Fichier JSON à importer"),
      file,
    );

    expect(await screen.findByText(/incompatible/)).toBeVisible();
    expect(replaceAll).not.toHaveBeenCalled();
  });
});
