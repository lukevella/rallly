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

    await page.getByRole("button", { name: /^create poll$/i }).click();

    // Landing on the share page is the success signal. A free host is asked
    // how the poll should reach people first; a Pro host is on the share
    // screen straight away.
    await page.waitForURL(/\/poll\/[^/?]+\/share\?created/);
    const pollPage = new PollPage(page);
    await pollPage.chooseFreeIfAsked();

    if (enableComments) {
      // Comments are off by default; the switch lives on the share page's
      // creation visit, on both routes.
      await page.getByRole("switch", { name: /comments/i }).click();
      await expect(
        page.getByRole("switch", { name: /comments/i }),
      ).toBeChecked();
    }

    return pollPage;
  }
}
