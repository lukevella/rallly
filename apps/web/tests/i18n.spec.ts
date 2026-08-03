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
  // A pill only reacts to clicks once hydration is done, so a successful
  // selection proves the page hydrated before we assert on errors.
  await page.getByTestId("all-day-option").click();
  await expect(page.getByTestId("all-day-option")).toHaveAttribute(
    "data-checked",
    "",
  );
  expect(hydrationErrors).toEqual([]);
});

test("should default to english", async ({ browser }) => {
  const context = await browser.newContext({ locale: "mt" });
  const page = await context.newPage();
  await page.goto("/new");
  await expect(page.locator("text=Title")).toBeVisible();
});
