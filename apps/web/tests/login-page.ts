import type { Page } from "@playwright/test";

import { getCode } from "./utils";

export class LoginPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto("/login");
    await this.page.getByText("Welcome").waitFor();
  }

  async login({ email, password }: { email: string; password?: string }) {
    // Fill in email
    await this.page.getByPlaceholder("jessie.smith@example.com").fill(email);

    await this.page
      .getByRole("button", { name: "Continue with email" })
      .click();

    // If password is provided and the password field appears, use password login
    if (password) {
      await this.page.getByLabel("Password").fill(password);

      await this.page
        .getByRole("button", { name: "Login with password" })
        .click();
    } else {
      // Handle verification code for email OTP login
      const code = await getCode(email);
      await this.page
        .getByRole("heading", { name: "Finish Logging In" })
        .waitFor();
      await this.page.getByPlaceholder("Enter your 6-digit code").fill(code);
    }

    // Wait for page to load
    await this.page.waitForLoadState("networkidle");
  }
}
