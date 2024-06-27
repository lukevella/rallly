import { expect, test } from "@playwright/test";
import { prisma } from "@rallly/database";
import { load } from "cheerio";
import smtpTester from "smtp-tester";

const testUserEmail = "test@example.com";
let mailServer: smtpTester.MailServer;
/**
 * Get the 6-digit code from the email
 * @returns 6-digit code
 */
const getCode = async () => {
  const { email } = await mailServer.captureOne(testUserEmail, {
    wait: 5000,
  });

  if (!email.html) {
    throw new Error("Email doesn't contain HTML");
  }

  const $ = load(email.html);

  return $("#code").text().trim();
};

test.describe.serial(() => {
  test.beforeAll(() => {
    mailServer = smtpTester.init(4025);
  });

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

    mailServer.stop(() => {});
  });

  test("should redirect to login page if not logged in", async ({ page }) => {
    await page.goto("/");
    await page.waitForURL("/login");
  });

  test.describe("new user", () => {
    test("user registration", async ({ page }) => {
      await page.goto("/login");

      await page.getByText("Login or sign up in seconds").waitFor();

      await page
        .getByPlaceholder("jessie.smith@example.com")
        .fill(testUserEmail);

      await page
        .getByRole("button", { name: "Continue with Email", exact: true })
        .click();

      await page.getByText("Create your account").waitFor();

      await page.getByPlaceholder("Jessie Smith").fill("Test User");

      await page.getByRole("button", { name: "Continue", exact: true }).click();

      const codeInput = page.getByPlaceholder("Enter your 6-digit code");

      const code = await getCode();

      await codeInput.fill(code);

      await page.waitForURL("/");
    });
  });

  test.describe("existing user", () => {
    test("can't register with the same email", async ({ page }) => {
      await page.goto("/register");

      await page.getByText("Create an account").waitFor();

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

      const { email } = await mailServer.captureOne(testUserEmail, {
        wait: 5000,
      });

      if (!email.html) {
        throw new Error("Email doesn't contain HTML");
      }

      const $ = load(email.html);

      const magicLink = $("#magicLink").attr("href");

      if (!magicLink) {
        throw new Error("Magic link not found");
      }

      await page.goto(magicLink);

      await page.getByRole("button", { name: "Continue", exact: true }).click();

      await page.waitForURL("/");

      await expect(page.getByText("Test User")).toBeVisible();
    });

    test("can login with verification code", async ({ page }) => {
      await page.goto("/login");

      await page
        .getByPlaceholder("jessie.smith@example.com")
        .fill(testUserEmail);

      await page.getByRole("button", { name: "Continue with Email" }).click();

      const code = await getCode();

      await page.getByPlaceholder("Enter your 6-digit code").fill(code);

      await page.waitForURL("/");

      await expect(page.getByText("Test User")).toBeVisible();
    });

    test("allow using different case in email", async ({ page }) => {
      await page.goto("/login");

      await page
        .getByPlaceholder("jessie.smith@example.com")
        .fill("Test@example.com");

      await page.getByRole("button", { name: "Continue with Email" }).click();

      const code = await getCode();

      await page.getByPlaceholder("Enter your 6-digit code").fill(code);

      await page.waitForURL("/");

      await expect(page.getByText("Test User")).toBeVisible();
    });
  });
});
