import type { Page } from "@playwright/test";

export class EditOptionsPage {
  constructor(public readonly page: Page) {}

  async selectAllDay() {
    await this.page.click("[data-testid='all-day-option']");
  }
}
