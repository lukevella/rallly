import { expect, test } from "@playwright/test";
import { prisma } from "@rallly/database";
import { deleteAllMessages } from "@rallly/test-helpers";
import { NewPollPage } from "tests/new-poll-page";
import { LoginPage } from "./login-page";
import { RegisterPage } from "./register-page";

const testUser = {
  name: "Test User",
  email: "testuser@example.com",
  password: "TestPassword456!",
};

test.describe.serial(() => {
  test.beforeAll(async () => {
    await deleteAllMessages();
  });

  test.afterAll(async () => {
    // Clean up the test user
    await prisma.user.delete({
      where: {
        email: testUser.email,
      },
    });
  });

  test("guest user can create a poll and convert to registered user", async ({
    page,
  }) => {
    // Step 1: Create a poll as guest
    const newPollPage = new NewPollPage(page);
    await newPollPage.goto();
    const dialog = await newPollPage.create({ name: "Monthly Meetup" });
    await dialog.goToPollPage();

    // Step 2: Navigate to registration
    await page.click("text=Create an account");
    await expect(page).toHaveURL(/register/);

    // Step 3: Complete registration
    const registerPage = new RegisterPage(page);
    await registerPage.register(testUser);
  });

  test("guest user can create a poll and link it to existing user", async ({
    page,
  }) => {
    // Step 1: Create a poll as guest
    const newPollPage = new NewPollPage(page);
    await newPollPage.goto();
    const dialog = await newPollPage.create({ name: "Board Meeting" });
    await dialog.goToPollPage();
    await expect(
      page.getByRole("heading", { name: "Board Meeting" }),
    ).toBeVisible();

    // Step 2: Navigate to registration
    await page.getByRole("link", { name: "Login" }).click();
    await expect(page).toHaveURL(/login/);

    // Step 3: Complete login
    const loginPage = new LoginPage(page);
    await loginPage.login({
      email: testUser.email,
      password: testUser.password,
    });

    // Step 4: Verify the poll has been linked to the logged-in user
    await expect(
      page.getByRole("heading", { name: "Board Meeting" }),
    ).toBeVisible();
    const url = page.url();
    const urlId = url.match(/\/poll\/([^/]+)/)?.[1];
    expect(urlId).toBeTruthy();
    const [poll, user] = await Promise.all([
      prisma.poll.findUnique({ where: { id: urlId } }),
      prisma.user.findUnique({ where: { email: testUser.email } }),
    ]);
    expect(poll?.userId).toBe(user?.id);
  });
});
