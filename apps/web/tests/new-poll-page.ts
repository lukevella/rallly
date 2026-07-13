import type { Locator, Page } from "@playwright/test";
import { PollPage } from "./poll-page";

export class CreatePollSuccessDialog {
  constructor(private readonly page: Page) {}

  get dialog(): Locator {
    return this.page.getByRole("dialog");
  }

  async goToPollPage() {
    await this.page.getByRole("link", { name: "Manage" }).click();
    await this.page.waitForURL(/\/poll\/[^/]+/);
    await this.dialog.waitFor({ state: "detached" });
    return new PollPage(this.page);
  }
}

export class NewPollPage {
  constructor(public readonly page: Page) {}

  async goto() {
    await this.page.goto("/new");
  }

  async create({ name }: { name: string }): Promise<CreatePollSuccessDialog> {
    const page = this.page;

    await page.getByLabel(/title|event/i).fill(name);
    await page.getByLabel("Location").fill("Online");

    // The description is a rich text editor revealed on demand, so open it, then
    // type into its contenteditable (fill() doesn't work on contenteditable).
    await page.getByRole("button", { name: /add description/i }).click();
    const description = page.locator('#description[contenteditable="true"]');
    await description.click();
    await description.pressSequentially(
      "Hey everyone, what time can you meet?",
    );

    await page.getByTitle("Next month").click();

    await page.getByText("5", { exact: true }).first().click();
    await page.getByText("7", { exact: true }).first().click();
    await page.getByText("10", { exact: true }).first().click();
    await page.getByText("15", { exact: true }).first().click();

    await page.getByRole("button", { name: /create poll/i }).click();

    const successDialog = new CreatePollSuccessDialog(page);
    await successDialog.dialog.waitFor({ state: "visible" });
    return successDialog;
  }
}
