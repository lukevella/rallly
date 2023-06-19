import { Page } from "@playwright/test";
import { PollPage } from "tests/poll-page";

export class NewPollPage {
  constructor(public readonly page: Page) {}

  async goto() {
    await this.page.goto("/new");
  }

  async createPollAndCloseDialog() {
    const pollPage = await this.createPoll();
    await pollPage.closeDialog();
    return pollPage;
  }
  async createPoll() {
    const page = this.page;

    await page.type('[placeholder="Monthly Meetup"]', "Monthly Meetup");
    // click on label to focus on input
    await page.click('text="Location"');
    await page.keyboard.type("Joe's Coffee Shop");

    await page.click('text="Description"');

    await page.keyboard.type("This is a test description");

    await page.click('text="Continue"');

    await page.click('[title="Next month"]');

    // Select a few days
    await page.click("text=/^5$/");
    await page.click("text=/^7$/");
    await page.click("text=/^10$/");
    await page.click("text=/^15$/");

    await page.click('text="Continue"');

    await page.type('[placeholder="Jessie Smith"]', "John");
    await page.type(
      '[placeholder="jessie.smith@example.com"]',
      "john.doe@example.com",
    );

    await page.click('text="Create poll"');

    return new PollPage(page);
  }
}
