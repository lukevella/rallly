import { expect, test } from "@playwright/test";
import { load } from "cheerio";
import smtpTester from "smtp-tester";

test.describe.serial(() => {
  let mailServer: smtpTester.SmtpTester;

  let pollUrl: string;

  test.beforeAll(async () => {
    mailServer = smtpTester.init(4025);
  });

  test.afterAll(async () => {
    mailServer.stop();
  });

  test("create a new poll", async ({ page }) => {
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
      '[placeholder="jessie.smith@email.com"]',
      "john.doe@email.com",
    );

    await page.click('text="Create poll"');

    const title = page.getByTestId("poll-title");

    await title.waitFor();

    await expect(title).toHaveText("Monthly Meetup");

    pollUrl = page.url();
  });

  test("verify poll", async ({ page, baseURL }) => {
    const { email } = await mailServer.captureOne("john.doe@email.com", {
      wait: 5000,
    });

    expect(email.headers.subject).toBe(
      "Your poll for Monthly Meetup has been created",
    );

    const $ = load(email.html);
    const verifyLink = $("#verifyEmailUrl").attr("href");

    expect(verifyLink).toContain(baseURL);

    if (!verifyLink) {
      throw new Error("Could not get verification link from email");
    }

    await page.goto(verifyLink);

    await expect(page.getByTestId("poll-title")).toHaveText("Monthly Meetup");
  });

  // delete the poll we just created
  test("delete existing poll", async ({ page }) => {
    await page.goto(pollUrl);
    const manageButton = page.getByText("Manage");
    await manageButton.waitFor();
    await manageButton.click();
    await page.click("text=Delete poll");

    const deletePollForm = page.locator("data-testid=delete-poll-form");

    // button should be disabled
    await expect(deletePollForm.locator("text=Delete poll")).toBeDisabled();

    // enter confirmation text
    await page.type("[placeholder=delete-me]", "delete-me");

    // button should now be enabled
    await deletePollForm.locator("text=Delete poll").click();

    // expect delete message to appear
    await expect(page.locator("text=Deleted poll")).toBeVisible();
  });
});
