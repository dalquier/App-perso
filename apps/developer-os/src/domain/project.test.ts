import { describe, expect, it } from "vitest";
import { addReference, addResume, createProject, emptyDraft, validateCanonicalSource, validateDraft, validateReferenceUrl } from "./project";

describe("project validation", () => {
  it("prefills the canonical GitHub repository for new projects", () => {
    const draft = emptyDraft();
    expect(draft.canonicalSourceType).toBe("github_repo");
    expect(draft.canonicalSource).toBe("dalquier/App-perso");
  });

  it("rejects dangerous canonical sources", () => {
    expect(validateCanonicalSource("other", "javascript:alert(1)")).toMatch(
      /protocole/,
    );
    expect(
      validateCanonicalSource(
        "github_repo",
        "https://user:pass@github.com/dalquier/App-perso",
      ),
    ).toMatch(/identifiants/);
    expect(
      validateCanonicalSource(
        "github_repo",
        "http://github.com/dalquier/App-perso",
      ),
    ).toMatch(/HTTPS/);
    expect(validateCanonicalSource("local_folder", "script.sh")).toMatch(
      /exécutable/,
    );
  });

  it("accepts documented canonical source formats", () => {
    expect(
      validateCanonicalSource("github_repo", "dalquier/App-perso"),
    ).toBeNull();
    expect(
      validateCanonicalSource(
        "github_path",
        "dalquier/App-perso/blob/main/apps/developer-os",
      ),
    ).toBeNull();
    expect(
      validateCanonicalSource(
        "replit",
        "https://developer-os.damien.replit.app",
      ),
    ).toBeNull();
    expect(
      validateCanonicalSource("local_folder", "iCloud Drive/ProjectOS"),
    ).toBeNull();
  });

  it("rejects archived active projects and long fields", () => {
    const draft = emptyDraft();
    draft.name = "A".repeat(121);
    draft.status = "archived";
    draft.isActive = true;
    const errors = validateDraft(draft);
    expect(errors.name).toBeTruthy();
    expect(errors.isActive).toBeTruthy();
  });
});

describe("manual resume and references", () => {
  it("bounds immutable resume history from 99 to 100 then prunes the oldest at 101", () => {
    const source = createProject({ ...emptyDraft(), name: "Projet" });
    const history = Array.from({ length: 99 }, (_, index) => ({ id: `${index}`, text: `Étape ${index}`, createdAt: new Date(Date.UTC(2026, 0, 1, 0, index)).toISOString() }));
    const at100 = addResume({ ...source, resumeHistory: history }, "Étape 100", "2026-08-07T10:00:00.000Z", "100");
    const at101 = addResume(at100, "Étape 101", "2026-08-07T11:00:00.000Z", "101");
    expect(at100.resumeHistory).toHaveLength(100);
    expect(at101.resumeHistory).toHaveLength(100);
    expect(at101.resumeHistory?.[0].text).toBe("Étape 101");
    expect(at101.resumeHistory?.some((entry) => entry.id === "98")).toBe(false);
    expect(source.resumeHistory).toEqual([]);
    expect(Date.parse(at101.updatedAt)).not.toBeNaN();
  });

  it("does not duplicate the current resume and rejects archived mutations", () => {
    const source = addResume(createProject({ ...emptyDraft(), name: "Projet" }), "Reprendre ici");
    expect(addResume(source, " Reprendre ici ").resumeHistory).toHaveLength(1);
    expect(() => addResume({ ...source, status: "archived" }, "Autre")).toThrow(/Restaurez/);
  });

  it("accepts only absolute credential-free HTTPS references", () => {
    expect(validateReferenceUrl("https://example.com/doc")).toBeNull();
    for (const unsafe of ["http://example.com", "javascript:alert(1)", "data:text/plain,x", "file:///tmp/x", "/relative", "https://user:pass@example.com"]) expect(validateReferenceUrl(unsafe)).not.toBeNull();
    const project = createProject({ ...emptyDraft(), name: "Projet" });
    expect(addReference(project, " Documentation ", "https://example.com").references?.[0].label).toBe("Documentation");
  });
});
