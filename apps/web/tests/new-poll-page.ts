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

    // "Add location" is a menu when the organizer can add a video call and a
    // plain button otherwise; either way the address field appears after.
    // Exact label: the open menu is also named "Add location". A click that
    // lands before React hydrates is dropped, so retry until the field shows.
    const locationField = page.getByLabel("Location", { exact: true });
    await expect(async () => {
      await page
        .getByRole("button", { name: "Add location" })
        .click({ timeout: 2000 });
      const addressItem = page.getByRole("menuitem", { name: "Address" });
      await addressItem.or(locationField).first().waitFor({ timeout: 2000 });
      if (await addressItem.isVisible()) {
        await addressItem.click();
      }
      await expect(locationField).toBeVisible({ timeout: 2000 });
    }).toPass();
    await locationField.fill("Online");
    await page
      .getByRole("button", { name: "Add directions or a link" })
      .click();
    await page
      .getByLabel("Additional information", { exact: true })
      .fill("Ring the bell at the side door");

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

    // The Share dialog opening on the poll page is the success signal, so
    // assert it here; callers that need the page behind it close it.
    await page.waitForURL(/\/poll\/[^/?]+/);
    await expect(page.getByRole("dialog", { name: "Share" })).toBeVisible();
    return new PollPage(page);
  }
}
