import { expect, Page, test } from "@playwright/test";
import { Prisma, prisma } from "@rallly/database";
import { load } from "cheerio";
import smtpTester from "smtp-tester";

const testUserEmail = "test@example.com";

test.describe.serial(() => {
  let mailServer: smtpTester.SmtpTester;

  test.beforeAll(() => {
    mailServer = smtpTester.init(4025);
  });

  test.afterAll(async () => {
    try {
      await prisma.$executeRaw`DELETE FROM users WHERE email IN ${Prisma.join([
        testUserEmail,
      ])}`;
    } catch {
      // User doesn't exist
    }
    mailServer.stop();
  });

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

  test.describe("new user", () => {
    test("shows that user doesn't exist yet", async ({ page }) => {
      await page.goto("/login");

      // your login page test logic
      await page.getByPlaceholder("jessie.smith@email.com").type(testUserEmail);

      await page.getByText("Continue").click();

      // Make sure the user doesn't exist yet and that logging in is not possible
      await expect(
        page.getByText("A user with that email doesn't exist"),
      ).toBeVisible();
    });

    test("user registration", async ({ page }) => {
      await page.goto("/register");

      await page.getByText("Create an account").waitFor();

      await page.getByPlaceholder("Jessie Smith").type("Test User");
      await page.getByPlaceholder("jessie.smith@email.com").type(testUserEmail);

      await page.click("text=Continue");

      const codeInput = page.getByPlaceholder("Enter your 6-digit code");

      codeInput.waitFor({ state: "visible" });

      const code = await getCode();

      await codeInput.type(code);

      await page.getByText("Continue").click();

      await expect(page.getByText("Your details")).toBeVisible();
    });
  });

  test.describe("existing user", () => {
    test("can't register with the same email", async ({ page }) => {
      await page.goto("/register");

      await page.getByText("Create an account").waitFor();

      await page.getByPlaceholder("Jessie Smith").type("Test User");
      await page.getByPlaceholder("jessie.smith@email.com").type(testUserEmail);

      await page.click("text=Continue");

      await expect(
        page.getByText("A user with that email already exists"),
      ).toBeVisible();
    });

    test.describe("login", () => {
      test.afterEach(async ({ page }) => {
        await page.goto("/logout");
      });
    });

    test("can login with verification code", async ({ page }) => {
      await page.goto("/login");

      await page.getByPlaceholder("jessie.smith@email.com").type(testUserEmail);

      await page.getByText("Continue").click();

      const { email } = await mailServer.captureOne(testUserEmail, {
        wait: 5000,
      });

      const $ = load(email.html);

      const magicLink = $("#magicLink").attr("href");

      if (!magicLink) {
        throw new Error("Magic link not found");
      }

      await page.goto(magicLink);
      await expect(page.getByText("Your details")).toBeVisible();
    });

    test("can login with magic link", async ({ page }) => {
      await page.goto("/login");

      await page.getByPlaceholder("jessie.smith@email.com").type(testUserEmail);

      await page.getByText("Continue").click();

      const code = await getCode();

      await page.getByPlaceholder("Enter your 6-digit code").type(code);

      await page.getByText("Continue").click();
      await expect(page.getByText("Your details")).toBeVisible();
    });
  });
});
