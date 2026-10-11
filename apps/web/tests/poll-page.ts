import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { EditOptionsPage } from "./edit-options-page";
import { InvitePage } from "./invite-page";

export class PollPage {
  constructor(public readonly page: Page) {}

  private pollPath() {
    return new URL(this.page.url()).pathname.replace(/\/share$/, "");
  }

  /**
   * Step one of the share page asks a free host how the poll should reach
   * people. Picking Free keeps the poll on the free plan and opens the
   * share screen; a Pro host never sees the question.
   */
  async chooseFreeIfAsked() {
    const question = this.page.getByRole("heading", {
      name: /how should it reach people\?/i,
    });
    if (await question.isVisible()) {
      await this.page.getByRole("radio").first().click();
      await this.page.getByRole("button", { name: "Continue" }).click();
    }
    await expect(
      this.page.getByRole("heading", { name: "Share your poll" }),
    ).toBeVisible();
  }

  /** From the share page back to the poll page. */
  async leaveSharePage() {
    await this.page.goto(this.pollPath());
    await expect(this.page.getByRole("link", { name: "Share" })).toBeVisible();
  }

  async addComment() {
    const page = this.page;

    await page.getByRole("button", { name: "Comments" }).click();

    const sheet = page.getByRole("dialog", { name: "Comments" });
    await sheet.getByPlaceholder("Write a comment").fill("This is a comment!");
    await sheet.getByPlaceholder("Your name…").fill("Test user");

    await sheet.getByRole("button", { name: "Add comment" }).click();
  }

  /** The share page's content, opened through the Share button if needed. */
  async openSharePage() {
    if (!this.page.url().includes("/share")) {
      await this.page.getByRole("link", { name: "Share" }).click();
      await this.page.waitForURL(/\/share/);
    }
    await this.chooseFreeIfAsked();
    return this.page.getByRole("main");
  }

  async copyInviteLink() {
    const share = await this.openSharePage();
    await share.getByRole("button", { name: "Copy" }).click();
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
