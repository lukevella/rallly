import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

export class InvitePage {
  constructor(public readonly page: Page) {}

  /** Each option is a group of radios named by its date and time. */
  options() {
    return this.page
      .getByRole("main")
      .locator("fieldset:has(input[type=radio])");
  }

  /** With a mouse the radios shrink away, so answer the way a keyboard does. */
  async answer(index: number, name: "Yes" | "If need be" | "No") {
    await this.options()
      .nth(index)
      .getByRole("radio", { name, exact: true })
      .focus();
    await this.page.keyboard.press("Space");
  }

  async addParticipant(name: string, email?: string) {
    const page = this.page;

    await this.answer(0, "Yes");
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByLabel("Name").fill(name);
    if (email) {
      await page.getByRole("textbox", { name: /^Email/ }).fill(email);
    }
    await page.getByRole("button", { name: "Confirm" }).click();

    await expect(
      page.getByRole("heading", { name: `Thanks, ${name}` }),
    ).toBeVisible();
  }
}
