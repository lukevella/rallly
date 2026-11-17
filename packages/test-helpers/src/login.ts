import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

import { getCode } from "./email";
import { skipPendingMessages } from "./mailpit";

export async function loginWithEmail(
  page: Page,
  { email, password }: { email: string; password?: string },
) {
  // getCode reads the oldest unread email for the address. Anything a
  // previous test or run left unread would be taken for the code email.
  await skipPendingMessages(email);

  await page.goto("/login");
  // React reveals streamed Suspense content paint-aligned, so the page can
  // briefly hold a second hidden copy of the heading. A text locator
  // strict-fails on that window; getByRole ignores hidden elements and
  // .first() tolerates the duplicate.
  await page.getByRole("heading", { name: "Welcome" }).first().waitFor();

  const nextScreen = page
    .getByRole("heading", { name: /Verify your email|Finish logging in/ })
    .or(page.getByLabel("Password"))
    .first();

  // The login form is visible before React has hydrated it, so input that
  // lands too early can be silently lost. Retry until the next screen
  // appears. The OTP is reused across resends (resendStrategy: "reuse"),
  // so submitting more than once is safe. The actions are bounded because
  // the form is gone once a slow navigation lands between attempts, and an
  // unbounded fill would wait for it until the test times out.
  await expect(async () => {
    if (!(await nextScreen.isVisible())) {
      await page
        .getByPlaceholder("jessie.smith@example.com")
        .fill(email, { timeout: 5000 });
      await page
        .getByRole("button", { name: "Continue with email" })
        .click({ timeout: 5000 });
    }
    await nextScreen.waitFor({ timeout: 5000 });
  }).toPass();

  if (password) {
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Login with password" }).click();
  } else {
    const code = await getCode(email);
    // /login/verify is a full page load, so the same streamed-copy window
    // as the heading above applies: getByLabel matches the hidden staging
    // copy of the OTP input too, getByRole does not.
    const codeInput = page.getByRole("textbox", {
      name: "Enter your 6-digit code",
    });
    // Same hydration race as the email step: a code filled too early never
    // submits. Clearing first makes the refill register as a change.
    await expect(async () => {
      if (new URL(page.url()).pathname.startsWith("/login")) {
        await codeInput.fill("", { timeout: 5000 });
        await codeInput.fill(code, { timeout: 5000 });
      }
      await page.waitForURL((url) => !url.pathname.startsWith("/login"), {
        timeout: 5000,
      });
    }).toPass();
  }

  // Wait until the login flow navigates away before handing control back
  // to the test. Waiting for "networkidle" returned too early — while the
  // verification request was still in flight — so tests could navigate
  // before the session cookie was set.
  await page.waitForURL((url) => !url.pathname.startsWith("/login"));
}
