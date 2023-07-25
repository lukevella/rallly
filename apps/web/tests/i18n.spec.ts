import test, { expect } from "@playwright/test";

test("should show correct language if supported", async ({ browser }) => {
  const context = await browser.newContext({ locale: "de" });
  const page = await context.newPage();
  await page.goto("/new");
  await expect(page.locator("text=Titel")).toBeVisible();
});

test("should default to english", async ({ browser }) => {
  const context = await browser.newContext({ locale: "mt" });
  const page = await context.newPage();
  await page.goto("/new");
  await expect(page.locator("text=Title")).toBeVisible();
});
