import { describe, expect, it } from "vitest";
import { emptyDraft, validateCanonicalSource, validateDraft } from "./project";

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
