import { expect, test } from "@playwright/test";
import { prisma } from "@rallly/database";
import { NewPollPage } from "tests/new-poll-page";

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
    await newPollPage.createPollAndCloseDialog();
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
});
