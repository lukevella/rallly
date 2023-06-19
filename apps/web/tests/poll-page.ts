import { Page } from "@playwright/test";
import { EditOptionsPage } from "tests/edit-options-page";
import { InvitePage } from "tests/invite-page";

export class PollPage {
  constructor(public readonly page: Page) {}

  async closeDialog() {
    const page = this.page;

    const dialog = page.getByRole("dialog");

    await dialog.waitFor({ state: "visible" });

    const closeDialogButton = dialog.getByRole("button", { name: "Close" });

    await closeDialogButton.waitFor({ state: "visible" });

    await closeDialogButton.click();
  }

  async addComment() {
    const page = this.page;

    await page.getByText("Leave a comment on this poll").click();
    await page
      .getByPlaceholder("Leave a comment on this poll")
      .fill("This is a comment!");
    await page.getByPlaceholder("Your name…").fill("Test user");

    await page.getByRole("button", { name: "Add Comment" }).click();
  }

  async openShareDialog() {
    const page = this.page;

    await page.getByRole("button", { name: "Share" }).click();

    return page.getByRole("dialog");
  }

  async copyInviteLink() {
    this.openShareDialog();
    await this.page.getByRole("button", { name: "invite/" }).click();
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

    await page.click("text='Submit'");
  }

  async gotoInvitePage() {
    const page = this.page;

    const inviteLink = await this.copyInviteLink();

    await page.goto(inviteLink);

    await page.waitForURL(inviteLink);
    return new InvitePage(page);
  }
}
