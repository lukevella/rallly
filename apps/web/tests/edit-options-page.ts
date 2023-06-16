import { Page } from "@playwright/test";

export class EditOptionsPage {
  constructor(public readonly page: Page) {}

  async switchToSpecifyTimes() {
    await this.page.click("[data-testid='specify-times-switch']");
  }
}
