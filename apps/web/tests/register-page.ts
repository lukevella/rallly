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
      const verifyHeading = this.page.getByRole("heading", {
        name: "Verify your email",
      });
      // A previous attempt may have submitted successfully with the
      // navigation landing only after its wait expired — the login form is
      // gone at that point, so don't try to fill it again.
      if (await verifyHeading.isVisible()) {
        return;
      }
      await this.page.getByPlaceholder("jessie.smith@example.com").fill(email);
      await this.page
        .getByRole("button", { name: "Continue with email" })
        .click();
      await verifyHeading.waitFor({ timeout: 5000 });
    }).toPass();

    // Handle verification code
    const code = await getCode(email);
    await this.page.getByLabel("Enter your 6-digit code").fill(code);

    // New accounts have no name and go through onboarding. The space name
    // is prefilled, so only the name needs to be entered.
    await this.page
      .getByRole("heading", { name: "Set up your account" })
      .waitFor();

    // The setup page is reached via a full page load, so like the login
    // form it is visible before React hydrates it: a fill can be wiped when
    // the controlled input hydrates and a click can land before the submit
    // handler is attached. Retry until we navigate away. The setup action
    // is idempotent, so re-submitting is safe.
    await expect(async () => {
      if (!new URL(this.page.url()).pathname.includes("/setup")) {
        return;
      }
      await this.page.getByPlaceholder("Jessie Smith").fill(name);
      await this.page
        .getByRole("button", { name: "Continue", exact: true })
        .click();
      await this.page.waitForURL((url) => !url.pathname.includes("/setup"), {
        timeout: 5000,
      });
    }).toPass();

    // Verify successful registration
    await expect(this.page.getByText(name)).toBeVisible();
  }
}
