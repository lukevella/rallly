import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { EditOptionsPage } from "./edit-options-page";
import { InvitePage } from "./invite-page";

export class PollPage {
  constructor(public readonly page: Page) {}

  async closeShareDialog() {
    const dialog = this.page.getByRole("dialog", { name: "Share" });
    await dialog.getByRole("button", { name: "Close" }).click();
    await expect(dialog).toBeHidden();
  }

  async addComment() {
    const page = this.page;

    await page.getByRole("button", { name: "Comments" }).click();

    const sheet = page.getByRole("dialog", { name: "Comments" });
    await sheet.getByPlaceholder("Write a comment").fill("This is a comment!");
    await sheet.getByPlaceholder("Your name…").fill("Test user");

    await sheet.getByRole("button", { name: "Add comment" }).click();
  }

  async openShareDialog() {
    const dialog = this.page.getByRole("dialog", { name: "Share" });
    if (!(await dialog.isVisible())) {
      await this.page.getByRole("button", { name: "Share" }).click();
    }
    await expect(dialog).toBeVisible();
    return dialog;
  }

  async copyInviteLink() {
    const dialog = await this.openShareDialog();
    await dialog.getByRole("button", { name: "Copy" }).click();
    return (await this.page.evaluate(
      "navigator.clipboard.readText()",
    )) as string;
  }

  async editOptions() {
    const page = this.page;

    const pollUrl = page.url();
    await page.getByRole("button", { name: "Manage" }).click();

    await page.getByRole("menuitem", { name: "Edit options" }).click();

    await page.waitForURL(`${pollUrl}/edit-options`);

    return new EditOptionsPage(page);
  }

  async addParticipant(name: string, email?: string) {
    const page = this.page;
    await page.getByTestId("add-participant-button").click();

    await page.locator("data-testid=vote-selector >> nth=0").click();
    await page.locator("data-testid=vote-selector >> nth=2").click();
    await page.click("button >> text='Continue'");

    await page.type('[placeholder="Jessie Smith"]', name);
    if (email) {
      await page.type('[placeholder="jessie.smith@example.com"]', email);
    }

    await page.click("text='Save availability'");

    await expect(page.getByText("Your response has been saved")).toBeVisible();
    await page.click("button >> text='Back to poll'");
  }

  async gotoInvitePage() {
    const page = this.page;

    const inviteLink = await this.copyInviteLink();

    await page.goto(inviteLink);

    await page.waitForURL(inviteLink);
    return new InvitePage(page);
  }
}
