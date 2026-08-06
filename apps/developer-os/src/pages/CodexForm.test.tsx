import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CodexProvider } from "../data/CodexContext";
import { ProjectsProvider } from "../data/ProjectsContext";
import type { CodexRepository } from "../data/codexRepository";
import type { ProjectRepository } from "../data/repository";
import type { CodexConversation } from "../domain/codexConversation";
import { AppRouter } from "../routing";
import { CodexForm } from "./CodexForm";

const conversation: CodexConversation = {
  id: "conversation-1",
  name: "Conversation existante",
  status: "running",
  prompt: "Prompt restauré",
  conversationUrl: "https://chatgpt.com/codex/example",
  projectId: null,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-02T00:00:00Z",
  launchedAt: "2026-01-01T12:00:00Z",
};

const emptyProjectRepository: ProjectRepository = {
  list: async () => [],
  get: async () => undefined,
  save: async (project) => project,
  replaceAll: async () => undefined,
  clear: async () => undefined,
};

function createCodexRepository(initial: CodexConversation[] = []) {
  let values = [...initial];
  const save = vi.fn(async (value: CodexConversation) => {
    values = [...values.filter((item) => item.id !== value.id), value];
    return value;
  });
  const repository: CodexRepository = {
    list: vi.fn(async () => [...values]),
    get: vi.fn(async (id) => values.find((item) => item.id === id)),
    save,
    delete: vi.fn(async (id) => {
      values = values.filter((item) => item.id !== id);
    }),
    merge: vi.fn(async () => ({ added: 0, updated: 0, skipped: 0 })),
  };
  return { repository, save };
}

function renderForm(repository: CodexRepository) {
  return render(
    <AppRouter>
      <ProjectsProvider repository={emptyProjectRepository}>
        <CodexProvider repository={repository}>
          <CodexForm />
        </CodexProvider>
      </ProjectsProvider>
    </AppRouter>,
  );
}

beforeEach(() => {
  vi.restoreAllMocks();
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
  });
});

describe("CodexForm", () => {
  it("hydrate une édition ouverte directement après le chargement local", async () => {
    window.history.pushState({}, "", "/codex/conversation-1/edit");
    const { repository } = createCodexRepository([conversation]);
    renderForm(repository);

    expect(await screen.findByDisplayValue("Conversation existante")).toBeVisible();
    expect(screen.getByDisplayValue("Prompt restauré")).toBeVisible();
    expect(screen.getByDisplayValue("running")).toBeVisible();
    expect(
      screen.getByDisplayValue("https://chatgpt.com/codex/example"),
    ).toBeVisible();
  });

  it("enregistre avant de naviguer la fenêtre réservée vers Codex", async () => {
    window.history.pushState({}, "", "/codex/new");
    const order: string[] = [];
    const { repository, save } = createCodexRepository();
    save.mockImplementation(async (value) => {
      order.push("save");
      return value;
    });
    const replace = vi.fn(() => order.push("navigate"));
    vi.spyOn(window, "open").mockReturnValue({
      opener: null,
      close: vi.fn(),
      location: { replace },
    } as unknown as Window);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: vi.fn(async () => {
          order.push("clipboard");
        }),
      },
    });

    renderForm(repository);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Nom *"), "Nouvelle tâche");
    await user.type(screen.getByLabelText("Prompt *"), "Construire le module");
    await user.click(screen.getByRole("button", { name: "Lancer dans Codex" }));

    await waitFor(() => expect(replace).toHaveBeenCalled());
    expect(order.indexOf("save")).toBeLessThan(order.indexOf("navigate"));
  });

  it("affiche toujours un bouton de secours lorsque la popup est bloquée", async () => {
    window.history.pushState({}, "", "/codex/new");
    const { repository } = createCodexRepository();
    vi.spyOn(window, "open").mockReturnValue(null);

    renderForm(repository);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Nom *"), "Nouvelle tâche");
    await user.type(screen.getByLabelText("Prompt *"), "Prompt à copier");
    await user.click(screen.getByRole("button", { name: "Lancer dans Codex" }));

    expect(
      await screen.findByRole("link", { name: "Ouvrir Codex" }),
    ).toHaveAttribute("href", "https://chatgpt.com/codex/");
  });

  it("conserve un prompt sélectionnable lorsque Clipboard échoue", async () => {
    window.history.pushState({}, "", "/codex/new");
    const { repository } = createCodexRepository();
    vi.spyOn(window, "open").mockReturnValue(null);

    renderForm(repository);
    const user = userEvent.setup();
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: vi.fn().mockRejectedValue(new Error("denied")) },
    });

    await user.type(screen.getByLabelText("Nom *"), "Nouvelle tâche");
    await user.type(screen.getByLabelText("Prompt *"), "Prompt conservé");
    await user.click(screen.getByRole("button", { name: "Lancer dans Codex" }));

    await screen.findByRole("button", { name: "Copier à nouveau" });
    const textareas = screen.getAllByDisplayValue("Prompt conservé");
    expect(textareas.some((textarea) => textarea.hasAttribute("readonly"))).toBe(
      true,
    );
  });
});
