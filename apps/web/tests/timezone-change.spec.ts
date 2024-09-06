import { expect, test } from "@playwright/test";

test.describe("Timezone Change", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.clear();
    });
  });

  test("does not show modal on initial load with no previous timezone", async ({
    page,
  }) => {
    await page.reload();
    const modal = page.locator("text=Timezone Change Detected");
    await expect(modal).toBeHidden();
  });

  test("does not show modal if stored timezone matches current timezone", async ({
    page,
  }) => {
    const currentTimeZone = await page.evaluate(
      () => Intl.DateTimeFormat().resolvedOptions().timeZone,
    );
    await page.evaluate(
      (tz) => localStorage.setItem("previousTimeZone", tz),
      currentTimeZone,
    );
    await page.reload();
    const modal = page.locator("text=Timezone Change Detected");
    await expect(modal).toBeHidden();
  });

  test("shows modal if stored timezone is different from current timezone", async ({
    page,
  }) => {
    await page.evaluate(() =>
      localStorage.setItem("previousTimeZone", "Fake/Timezone"),
    );
    await page.reload();
    const modal = page.locator("text=Timezone Change Detected");
    await expect(modal).toBeVisible();
  });

  test("accepting timezone change updates preferences and does not show modal again", async ({
    page,
  }) => {
    await page.evaluate(() =>
      localStorage.setItem("previousTimeZone", "Fake/Timezone"),
    );
    await page.reload();
    await page.click("text=Yes, update my timezone");
    await page.reload();
    const modal = page.locator("text=Timezone Change Detected");
    await expect(modal).toBeHidden();
  });

  test("declining timezone change updates localStorage but does not change preferences", async ({
    page,
  }) => {
    await page.evaluate(() =>
      localStorage.setItem("previousTimeZone", "Fake/Timezone"),
    );
    await page.reload();
    await page.click("text=No, keep the current timezone");
    await page.reload();
    const modal = page.locator("text=Timezone Change Detected");
    await expect(modal).toBeHidden();
  });

  test("does not show modal if localStorage is not available", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      Object.defineProperty(window, "localStorage", {
        value: undefined,
        writable: true,
      });
    });
    await page.reload();
    const modal = page.locator("text=Timezone Change Detected");
    await expect(modal).toBeHidden();
  });
});
