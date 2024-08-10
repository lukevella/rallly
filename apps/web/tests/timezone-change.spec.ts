import { test } from "@playwright/test";

test.describe("Timezone change", () => {
  test("should show a dialog when the timezone changes", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.setItem("previousTimeZone", "some other timezone");
    });
    await page.reload();
    await page.waitForSelector("text=Timezone Change Detected");
  });

  test("should not show a dialog when the timezone does not change", async ({
    page,
  }) => {
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.setItem(
        "previousTimeZone",
        Intl.DateTimeFormat().resolvedOptions().timeZone,
      );
    });
    await page.reload();
    await page.waitForSelector("text=Timezone Change Detected", {
      state: "detached",
    });
  });

  test("should not show dialog after user accepts a change", async ({
    page,
  }) => {
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.setItem("previousTimeZone", "some other timezone");
    });
    await page.reload();
    await page.waitForSelector("text=Timezone Change Detected");
    await page.click("text=Yes, update my timezone");
    await page.reload();
    await page.waitForSelector("text=Timezone Change Detected", {
      state: "detached",
    });
  });

  test("should not show dialog after user declines a change", async ({
    page,
  }) => {
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.setItem("previousTimeZone", "some other timezone");
    });
    await page.reload();
    await page.waitForSelector("text=Timezone Change Detected");
    await page.click("text=No, keep the current timezone");
    await page.reload();
    await page.waitForSelector("text=Timezone Change Detected", {
      state: "detached",
    });
  });

  test.describe("when localStorage is not available", () => {
    test.beforeEach(async ({ page }) => {
      await page.evaluate(() => {
        Object.defineProperty(window, "localStorage", {
          value: undefined,
          writable: true,
        });
      });
    });

    test("should not show a dialog when the timezone changes", async ({
      page,
    }) => {
      await page.goto("/");
      await page.reload();
      await page.waitForSelector("text=Timezone Change Detected", {
        state: "detached",
      });
    });
  });
});
