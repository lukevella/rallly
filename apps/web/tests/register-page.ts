import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

import { getCode } from "./utils";

export class RegisterPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto("/register");
    await this.page.getByText("Create Your Account").waitFor();
  }

  async register({ name, email, password }: { name: string; email: string; password: string }) {
    // Fill in registration form
    await this.page.getByPlaceholder("Jessie Smith").fill(name);
    await this.page.getByPlaceholder("jessie.smith@example.com").fill(email);
    await this.page.getByPlaceholder("************").fill(password);

    await this.page
      .getByRole("button", { name: "Continue", exact: true })
      .click();

    // Handle verification code
    const code = await getCode(email);
    await this.page.getByText("Finish Logging In").waitFor();
    await this.page.getByPlaceholder("Enter your 6-digit code").fill(code);

    // Create space
    await this.page.getByRole("button", { name: "Create Space" }).click();

    // Verify successful registration
    await expect(this.page.getByText(name)).toBeVisible();
  }
}
