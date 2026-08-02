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
    await this.page.goto("/login");
    await this.page.getByText("Welcome").waitFor();
  }

  async register({ name, email }: { name: string; email: string }) {
    // The login form is visible before React has hydrated it, so input that
    // lands too early can be silently lost. Retry until the next screen
    // appears. The OTP is reused across resends (resendStrategy: "reuse"),
    // so submitting more than once is safe.
    await expect(async () => {
      await this.page.getByPlaceholder("jessie.smith@example.com").fill(email);
      await this.page
        .getByRole("button", { name: "Continue with email" })
        .click();
      await this.page
        .getByRole("heading", { name: "Verify Your Email" })
        .waitFor({ timeout: 5000 });
    }).toPass();

    // Handle verification code
    const code = await getCode(email);
    await this.page.getByLabel("Enter your 6-digit code").fill(code);

    // New accounts have no name and go through onboarding. The space name
    // is prefilled, so only the name needs to be entered.
    await this.page
      .getByRole("heading", { name: "Set Up Your Account" })
      .waitFor();
    await this.page.getByPlaceholder("Jessie Smith").fill(name);
    await this.page
      .getByRole("button", { name: "Continue", exact: true })
      .click();

    // Verify successful registration
    await expect(this.page.getByText(name)).toBeVisible();
  }
}
