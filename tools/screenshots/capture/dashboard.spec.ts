import { test } from "@playwright/test";
import { loginWithEmail, screenshotPath } from "./helpers";

test("dashboard", async ({ page }) => {
  await loginWithEmail(page, "dev+pro@rallly.co");
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.screenshot({ path: screenshotPath("dashboard"), fullPage: true });
});
