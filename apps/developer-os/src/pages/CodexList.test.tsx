import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CodexProvider } from "../data/CodexContext";
import type { CodexRepository } from "../data/codexRepository";
import { AppRouter, Link, RouterSwitch } from "../routing";
import { CodexList } from "./CodexList";

const repository: CodexRepository = {
  list: async () => [],
  get: async () => undefined,
  save: vi.fn(async (value) => value),
  delete: vi.fn(),
  merge: vi.fn(async () => ({ added: 0, updated: 0, skipped: 0 })),
};

describe("CodexList navigation", () => {
  it("offers a Back control that returns to the real navigation origin", async () => {
    history.replaceState(null, "", "/#/");
    render(
      <AppRouter>
        <CodexProvider repository={repository}>
          <Link to="/codex">Ouvrir Codex</Link>
          <RouterSwitch
            routes={{ "/": <h1>Origine</h1>, "/codex": <CodexList /> }}
            fallback={<p>Introuvable</p>}
          />
        </CodexProvider>
      </AppRouter>,
    );

    await userEvent.click(screen.getByRole("link", { name: "Ouvrir Codex" }));
    expect(
      await screen.findByRole("button", { name: "‹ Retour" }),
    ).toBeVisible();
    expect(screen.getByRole("link", { name: "Projets" })).toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: "‹ Retour" }));

    expect(
      await screen.findByRole("heading", { name: "Origine" }),
    ).toBeVisible();
  });
});
