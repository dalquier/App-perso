import { describe, expect, it } from "vitest";
import { makeExport, parseExport } from "./export";
import type { Project } from "./project";

const project = (overrides: Partial<Project> = {}): Project => ({
  id: crypto.randomUUID(),
  schemaVersion: 1,
  name: "DeveloperOS",
  aliases: [],
  status: "active",
  priority: "high",
  nextAction: "Review",
  canonicalSourceType: "github_repo",
  canonicalSource: "dalquier/App-perso",
  lastKnownState: "Ready",
  isActive: true,
  createdAt: "2026-08-04T00:00:00.000Z",
  updatedAt: "2026-08-04T00:00:00.000Z",
  ...overrides,
});

describe("export contract", () => {
  it("round-trips canonical projects", () => {
    const exported = makeExport([project()]);
    expect(parseExport(exported).projects).toHaveLength(1);
  });

  it("drops unknown ordinary fields with warnings", () => {
    const raw = makeExport([
      { ...project(), unexpected: "drop me" } as Project,
    ]);
    const parsed = parseExport(raw);
    expect(parsed.warnings[0]).toContain("champs ignorés");
    expect("unexpected" in parsed.projects[0]).toBe(false);
  });

  it("rejects dangerous keys, dangerous sources, invalid dates and multiple active projects", () => {
    expect(() =>
      parseExport(
        JSON.parse(
          '{"app":"DeveloperOS","schemaVersion":1,"exportedAt":"2026-08-04T00:00:00.000Z","projects":[{"__proto__":{},"id":"x"}]}',
        ),
      ),
    ).toThrow(/dangereuse/);
    expect(() =>
      parseExport(
        makeExport([project({ canonicalSource: "data:text/html,hi" })]),
      ),
    ).toThrow(/protocole/);
    expect(() =>
      parseExport(
        makeExport([project({ updatedAt: "2026-08-03T00:00:00.000Z" })]),
      ),
    ).toThrow(/updatedAt/);
    expect(() =>
      parseExport(makeExport([project({ id: "1" }), project({ id: "2" })])),
    ).toThrow(/plusieurs projets actifs/);
    expect(() =>
      parseExport(
        makeExport([project({ status: "archived", isActive: true })]),
      ),
    ).toThrow(/archivé/);
  });

  it("creates a backup export that can be reimported", () => {
    const backup = makeExport([project({ isActive: false })]);
    expect(parseExport(backup).projects[0].name).toBe("DeveloperOS");
  });
});
