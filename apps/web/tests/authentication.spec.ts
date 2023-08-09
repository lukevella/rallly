import { expect, test } from "@playwright/test";
import { prisma } from "@rallly/database";
import { load } from "cheerio";
import smtpTester from "smtp-tester";

const testUserEmail = "test@example.com";
let mailServer: smtpTester.SmtpTester;
/**
 * Get the 6-digit code from the email
 * @returns 6-digit code
 */
const getCode = async () => {
  const { email } = await mailServer.captureOne(testUserEmail, {
    wait: 5000,
  });

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
    mailServer.stop();
  });

  test.describe("new user", () => {
    test("shows that user doesn't exist yet", async ({ page }) => {
      await page.goto("/login");

      // your login page test logic
      await page
        .getByPlaceholder("jessie.smith@example.com")
        .type(testUserEmail);

      await page.getByRole("button", { name: "Continue" }).click();

      // Make sure the user doesn't exist yet and that logging in is not possible
      await expect(
        page.getByText("A user with that email doesn't exist"),
      ).toBeVisible();
    });

    test("user registration", async ({ page }) => {
      await page.goto("/register");

      await page.getByText("Create an account").waitFor();

      await page.getByPlaceholder("Jessie Smith").type("Test User");
      await page
        .getByPlaceholder("jessie.smith@example.com")
        .type(testUserEmail);

      await page.getByRole("button", { name: "Continue" }).click();

      const codeInput = page.getByPlaceholder("Enter your 6-digit code");

      codeInput.waitFor({ state: "visible" });

      const code = await getCode();

      await codeInput.type(code);

      await page.getByRole("button", { name: "Continue" }).click();

      await page.waitForURL("/polls");
    });
  });

  test.describe("existing user", () => {
    test("can't register with the same email", async ({ page }) => {
      await page.goto("/register");

      await page.getByText("Create an account").waitFor();

      await page.getByPlaceholder("Jessie Smith").type("Test User");
      await page
        .getByPlaceholder("jessie.smith@example.com")
        .type(testUserEmail);

      await page.getByRole("button", { name: "Continue" }).click();

      await expect(
        page.getByText("A user with that email already exists"),
      ).toBeVisible();
    });

    test.describe("login", () => {
      test.afterEach(async ({ page }) => {
        await page.goto("/logout");
      });
    });

    test("can login with magic link", async ({ page }) => {
      await page.goto("/login");

      await page
        .getByPlaceholder("jessie.smith@example.com")
        .type(testUserEmail);

      await page.getByRole("button", { name: "Continue" }).click();

      const { email } = await mailServer.captureOne(testUserEmail, {
        wait: 5000,
      });

      const $ = load(email.html);

      const magicLink = $("#magicLink").attr("href");

      if (!magicLink) {
        throw new Error("Magic link not found");
      }

      await page.goto(magicLink);

      page.getByText("Click here").click();

      await page.waitForURL("/polls");
    });

    test("can login with verification code", async ({ page }) => {
      await page.goto("/login");

      await page
        .getByPlaceholder("jessie.smith@example.com")
        .type(testUserEmail);

      await page.getByRole("button", { name: "Continue" }).click();

      const code = await getCode();

      await page.getByPlaceholder("Enter your 6-digit code").type(code);

      await page.getByRole("button", { name: "Continue" }).click();

      await page.waitForURL("/polls");
    });
  });
});
