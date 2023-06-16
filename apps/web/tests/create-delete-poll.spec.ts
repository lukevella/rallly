import { expect, Page, test } from "@playwright/test";
import smtpTester, { SmtpTester } from "smtp-tester";

test.describe.serial(() => {
  let page: Page;

  let mailServer: SmtpTester;
  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    mailServer = smtpTester.init(4025);
  });

  test.afterAll(async () => {
    page.close();
    mailServer.stop();
  });

  test("create a new poll", async () => {
    await page.goto("/new");
    await page.type('[placeholder="Monthly Meetup"]', "Monthly Meetup");
    // click on label to focus on input
    await page.click('text="Location"');
    await page.keyboard.type("Joe's Coffee Shop");

    await page.click('text="Description"');

    await page.keyboard.type("This is a test description");

    await page.click('text="Continue"');

    await page.click('[title="Next month"]');

    // Select a few days
    await page.click("text=/^5$/");
    await page.click("text=/^7$/");
    await page.click("text=/^10$/");
    await page.click("text=/^15$/");

    await page.click('text="Continue"');

    await page.type('[placeholder="Jessie Smith"]', "John");
    await page.type(
      '[placeholder="jessie.smith@example.com"]',
      "john.doe@example.com",
    );

    await page.click('text="Create poll"');

    const dialog = page.getByRole("dialog");

    await dialog.waitFor({ state: "visible" });

    const closeDialogButton = dialog.getByRole("button", { name: "Close" });

    await closeDialogButton.waitFor({ state: "visible" });

    await closeDialogButton.click();

    await expect(page.getByTestId("poll-title")).toHaveText("Monthly Meetup");

    const { email } = await mailServer.captureOne("john.doe@example.com", {
      wait: 5000,
    });

    expect(email.headers.subject).toBe("Let's find a date for Monthly Meetup");
  });

  // delete the poll we just created
  test("delete existing poll", async () => {
    const manageButton = page.getByText("Manage");
    await manageButton.waitFor();
    await manageButton.click();
    await page.click("text=Delete poll");

    const deletePollDialog = page.getByRole("dialog");

    deletePollDialog.getByRole("button", { name: "delete" }).click();

    await page.waitForURL("/polls");
  });
});
