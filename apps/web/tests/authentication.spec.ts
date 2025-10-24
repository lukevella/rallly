import { expect, test } from "@playwright/test";
import { prisma } from "@rallly/database";
import { load } from "cheerio";

import { captureEmailHTML } from "./mailpit/mailpit";
import { RegisterPage } from "./register-page";
import { createUserInDb, loginWithEmail } from "./test-utils";
import { getCode } from "./utils";

const testUserEmail = "test@example.com";
const testExistingUserEmail = "existing-user-for-disabled-test@example.com";
const testPassword = "TestPassword123!";

/**
 * Extract the password reset link from the email HTML
 */
async function getPasswordResetLink(email: string): Promise<string> {
  const html = await captureEmailHTML(email);
  const $ = load(html);

  const resetLink = $("#resetLink").attr("href");
  if (!resetLink) {
    throw new Error("Reset link not found in email");
  }

  return resetLink;
}

test.describe.serial(() => {
  test.afterAll(async () => {
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [testUserEmail, testExistingUserEmail],
        },
      },
    });
  });

  test.describe("new user", () => {
    test("shows that user doesn't exist yet", async ({ page }) => {
      await page.goto("/login");

      // your login page test logic
      await page
        .getByPlaceholder("jessie.smith@example.com")
        .fill(testUserEmail);

      await page.getByRole("button", { name: "Continue with Email" }).click();

      // Make sure the user doesn't exist yet and that logging in is not possible
      await expect(
        page.getByText("A user with that email doesn't exist"),
      ).toBeVisible();
    });

    test("user registration", async ({ page }) => {
      const registerPage = new RegisterPage(page);
      registerPage.goto();
      await registerPage.register({
        name: "Test User",
        email: testUserEmail,
        password: testPassword,
      });
    });
  });

  test.describe("existing user", () => {
    test("can't register with the same email", async ({ page }) => {
      await page.goto("/register");

      await page.getByText("Create Your Account").waitFor();

      await page.getByPlaceholder("Jessie Smith").fill("Test User");
      await page
        .getByPlaceholder("jessie.smith@example.com")
        .fill(testUserEmail);
      await page.getByPlaceholder("••••••••").fill(testPassword);

      await page.getByRole("button", { name: "Continue", exact: true }).click();

      await expect(
        page.getByText("A user with that email already exists"),
      ).toBeVisible();
    });

    test("can login with password", async ({ page }) => {
      await page.goto("/login");

      await page
        .getByPlaceholder("jessie.smith@example.com")
        .fill(testUserEmail);

      await page.getByRole("button", { name: "Continue with Email" }).click();

      // Password field should appear since user has a credential account
      await page.getByPlaceholder("••••••••").waitFor();
      await page.getByPlaceholder("••••••••").fill(testPassword);

      await page.getByRole("button", { name: "Continue with Email" }).click();

      await expect(page.getByText("Test User")).toBeVisible();
    });
    
    test("shows error for invalid verification code", async ({ page }) => {
      await page.goto("/login");

      await page
        .getByPlaceholder("jessie.smith@example.com")
        .fill(testUserEmail);

      await page.getByRole("button", { name: "Continue with Email" }).click();

      expect(page.getByPlaceholder("••••••••")).toBeVisible();

      await page.getByRole("button", { name: "Continue with Email" }).click();

      await page.getByPlaceholder("Enter your 6-digit code").fill("000000");

      await expect(
        page.getByText("Your verification code is incorrect or has expired"),
      ).toBeVisible();
    });

    test("can login with verification code", async ({ page }) => {
      await page.goto("/login");

      await page
        .getByPlaceholder("jessie.smith@example.com")
        .fill(testUserEmail);

      await page.getByRole("button", { name: "Continue with Email" }).click();

      expect(page.getByPlaceholder("••••••••")).toBeVisible();

      await page.getByRole("button", { name: "Continue with Email" }).click();

      const code = await getCode(testUserEmail);

      await page.getByPlaceholder("Enter your 6-digit code").fill(code);

      await expect(page.getByText("Test User")).toBeVisible();
    });

    test("allow using different case in email", async ({ page }) => {
      await page.goto("/login");
      const testDifferentCaseEmail = "Test@example.com"; // different case than the test user email
      await page
        .getByPlaceholder("jessie.smith@example.com")
        .fill(testDifferentCaseEmail);

      await page.getByRole("button", { name: "Continue with Email" }).click();

      await page.getByPlaceholder("••••••••").fill(testPassword);
      
      await page.getByRole("button", { name: "Continue with Email" }).click();

      await expect(page.getByText("Test User")).toBeVisible();
    });

    test.describe("Password Reset", () => {
      test("can access forgot password page from login", async ({ page }) => {
        await page.goto("/login");

        // Wait for login page to load
        await page.getByText("Welcome").waitFor();

        // Enter email to trigger password field rendering
        await page.getByPlaceholder("jessie.smith@example.com").fill(testUserEmail);
        await page.getByRole("button", { name: "Continue with Email" }).click();

        // Password field should now be visible since user has a credential account
        await page.getByPlaceholder("••••••••").waitFor();

        // Now click forgot password link
        await page.getByRole("link", { name: "Forgot password?" }).click();

        // Verify we're on the forgot password page
        await expect(page).toHaveURL(/\/forgot-password/);
        await expect(page.getByRole("heading", { name: "Reset your password" })).toBeVisible();

        // Verify email is pre-filled as a UX improvement
        const emailInput = page.getByPlaceholder("jessie.smith@example.com");
        await expect(emailInput).toHaveValue(testUserEmail);
      });

      test("can request password reset with email", async ({ page }) => {
        await page.goto("/forgot-password");

        // Wait for forgot password page to load
        await page.getByRole("heading", { name: "Reset your password" }).waitFor();

        // Fill in email
        await page.getByPlaceholder("jessie.smith@example.com").fill(testUserEmail);

        // Submit form
        await page.getByRole("button", { name: "Send reset link" }).click();

        // Verify success message
        await expect(page.getByText("Check your email", {
          exact: true,
        })).toBeVisible();
        await expect(
          page.getByText(/sent a password reset link to your inbox/),
        ).toBeVisible();
      });

      test("doesn't reveal whether email exists in system", async ({ page }) => {
        await page.goto("/forgot-password");

        // Fill in non-existent email
        await page
          .getByPlaceholder("jessie.smith@example.com")
          .fill("nonexistent@example.com");

        // Submit form
        await page.getByRole("button", { name: "Send reset link" }).click();

        // Should show the same success message for both existing and non-existing emails
        // This prevents email enumeration attacks
        await expect(page.getByText("Check your email", {
          exact: true,
        })).toBeVisible();
      });

      test("displays back to login link on forgot password page", async ({ page }) => {
        await page.goto("/forgot-password");

        // Verify back to login link
        await page.getByRole("link", { name: "Back to login" }).click();

        // Should be redirected to login
        await expect(page).toHaveURL(/\/login/);
      });

      test("can reset password with valid token", async ({ page }) => {
        // Request a password reset
        await page.goto("/forgot-password");
        await page
          .getByPlaceholder("jessie.smith@example.com")
          .fill(testUserEmail);
        await page.getByRole("button", { name: "Send reset link" }).click();

        // Get the reset token from email
        const resetLink = await getPasswordResetLink(testUserEmail);

        // Navigate to reset password page with token
        await page.goto(resetLink);

        // Verify we're on the reset password page
        await expect(page.getByText("Set your password")).toBeVisible();

        // Fill in new password
        const newPassword = "NewPassword456!";
        await page.getByLabel("New password").fill(newPassword);
        await page.getByLabel("Confirm password").fill(newPassword);

        // Submit form
        await page.getByRole("button", { name: "Set password" }).click();

        // Should be redirected to login
        await expect(page).toHaveURL(/\/login/);
      });

      test("shows error when passwords don't match", async ({ page }) => {
        // Request a password reset
        await page.goto("/forgot-password");
        await page
          .getByPlaceholder("jessie.smith@example.com")
          .fill(testUserEmail);
        await page.getByRole("button", { name: "Send reset link" }).click();

        // Get the reset token from email
        const resetLink = await getPasswordResetLink(testUserEmail);

        // Navigate to reset password page with token
        await page.goto(resetLink);

        // Fill in mismatched passwords
        await page.getByLabel("New password").fill("Password123!");
        await page.getByLabel("Confirm password").fill("DifferentPassword123!");

        await page.getByRole("button", { name: "Set password" }).click();
        
        await expect(
          page.getByText(/passwords must match/i),
        ).toBeVisible();
      });

      test("shows error for invalid token", async ({ page }) => {
        // Navigate to reset password with invalid token
        await page.goto("/reset-password?token=invalid-token-123");
        
        // Fill fields and submit
        await page.getByLabel("New password").fill("Password123!");
        await page.getByLabel("Confirm password").fill("Password123!");
        await page.getByRole("button", { name: "Set password" }).click();

        // Should show error message
        await expect(page.getByText("Invalid token")).toBeVisible();
      });

      test("shows error when token is missing", async ({ page }) => {
        // Navigate to reset password without token
        await page.goto("/reset-password");

        // Should show error message
        await expect(page.getByText("Invalid token")).toBeVisible();
      });

      test("can login with new password after reset", async ({ page }) => {
        // First, reset the password
        await page.goto("/forgot-password");
        await page
          .getByPlaceholder("jessie.smith@example.com")
          .fill(testUserEmail);
        await page.getByRole("button", { name: "Send reset link" }).click();

        // Get the reset token
        const resetLink = await getPasswordResetLink(testUserEmail);

        // Reset to a new password
        const finalPassword = "FinalPassword789!";
        await page.goto(resetLink);
        await page.getByLabel("New password").fill(finalPassword);
        await page.getByLabel("Confirm password").fill(finalPassword);
        await page.getByRole("button", { name: "Set password" }).click();

        // Now try to login with the new password
        await page.goto("/login");
        await page
          .getByPlaceholder("jessie.smith@example.com")
          .fill(testUserEmail);
        await page.getByRole("button", { name: "Continue with Email" }).click();

        await page.getByPlaceholder("••••••••").waitFor();
        await page.getByPlaceholder("••••••••").fill(finalPassword);
        await page.getByRole("button", { name: "Continue with Email" }).click();

        // Should be logged in
        await expect(page.getByText("Test User")).toBeVisible();
      });

      test("displays back to login link on reset page", async ({ page }) => {
        // Request a password reset to get a valid token
        await page.goto("/forgot-password");
        await page
          .getByPlaceholder("jessie.smith@example.com")
          .fill(testUserEmail);
        await page.getByRole("button", { name: "Send reset link" }).click();

        const resetLink = await getPasswordResetLink(testUserEmail);

        // Navigate to reset password page
        await page.goto(resetLink);

        // Verify back to login link exists
        await page.getByRole("link", { name: "Back to login" }).click();

        // Should be redirected to login
        await expect(page).toHaveURL(/\/login/);
      });

      test("prevents redirects to external sites", async ({ page }) => {
        // Request a password reset
        await page.goto("/forgot-password");
        await page
          .getByPlaceholder("jessie.smith@example.com")
          .fill(testUserEmail);
        await page.getByRole("button", { name: "Send reset link" }).click();

        const resetLink = await getPasswordResetLink(testUserEmail);

        // Try to use redirect injection
        await page.goto(
          `${resetLink}&redirectTo=https://evil.com`,
        );

        // Fill in password
        const safePassword = "SafePassword123!";
        await page.getByLabel("New password").fill(safePassword);
        await page.getByLabel("Confirm password").fill(safePassword);

        // Submit form
        await page.getByRole("button", { name: "Set password" }).click();

        // Should redirect to login, not external site
        await expect(page).toHaveURL(/\/login/);
      });
    });
  });

  test.describe("when user registration is disabled", () => {
    test.beforeAll(async () => {
      await prisma.instanceSettings.update({
        where: { id: 1 },
        data: {
          disableUserRegistration: true,
        },
      });
    });

    test.afterAll(async () => {
      await prisma.instanceSettings.update({
        where: { id: 1 },
        data: {
          disableUserRegistration: false,
        },
      });
    });

    test("allows existing user to log in via email", async ({ page }) => {
      await createUserInDb({
        email: testExistingUserEmail,
        name: "Existing User",
        role: "user",
      });

      await loginWithEmail(page, { email: testExistingUserEmail });

      await expect(page).toHaveURL("/");
    });
  });
});
