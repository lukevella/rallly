import type { Page } from "@playwright/test";

import { getCode } from "./utils";

export class LoginPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto("/login");
    await this.page.getByText("Welcome").waitFor();
  }

  async login({ email }: { email: string }) {
    // Fill in registration form
    await this.page.getByPlaceholder("jessie.smith@example.com").fill(email);

    await this.page
      .getByRole("button", { name: "Continue with Email", exact: true })
      .click();

    // Handle verification code
    const code = await getCode(email);
    await this.page.getByText("Finish Logging In").waitFor();
    await this.page.getByPlaceholder("Enter your 6-digit code").fill(code);
  }
}
