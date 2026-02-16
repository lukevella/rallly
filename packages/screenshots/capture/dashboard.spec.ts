import { test } from "@playwright/test";
import { loginWithEmail } from "@rallly/test-helpers";
import { screenshotPath } from "./helpers";

test("dashboard", async ({ page }) => {
  await loginWithEmail(page, { email: "dev+pro@rallly.co" });
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.screenshot({ path: screenshotPath("dashboard"), fullPage: true });
});
