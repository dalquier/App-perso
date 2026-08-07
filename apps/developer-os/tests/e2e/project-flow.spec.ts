import { expect, test } from "@playwright/test";

test("hash routes survive refresh and browser Back/Forward under the Pages subpath", async ({
  page,
}) => {
  await page.goto("./#/settings/");
  await expect(page.getByRole("heading", { name: "Paramètres" })).toBeVisible();
  await expect(page).toHaveURL(/\/App-perso\/developer-os\/#\/settings\/$/);
  await page.reload();
  await expect(page.getByRole("heading", { name: "Paramètres" })).toBeVisible();

  await page.getByRole("link", { name: /DeveloperOS/ }).click();
  await expect(page.getByRole("heading", { name: "Mes projets" })).toBeVisible();
  await page.goBack();
  await expect(page.getByRole("heading", { name: "Paramètres" })).toBeVisible();
  await page.goForward();
  await expect(page.getByRole("heading", { name: "Mes projets" })).toBeVisible();
});

test("mobile project lifecycle persists after reload and navigates back", async ({
  page,
}) => {
  await page.goto("./");
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
  await page.goto("./");
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
  await page.goto("./");
  await expect(page.getByText("Offline Project")).toBeVisible();
  await page.reload();
  await expect(page.getByText("Offline Project")).toBeVisible();
  await context.setOffline(false);
});

test("long settings view scrolls and JSON import errors are handled", async ({
  page,
}) => {
  await page.goto("./#/settings");
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
  await page.goto("./");
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
