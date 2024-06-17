import { expect, Page, test } from "@playwright/test";
import smtpTester, { SmtpTester } from "smtp-tester";
import { NewPollPage } from "tests/new-poll-page";

test.describe.serial(() => {
  let page: Page;

  let mailServer: SmtpTester;
  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    mailServer = smtpTester.init(4025);
  });

  test.afterAll(async () => {
    mailServer.stop();
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
