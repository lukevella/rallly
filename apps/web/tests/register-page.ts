import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

import { getCode } from "@rallly/test-helpers";

/**
 * Registration happens through the combined login flow: an email that
 * doesn't have an account gets one created on OTP verification, followed by
 * name onboarding.
 */
export class RegisterPage {
  constructor(private readonly page: Page) {}

  async goto() {
    // /register redirects to the combined login/sign up page
    await this.page.goto("/register");
    await this.page.getByText("Welcome").waitFor();
  }

  async register({ name, email }: { name: string; email: string }) {
    // Request a verification code
    await this.page.getByPlaceholder("jessie.smith@example.com").fill(email);
    await this.page
      .getByRole("button", { name: "Continue with email" })
      .click();

    // Handle verification code
    const code = await getCode(email);
    await this.page
      .getByRole("heading", { name: "Verify Your Email" })
      .waitFor();
    await this.page.getByLabel("Enter your 6-digit code").fill(code);

    // New accounts have no name and go through onboarding
    await this.page
      .getByRole("heading", { name: "What's your name?" })
      .waitFor();
    await this.page.getByPlaceholder("Jessie Smith").fill(name);
    await this.page
      .getByRole("button", { name: "Continue", exact: true })
      .click();

    // Verify successful registration
    await expect(this.page.getByText(name)).toBeVisible();
  }
}
