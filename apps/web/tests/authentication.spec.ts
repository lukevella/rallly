import { expect, test } from "@playwright/test";
import { prisma } from "@rallly/database";
import { load } from "cheerio";

import { captureEmailHTML } from "./mailpit/mailpit";
import { RegisterPage } from "./register-page";
import { getCode } from "./utils";

const testUserEmail = "test@example.com";

test.describe.serial(() => {
  test.afterAll(async () => {
    try {
      await prisma.user.deleteMany({
        where: {
          email: testUserEmail,
        },
      });
    } catch {
      // User doesn't exist
    }
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

      await page.getByRole("button", { name: "Continue", exact: true }).click();

      await expect(
        page.getByText("A user with that email already exists"),
      ).toBeVisible();
    });

    test("can login with magic link", async ({ page }) => {
      await page.goto("/login");

      await page
        .getByPlaceholder("jessie.smith@example.com")
        .fill(testUserEmail);

      await page.getByRole("button", { name: "Continue with Email" }).click();

      const html = await captureEmailHTML(testUserEmail);

      const $ = load(html);

      const magicLink = $("#magicLink").attr("href");

      if (!magicLink) {
        throw new Error("Magic link not found");
      }

      await page.goto(magicLink);

      await page.getByRole("button", { name: "Login", exact: true }).click();

      await expect(page.getByText("Test User")).toBeVisible();
    });

    test("shows error for invalid verification code", async ({ page }) => {
      await page.goto("/login");

      await page
        .getByPlaceholder("jessie.smith@example.com")
        .fill(testUserEmail);

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

      const code = await getCode(testUserEmail);

      await page.getByPlaceholder("Enter your 6-digit code").fill(code);

      await expect(page.getByText("Test User")).toBeVisible();
    });

    test("allow using different case in email", async ({ page }) => {
      await page.goto("/login");

      await page
        .getByPlaceholder("jessie.smith@example.com")
        .fill("Test@example.com");

      await page.getByRole("button", { name: "Continue with Email" }).click();

      const code = await getCode(testUserEmail);

      await page.getByPlaceholder("Enter your 6-digit code").fill(code);

      await expect(page.getByText("Test User")).toBeVisible();
    });
  });
});
