import { expect, test } from "@playwright/test";
import { prisma } from "@rallly/database";
import { NewPollPage } from "tests/new-poll-page";

import { LoginPage } from "./login-page";
import { deleteAllMessages } from "./mailpit/mailpit";
import { RegisterPage } from "./register-page";

const TEST_USER_EMAIL = "testuser@example.com";

test.describe.serial(() => {
  test.beforeAll(async () => {
    await deleteAllMessages();
  });

  test.afterAll(async () => {
    // Clean up the test user
    await prisma.user.delete({
      where: {
        email: TEST_USER_EMAIL,
      },
    });
  });

  test("guest user can create a poll and convert to registered user", async ({
    page,
  }) => {
    // Step 1: Create a poll as guest
    const newPollPage = new NewPollPage(page);
    await newPollPage.createPollAndCloseDialog({ name: "Monthly Meetup" });
    await expect(page.getByTestId("poll-title")).toHaveText("Monthly Meetup");

    // Step 2: Navigate to registration
    await page.click("text=Create an account");
    await expect(page).toHaveURL(/register/);

    // Step 3: Complete registration
    const registerPage = new RegisterPage(page);
    await registerPage.register({
      name: "Test User",
      email: TEST_USER_EMAIL,
    });

    // Step 4: Navigate back to the poll
    await page.getByRole("link", { name: "Live" }).click();
    await expect(page).toHaveURL(/polls/);
    await page.click("text=Monthly Meetup");
    await expect(page.getByTestId("poll-title")).toHaveText("Monthly Meetup");
  });

  test("guest user can create a poll and link it to existing user", async ({
    page,
  }) => {
    // Step 1: Create a poll as guest
    const newPollPage = new NewPollPage(page);
    await newPollPage.createPollAndCloseDialog({ name: "Board Meeting" });
    await expect(page.getByTestId("poll-title")).toHaveText("Board Meeting");

    // Step 2: Navigate to registration
    await page.getByRole("link", { name: "Login" }).click();
    await expect(page).toHaveURL(/login/);

    // Step 3: Complete lplogin
    const loginPage = new LoginPage(page);
    await loginPage.login({
      email: TEST_USER_EMAIL,
    });

    // Step 4: Navigate back to the poll
    await expect(page.getByTestId("poll-title")).toHaveText("Board Meeting");
  });
});
