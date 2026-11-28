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
    allDay,
    requireEmail = false,
  }: {
    name: string;
    enableComments?: boolean;
    /** Creates a date poll rather than the default time poll. */
    allDay?: boolean;
    /**
     * Keeps the default of requiring a participant email. Off unless asked
     * for, so specs can respond with just a name.
     */
    requireEmail?: boolean;
  }): Promise<PollPage> {
    const page = this.page;

    await page.getByLabel(/title|event/i).fill(name);

    // A click that lands before React hydrates is dropped, so retry until the
    // field shows.
    const locationField = page.getByLabel("Location", { exact: true });
    await expect(async () => {
      await page
        .getByRole("button", { name: "Add location" })
        .click({ timeout: 2000 });
      await expect(locationField).toBeVisible({ timeout: 2000 });
    }).toPass();
    await locationField.fill("Online");

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

    if (allDay) {
      await page.getByTestId("all-day-option").click();
    }

    const requireEmailSwitch = page.getByRole("switch", {
      name: /require email/i,
    });
    await expect(requireEmailSwitch).toBeChecked();
    if (!requireEmail) {
      await requireEmailSwitch.click();
      await expect(requireEmailSwitch).not.toBeChecked();
    }

    if (enableComments) {
      // Comments are off by default; opt in to the legacy comments setting
      await page.getByRole("switch", { name: /comments/i }).click();
    }

    await page.getByRole("button", { name: /^create poll$/i }).click();

    // The poll created dialog is the success signal. It carries the invite
    // link, whose last segment is the new poll's id; callers continue on the
    // poll's page.
    const dialog = page.getByRole("dialog", { name: "Poll created" });
    // Creating can take a while on a cold dev server, as the old wait for the
    // redirect allowed for.
    await expect(dialog).toBeVisible({ timeout: 30_000 });
    const inviteLink = await dialog
      .getByText(/\/invite\/[^/?\s]+$/)
      .textContent();
    const pollId = inviteLink?.trim().split("/").pop();
    if (!pollId) {
      throw new Error("No invite link in the poll created dialog");
    }
    // A client navigation, so the router keeps /new cached behind it for
    // specs that go back to it.
    await dialog.getByRole("link", { name: "Manage poll" }).click();
    await page.waitForURL(`**/poll/${pollId}`);
    return new PollPage(page);
  }
}
