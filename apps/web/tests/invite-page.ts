import { Page } from "@playwright/test";

export class InvitePage {
  constructor(public readonly page: Page) {}

  async addParticipant(name: string, email?: string) {
    const page = this.page;

    await page.locator("data-testid=vote-selector >> nth=0").click();
    await page.locator("data-testid=vote-selector >> nth=2").click();
    await page.click("button >> text='Continue'");

    await page.type('[placeholder="Jessie Smith"]', name);
    if (email) {
      await page.type('[placeholder="jessie.smith@example.com"]', email);
    }

    await page.click("text='Submit'");
  }
}
