import test, { expect } from "@playwright/test";

test("should show correct language if supported", async ({ browser }) => {
  const context = await browser.newContext({ locale: "de" });
  const page = await context.newPage();
  // Locale-sensitive Intl formatting must not differ between the server and
  // the browser — a mismatch makes React throw away the server HTML.
  const hydrationErrors: string[] = [];
  page.on("pageerror", (error) => {
    if (error.message.includes("Hydration failed")) {
      hydrationErrors.push(error.message);
    }
  });
  await page.goto("/new");
  await expect(page.locator("text=Titel")).toBeVisible();
  // "1 Std." only renders client-side, so it doubles as a hydration barrier.
  await expect(page.getByText("1 Std.", { exact: true })).toBeVisible();
  expect(hydrationErrors).toEqual([]);
});

test("should default to english", async ({ browser }) => {
  const context = await browser.newContext({ locale: "mt" });
  const page = await context.newPage();
  await page.goto("/new");
  await expect(page.locator("text=Title")).toBeVisible();
});
