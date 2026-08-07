import { expect, test } from "@playwright/test";

test("mobile project lifecycle persists after reload and navigates back", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByText("Votre cockpit est prêt")).toBeVisible();
  await page
    .getByRole("link", { name: "Créer un projet", exact: true })
    .click();
  await page.getByLabel(/Nom/).fill("DeveloperOS");
  await page
    .getByRole("combobox", { name: "État", exact: true })
    .selectOption("active");
  await page
    .getByRole("combobox", { name: "Priorité", exact: true })
    .selectOption("high");
  await page
    .getByLabel("Prochaine action", { exact: true })
    .fill("Valider sur iPhone");
  await page
    .getByLabel("Dernier état connu", { exact: true })
    .fill("BUILD-01 prêt");
  await page.getByLabel("Source", { exact: true }).fill("dalquier/App-perso");
  await page.getByText("Définir comme projet actif").click();
  await page
    .locator("form")
    .getByRole("button", { name: "Enregistrer" })
    .last()
    .click();
  await expect(
    page.getByRole("heading", { name: "DeveloperOS" }),
  ).toBeVisible();
  await expect(page.getByText("● Projet actif")).toBeVisible();
  await page.reload();
  await expect(page.getByText("Valider sur iPhone")).toBeVisible();
  await page.getByRole("link", { name: "Modifier" }).click();
  await page
    .getByRole("combobox", { name: "Priorité", exact: true })
    .selectOption("critical");
  await page
    .locator("form")
    .getByRole("button", { name: "Enregistrer" })
    .last()
    .click();
  await expect(page.getByText("Critique")).toBeVisible();
  await page.getByRole("button", { name: /Retour/ }).click();
  await expect(
    page.getByRole("heading", { name: "Mes projets" }),
  ).toBeVisible();
});

test("offline production PWA serves cached app and preserves IndexedDB", async ({
  page,
  context,
}) => {
  await page.goto("/");
  await expect
    .poll(async () =>
      page.evaluate(() => navigator.serviceWorker.controller?.state ?? "none"),
    )
    .not.toBe("none");
  await page
    .getByRole("link", { name: "Créer un projet", exact: true })
    .click();
  await page.getByLabel(/Nom/).fill("Offline Project");
  await page.getByLabel("Source", { exact: true }).fill("dalquier/App-perso");
  await page
    .locator("form")
    .getByRole("button", { name: "Enregistrer" })
    .last()
    .click();
  await expect(
    page.getByRole("heading", { name: "Offline Project" }),
  ).toBeVisible();
  await context.setOffline(true);
  await page.goto("/");
  await expect(page.getByText("Offline Project")).toBeVisible();
  await page.reload();
  await expect(page.getByText("Offline Project")).toBeVisible();
  await context.setOffline(false);
});

test("long settings view scrolls and JSON import errors are handled", async ({
  page,
}) => {
  await page.goto("/settings");
  await expect(page.getByRole("heading", { name: "Paramètres" })).toBeVisible();
  await page.locator("input[type=file]").setInputFiles({
    name: "bad.json",
    mimeType: "application/json",
    buffer: Buffer.from('{"bad":true}'),
  });
  await expect(page.getByRole("status")).toContainText("incompatible");
  await page.getByText("DeveloperOS 0.1.0").scrollIntoViewIfNeeded();
  await expect(page.getByText("DeveloperOS 0.1.0")).toBeVisible();
});

test("archive appears in archives, restores inactive and persists after reload", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Nouvelle création rapide" }).click();
  await page.getByLabel(/Nom/).fill("Archivable");
  await page.getByRole("combobox", { name: "État", exact: true }).selectOption("active");
  await page.getByLabel("Source", { exact: true }).fill("dalquier/App-perso");
  await page.getByText("Définir comme projet actif").click();
  await page.locator("form").getByRole("button", { name: "Enregistrer" }).last().click();
  await expect(page.getByText("● Projet actif")).toBeVisible();

  page.once("dialog", async (dialog) => {
    expect(dialog.message()).toContain("restaurable");
    await dialog.dismiss();
  });
  await page.getByRole("button", { name: "Archiver le projet" }).click();
  await expect(page.getByRole("heading", { name: "Archivable" })).toBeVisible();

  page.once("dialog", async (dialog) => {
    expect(dialog.message()).toContain("restaurable");
    await dialog.accept();
  });
  await page.getByRole("button", { name: "Archiver le projet" }).click();
  await expect(page.getByRole("heading", { name: "Mes projets" })).toBeVisible();
  await expect(page.getByText("Archivable")).toBeHidden();
  await expect(page.getByText("Aucun projet actif")).toBeVisible();

  await page.getByRole("link", { name: "Paramètres" }).click();
  await page.getByRole("link", { name: "Projets archivés" }).click();
  await page.getByRole("link", { name: /Archivable/ }).click();
  await expect(page.getByRole("button", { name: "Restaurer le projet" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Définir comme projet actif" })).toBeHidden();
  await page.getByRole("button", { name: "Restaurer le projet" }).click();
  await expect(page.getByText("En pause")).toBeVisible();
  await expect(page.getByRole("button", { name: "Définir comme projet actif" })).toBeVisible();
  await page.reload();
  await expect(page.getByText("En pause")).toBeVisible();
  await expect(page.getByText("● Projet actif")).toBeHidden();
});

test("mobile resume, secure reference and project import preserve Codex and run data", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Nouvelle création rapide" }).click();
  await page.getByLabel(/Nom/).fill("BUILD-02R");
  await page.getByLabel("Source", { exact: true }).fill("dalquier/App-perso");
  await page.locator("form").getByRole("button", { name: "Enregistrer" }).last().click();
  await page.getByLabel("Point de reprise courant").fill("Relire la PR");
  await page.getByRole("button", { name: "Enregistrer la reprise" }).click();
  await page.getByLabel("Libellé").fill("Documentation");
  await page.getByLabel("URL HTTPS").fill("https://example.com/docs");
  await page.getByRole("button", { name: "Ajouter la référence" }).click();
  await page.evaluate(async () => {
    const request = indexedDB.open("developeros");
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const tx = db.transaction(["codexConversations", "conversation-runs"], "readwrite");
    tx.objectStore("codexConversations").put({ id: "e2e-codex", name: "Conversation conservée", updatedAt: new Date().toISOString() });
    tx.objectStore("conversation-runs").put({ run_id: "e2e-run", updated_at: new Date().toISOString() });
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  });
  await page.reload();
  await expect(
    page.getByRole("textbox", { name: "Point de reprise courant" }),
  ).toHaveValue("Relire la PR");
  const history = page.getByRole("heading", { name: "Historique" }).locator("..");
  await expect(history.getByText("Relire la PR", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Ouvrir" })).toHaveAttribute("rel", "noopener noreferrer");
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Supprimer" }).click();
  await expect(page.getByText("Référence supprimée.")).toBeVisible();
  await page.goto("/settings");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Exporter" }).click();
  const exportDownload = await download;
  expect(exportDownload.suggestedFilename()).toContain("developeros-export");
  const exportedPath = await exportDownload.path();
  expect(exportedPath).toBeTruthy();
  const backup = page.waitForEvent("download");
  await page.locator("input[type=file]").setInputFiles(exportedPath!);
  await backup;
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Confirmer" }).click();
  await expect(page.getByRole("status")).toContainText("Import terminé");
  const preserved = await page.evaluate(async () => {
    const request = indexedDB.open("developeros");
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const codexConversation = await new Promise<boolean>((resolve) => {
      const get = db.transaction("codexConversations").objectStore("codexConversations").get("e2e-codex");
      get.onsuccess = () => resolve(Boolean(get.result));
    });
    const conversationRun = await new Promise<boolean>((resolve) => {
      const get = db.transaction("conversation-runs").objectStore("conversation-runs").get("e2e-run");
      get.onsuccess = () => resolve(Boolean(get.result));
    });
    const stores = Array.from(db.objectStoreNames);
    const version = db.version;
    db.close();
    return { codexConversation, conversationRun, stores, version };
  });
  expect(preserved.codexConversation).toBe(true);
  expect(preserved.conversationRun).toBe(true);
  expect(preserved.stores).toEqual(expect.arrayContaining(["projects", "codexConversations", "conversation-runs"]));
  expect(preserved.version).toBe(3);
});
