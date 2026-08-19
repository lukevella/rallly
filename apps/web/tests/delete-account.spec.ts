import { expect, test } from "@playwright/test";
import { prisma } from "@rallly/database";
import { deleteAllMessages, getCode } from "@rallly/test-helpers";
import { RegisterPage } from "./register-page";

const testUser = {
  name: "Delete Me",
  email: "delete-account-test@example.com",
};

test.describe.serial(() => {
  test.beforeAll(async () => {
    await deleteAllMessages();
  });

  test.afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: testUser.email },
    });
  });

  test("account deletion requires the emailed code", async ({ page }) => {
    const registerPage = new RegisterPage(page);
    await registerPage.goto();
    await registerPage.register(testUser);

    await page.goto("/settings/profile");

    // "Delete account" names the trigger, the dialog and its confirm button,
    // so every locator here is scoped: an unscoped one matches three elements
    // and Playwright clicks whichever it resolves first.
    const dialog = page.getByRole("dialog", { name: "Delete account" });

    await page
      .getByRole("main")
      .getByRole("button", { name: "Delete account", exact: true })
      .click();

    await dialog.waitFor();

    // The dialog renders before React attaches its handlers, so a click can
    // land on a button that does nothing yet. Retry until the step advances.
    // Each request mints a fresh code and invalidates the previous one, and
    // getCode reads the newest unread email, so a repeated click is safe.
    const verifyHeading = page.getByRole("heading", {
      name: "Confirm your account deletion",
    });
    await expect(async () => {
      if (await verifyHeading.isVisible()) {
        return;
      }
      await dialog
        .getByRole("button", { name: "Delete account", exact: true })
        .click();
      await verifyHeading.waitFor({ timeout: 5000 });
    }).toPass();

    // A wrong code must not delete the account: the check this replaced ran
    // only in the browser, so the server accepted any session.
    await page.getByLabel("Enter your 6-digit code").fill("000000");

    await expect(page.getByText("This code is incorrect")).toBeVisible();

    const survivingUser = await prisma.user.findUnique({
      where: { email: testUser.email },
      select: { id: true },
    });
    expect(survivingUser).not.toBeNull();

    // The real code deletes the account. The rejected code is still in the
    // field, and fill() appends rather than replaces on this input.
    const otpInput = page.getByLabel("Enter your 6-digit code");
    await otpInput.clear();

    const code = await getCode(testUser.email);
    await otpInput.fill(code);

    // The row goes before the response returns, so poll for it rather than
    // waiting on the client side redirect that follows.
    await expect(async () => {
      const deletedUser = await prisma.user.findUnique({
        where: { email: testUser.email },
        select: { id: true },
      });
      expect(deletedUser).toBeNull();
    }).toPass({ timeout: 30_000 });

    // Signed out, not left in a stale signed-in state on a deleted account.
    // The dialog issues its own redirect on success, so retry the navigation
    // until it is no longer interrupted by that in-flight load.
    await expect(async () => {
      await page.goto("/settings/profile");
      await expect(page).toHaveURL(/login/);
    }).toPass({ timeout: 30_000 });
  });
});
