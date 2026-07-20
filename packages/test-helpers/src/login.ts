import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

import { getCode } from "./email";

export async function loginWithEmail(
  page: Page,
  { email, password }: { email: string; password?: string },
) {
  await page.goto("/login");
  await page.getByText("Welcome").waitFor();

  // The login form is visible before React has hydrated it, so input that
  // lands too early can be silently lost. Retry until the next screen
  // appears. The OTP is reused across resends (resendStrategy: "reuse"),
  // so submitting more than once is safe.
  await expect(async () => {
    await page.getByPlaceholder("jessie.smith@example.com").fill(email);
    await page.getByRole("button", { name: "Continue with email" }).click();
    await page
      .getByRole("heading", { name: /Verify Your Email|Finish Logging In/ })
      .or(page.getByLabel("Password"))
      .first()
      .waitFor({ timeout: 5000 });
  }).toPass();

  if (password) {
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Login with password" }).click();
  } else {
    const code = await getCode(email);
    await page.getByLabel("Enter your 6-digit code").fill(code);
  }

  // Wait until the login flow navigates away before handing control back
  // to the test. Waiting for "networkidle" returned too early — while the
  // verification request was still in flight — so tests could navigate
  // before the session cookie was set.
  await page.waitForURL((url) => !url.pathname.startsWith("/login"));
}
