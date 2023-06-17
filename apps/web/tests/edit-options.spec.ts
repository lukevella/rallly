import { expect, Page, test } from "@playwright/test";
import smtpTester, { SmtpTester } from "smtp-tester";
import { EditOptionsPage } from "tests/edit-options-page";
import { NewPollPage } from "tests/new-poll-page";

test.describe("edit options", () => {
  let page: Page;
  let editOptionsPage: EditOptionsPage;
  let mailServer: SmtpTester;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    mailServer = smtpTester.init(4025);
    const newPollPage = new NewPollPage(page);
    await newPollPage.goto();
    const pollPage = await newPollPage.createPollAndCloseDialog();
    await pollPage.addParticipant("Mark");
    editOptionsPage = await pollPage.editOptions();
  });

  test.afterAll(async () => {
    mailServer.stop();
  });

  test("should show warning when deleting options with votes in them", async () => {
    editOptionsPage.switchToSpecifyTimes();

    await page.click("text='12:00 PM'");
    await page.click("text='1:00 PM'");
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.locator('text="Are you sure?"')).toBeVisible();
    await page.click("text='Delete'");
  });
});
