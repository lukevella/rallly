import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";
import { NewPollPage } from "tests/new-poll-page";

import { deleteAllMessages } from "./mailpit/mailpit";

test.describe.serial(() => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await deleteAllMessages(); // Clean the mailbox before tests
  });

  test("create a new poll", async () => {
    const newPollPage = new NewPollPage(page);

    await newPollPage.goto();
    await newPollPage.createPollAndCloseDialog();

    await expect(page.getByTestId("poll-title")).toHaveText("Monthly Meetup");
  });

  // delete the poll we just created
  test("delete existing poll", async () => {
    const manageButton = page.getByText("Manage");
    await manageButton.waitFor();
    await manageButton.click();
    await page.click("text=Delete");

    const deletePollDialog = page.getByRole("dialog");

    deletePollDialog.getByRole("button", { name: "delete" }).click();

    await expect(page).toHaveURL("/polls");
  });
});
