import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";
import { deleteAllMessages } from "@rallly/test-helpers";
import { NewPollPage } from "tests/new-poll-page";

test.describe.serial(() => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await deleteAllMessages(); // Clean the mailbox before tests
  });

  test("create a new poll", async () => {
    const newPollPage = new NewPollPage(page);
    await newPollPage.goto();
    const dialog = await newPollPage.create({ name: "Monthly Meetup" });
    await dialog.goToPollPage();

    await expect(
      page.getByRole("heading", { name: "Monthly Meetup" }),
    ).toBeVisible();
  });

  // delete the poll we just created
  test("delete existing poll", async () => {
    const manageButton = page.getByText("Manage");
    await manageButton.waitFor();
    await manageButton.click();
    await page.click("text=Delete");

    const deletePollDialog = page.getByRole("dialog");

    await deletePollDialog.getByRole("button", { name: "delete" }).click();

    await expect(page).toHaveURL("/login?redirectTo=%2Fpolls");
  });
});
