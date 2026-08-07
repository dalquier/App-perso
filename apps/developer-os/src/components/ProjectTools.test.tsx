import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { createProject, emptyDraft } from "../domain/project";
import { ProjectResume } from "./ProjectResume";
import { ProjectReferences } from "./ProjectReferences";

describe("project resume and reference sections", () => {
  it("saves a trimmed resume once despite a double click", async () => {
    const save = vi.fn(async (savedProject: ReturnType<typeof createProject>) => { void savedProject; await new Promise((resolve) => setTimeout(resolve, 5)); });
    render(<ProjectResume project={createProject({ ...emptyDraft(), name: "Test" })} onSave={save} />);
    await userEvent.type(screen.getByLabelText("Point de reprise courant"), "  Reprendre ici  ");
    const button = screen.getByRole("button", { name: "Enregistrer la reprise" }); button.click(); button.click();
    expect(await screen.findByText("Point de reprise enregistré.")).toBeVisible(); expect(save).toHaveBeenCalledTimes(1); expect(save.mock.calls[0][0].resumeText).toBe("Reprendre ici");
  });
  it("validates, opens explicitly and confirms reference deletion", async () => {
    const save = vi.fn(async () => undefined); vi.stubGlobal("confirm", vi.fn(() => true));
    const project = { ...createProject({ ...emptyDraft(), name: "Test" }), references: [{ id: "ref", label: "Doc", url: "https://example.com", createdAt: "2026-08-07T00:00:00.000Z", updatedAt: "2026-08-07T00:00:00.000Z" }] };
    render(<ProjectReferences project={project} onSave={save} />);
    const open = screen.getByRole("link", { name: "Ouvrir" }); expect(open).toHaveAttribute("target", "_blank"); expect(open).toHaveAttribute("rel", "noopener noreferrer");
    await userEvent.click(screen.getByRole("button", { name: "Supprimer" })); expect(confirm).toHaveBeenCalled(); expect(save).toHaveBeenCalledWith(expect.objectContaining({ references: [] }));
  });
});
