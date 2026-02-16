import { test } from "@playwright/test";
import { screenshotPath } from "./helpers";

test("login page", async ({ page }) => {
  await page.goto("/login");
  await page.getByText("Welcome").waitFor();
  await page.screenshot({ path: screenshotPath("login"), fullPage: true });
});
