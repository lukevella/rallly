import { test } from "@playwright/test";
import { screenshotPath } from "./helpers";

test("create poll", async ({ page }) => {
  await page.goto("/new");
  await page.waitForLoadState("networkidle");
  await page.screenshot({
    path: screenshotPath("create-poll"),
    fullPage: true,
  });
});
