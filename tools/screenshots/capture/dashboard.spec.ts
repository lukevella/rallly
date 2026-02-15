import { test } from "@playwright/test";
import { loginAsUser, screenshotPath } from "./helpers";

test("dashboard", async ({ page }) => {
  await loginAsUser(page, "pro-user");
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.screenshot({ path: screenshotPath("dashboard"), fullPage: true });
});
