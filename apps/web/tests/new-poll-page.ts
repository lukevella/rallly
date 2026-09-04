import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { PollPage } from "./poll-page";

export class NewPollPage {
  constructor(public readonly page: Page) {}

  async goto() {
    await this.page.goto("/new");
  }

  async create({
    name,
    enableComments,
  }: {
    name: string;
    enableComments?: boolean;
  }): Promise<PollPage> {
    const page = this.page;

    await page.getByLabel(/title|event/i).fill(name);
    await page.getByLabel("Location").fill("Online");

    // The description is a rich text editor revealed on demand, so open it, then
    // type into its contenteditable (fill() doesn't work on contenteditable).
    // A click that lands before React hydrates focuses the button natively but
    // drops the onClick, so retry until the editor actually mounts.
    const description = page.locator('#description[contenteditable="true"]');
    await expect(async () => {
      await page
        .getByRole("button", { name: /add description/i })
        .click({ timeout: 2000 });
      await expect(description).toBeVisible({ timeout: 2000 });
    }).toPass();
    await description.click();
    await description.pressSequentially(
      "Hey everyone, what time can you meet?",
    );

    await page.getByTitle("Next month").click();

    await page.getByText("5", { exact: true }).first().click();
    await page.getByText("7", { exact: true }).first().click();
    await page.getByText("10", { exact: true }).first().click();
    await page.getByText("15", { exact: true }).first().click();

    if (enableComments) {
      // Comments are off by default; opt in to the legacy comments setting
      await page.getByRole("switch", { name: /comments/i }).click();
    }

    await page.getByRole("button", { name: /^create poll$/i }).click();

    // Creation redirects to the poll page with the Share dialog open; the
    // poll page is what callers want, so dismiss the dialog before returning.
    await page.waitForURL(/\/poll\/[^/?]+/);
    const pollPage = new PollPage(page);
    await pollPage.closeDialog();
    await page
      .getByRole("dialog", { name: "Share" })
      .waitFor({ state: "hidden" });
    return pollPage;
  }
}
