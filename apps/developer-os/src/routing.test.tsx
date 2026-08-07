import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AppRouter, Link, routeFromHash, RouterSwitch } from "./routing";

describe("hash routing", () => {
  it.each([
    ["", "/"],
    ["#/settings", "/settings"],
    ["#/projects/", "/projects"],
    ["#/codex/", "/codex"],
  ])("normalizes %s to %s", (hash, expected) => {
    expect(routeFromHash(hash)).toBe(expected);
  });

  it("navigates inside the hash and supports browser history", async () => {
    history.replaceState(null, "", "/App-perso/developer-os/#/");
    render(
      <AppRouter>
        <Link to="/settings">Settings</Link>
        <RouterSwitch routes={{ "/": <>Home</>, "/settings": <>Settings page</> }} fallback={<>Missing</>} />
      </AppRouter>,
    );

    fireEvent.click(screen.getByRole("link", { name: "Settings" }));
    expect(location.hash).toBe("#/settings");
    expect(screen.getByText("Settings page")).toBeInTheDocument();

    history.back();
    await waitFor(() => expect(screen.getByText("Home")).toBeInTheDocument());
  });

  it("matches a dynamic route after refresh initialization", () => {
    history.replaceState(null, "", "/App-perso/developer-os/#/projects/project-1");
    render(
      <AppRouter>
        <RouterSwitch routes={{ "/projects/:id": <>Project detail</> }} fallback={<>Missing</>} />
      </AppRouter>,
    );
    expect(screen.getByText("Project detail")).toBeInTheDocument();
  });
});
