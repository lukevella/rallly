import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";
import { NewPollPage } from "./new-poll-page";

/**
 * Standing accessibility regression check.
 *
 * Runs axe-core against the pages covered by the ACR evidence scans. Scope is
 * WCAG 2.1 A/AA. If this fails, either fix the violation or — only for issues
 * already documented in the ACR remediation backlog — add a scoped exclusion
 * with a reference to the relevant finding.
 */
const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

async function scan(page: Page) {
  // Settle animations and in-flight requests so contrast sampling is
  // deterministic.
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.waitForLoadState("networkidle");
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  return results.violations.map((violation) => ({
    id: violation.id,
    impact: violation.impact,
    help: violation.help,
    nodes: violation.nodes.map((node) => node.target.join(" ")),
  }));
}

test.describe("accessibility (axe-core, WCAG 2.1 A/AA)", () => {
  test("login page", async ({ page }) => {
    await page.goto("/login");
    await page.getByText("Welcome").waitFor();
    expect(await scan(page)).toEqual([]);
  });

  test("login verify page", async ({ page }) => {
    await page.goto("/login");
    await page.getByText("Welcome").waitFor();
    await expect(async () => {
      await page
        .getByPlaceholder("jessie.smith@example.com")
        .fill("a11y-scan@example.com");
      await page.getByRole("button", { name: "Continue with email" }).click();
      await page
        .getByRole("heading", { name: "Verify Your Email" })
        .waitFor({ timeout: 5000 });
    }).toPass();
    expect(await scan(page)).toEqual([]);
  });

  test.describe("invite page", () => {
    let inviteUrl: string;

    test.beforeAll(async ({ browser }) => {
      const page = await browser.newPage();
      const newPollPage = new NewPollPage(page);
      await newPollPage.goto();
      const dialog = await newPollPage.create({ name: "Accessibility Scan" });
      await dialog.goToPollPage();
      const match = page.url().match(/\/poll\/([a-zA-Z0-9]+)/);
      if (!match) {
        throw new Error(`could not extract poll id from ${page.url()}`);
      }
      inviteUrl = `/invite/${match[1]}`;
      await page.close();
    });

    test("desktop layout", async ({ page }) => {
      await page.goto(inviteUrl);
      await page.getByTestId("vote-selector").first().waitFor();
      expect(await scan(page)).toEqual([]);
    });

    test("mobile layout", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto(inviteUrl);
      await page.getByTestId("vote-selector").first().waitFor();
      expect(await scan(page)).toEqual([]);
    });
  });
});
