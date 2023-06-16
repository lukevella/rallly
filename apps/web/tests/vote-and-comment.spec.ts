import { expect, Page, Request, test } from "@playwright/test";
import { load } from "cheerio";
import smtpTester, { SmtpTester } from "smtp-tester";
import { PollPage } from "tests/poll-page";

import { NewPollPage } from "./new-poll-page";

test.describe(() => {
  let page: Page;
  let pollPage: PollPage;
  let touchRequest: Promise<Request>;
  let editSubmissionUrl: string;

  let mailServer: SmtpTester;
  test.beforeAll(async ({ browser }) => {
    mailServer = smtpTester.init(4025);
    page = await browser.newPage();
    touchRequest = page.waitForRequest(
      (request) =>
        request.method() === "POST" &&
        request.url().includes("/api/trpc/polls.touch"),
    );
    const newPollPage = new NewPollPage(page);
    await newPollPage.goto();
    pollPage = await newPollPage.createPollAndCloseDialog();
  });

  test.afterAll(async () => {
    mailServer.stop();
  });

  test("should call touch endpoint", async () => {
    // make sure call to touch RPC is made
    expect(await touchRequest).not.toBeNull();
  });

  test("should be able to comment", async () => {
    await pollPage.addComment();
    const comment = page.locator("data-testid=comment");
    await expect(comment.locator("text='This is a comment!'")).toBeVisible();
    await expect(comment.locator("text=You")).toBeVisible();
  });

  test("copy participant link", async () => {
    const inviteLink = await pollPage.copyInviteLink();
    await pollPage.closeDialog();
    expect(inviteLink).toMatch(/\/invite\/[a-zA-Z0-9]+/);
  });

  test("should be able to vote with an email", async () => {
    const invitePage = await pollPage.gotoInvitePage();

    await invitePage.addParticipant("Anne", "test@example.com");

    await expect(page.locator("text='Anne'")).toBeVisible();

    const { email } = await mailServer.captureOne("test@example.com", {
      wait: 5000,
    });

    expect(email.headers.subject).toBe(
      "Thanks for responding to Monthly Meetup",
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
