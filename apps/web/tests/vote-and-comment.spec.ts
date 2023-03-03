import { expect, Page, Request, test } from "@playwright/test";
import { load } from "cheerio";
import smtpTester, { SmtpTester } from "smtp-tester";

test.describe.parallel(() => {
  let adminPage: Page;

  let touchRequest: Promise<Request>;
  let participantUrl: string;
  let editSubmissionUrl: string;

  let mailServer: SmtpTester;
  test.beforeAll(async () => {
    mailServer = smtpTester.init(4025);
  });

  test.afterAll(async () => {
    mailServer.stop();
  });

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    adminPage = await context.newPage();
    touchRequest = adminPage.waitForRequest(
      (request) =>
        request.method() === "POST" &&
        request.url().includes("/api/trpc/polls.touch"),
    );
    await adminPage.goto("/demo");
    await adminPage.waitForSelector('text="Lunch Meeting"');
  });

  test("should call touch endpoint", async () => {
    // make sure call to touch RPC is made
    expect(await touchRequest).not.toBeNull();
  });

  test("should be able to comment", async () => {
    await adminPage.getByPlaceholder("Your name…").fill("Test user");
    await adminPage
      .getByPlaceholder("Leave a comment on this poll")
      .fill("This is a comment!");
    await adminPage.click("text='Comment'");

    const comment = adminPage.locator("data-testid=comment");
    await expect(comment.locator("text='This is a comment!'")).toBeVisible();
    await expect(comment.locator("text=You")).toBeVisible();
  });

  test("copy participant link", async () => {
    await adminPage.click("text='Share'");
    await adminPage.click("text='Copy link'");
    participantUrl = await adminPage.evaluate("navigator.clipboard.readText()");

    expect(participantUrl).toMatch(/\/p\/[a-zA-Z0-9]+/);
  });

  test("should be able to vote with an email", async ({
    page: participantPage,
  }) => {
    await participantPage.goto(participantUrl);
    await participantPage.locator("data-testid=vote-selector >> nth=0").click();
    await participantPage.locator("data-testid=vote-selector >> nth=2").click();
    await participantPage.click("button >> text='Continue'");

    await participantPage.type('[placeholder="Jessie Smith"]', "Anne");
    await participantPage.type(
      '[placeholder="jessie.smith@email.com"]',
      "test@email.com",
    );
    await participantPage.click("text='Submit'");

    await expect(participantPage.locator("text='Anne'")).toBeVisible();

    const { email } = await mailServer.captureOne("test@email.com", {
      wait: 5000,
    });

    expect(email.headers.subject).toBe(
      "Your response for Lunch Meeting has been received",
    );

    const $ = load(email.html);
    const href = $("#editSubmissionUrl").attr("href");

    if (!href) {
      throw new Error("Could not get edit submission link from email");
    }

    editSubmissionUrl = href;
  });

  test("should be able to edit submission", async ({ page: newPage }) => {
    await newPage.goto(editSubmissionUrl);
    await expect(newPage.getByTestId("participant-menu")).toBeVisible();
  });
});
