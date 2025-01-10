import type { Page, Request } from "@playwright/test";
import { expect, test } from "@playwright/test";
import { load } from "cheerio";
import type { PollPage } from "tests/poll-page";

import { captureOne } from "./mailpit/mailpit";
import { NewPollPage } from "./new-poll-page";

test.describe(() => {
  let page: Page;
  let pollPage: PollPage;
  let touchRequest: Promise<Request>;
  let editSubmissionUrl: string;

  test.beforeAll(async ({ browser }) => {
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

    const { email } = await captureOne("test@example.com", {
      wait: 5000,
    });

    await expect(page.locator("text='Anne'")).toBeVisible();

    expect(email.Subject).toBe("Thanks for responding to Monthly Meetup");

    const $ = load(email.HTML);
    const href = $("#editSubmissionUrl").attr("href");

    if (!href) {
      throw new Error("Could not get edit submission link from email");
    }

    editSubmissionUrl = href;
  });

  test("should be able to edit submission", async ({ page: newPage }) => {
    await newPage.goto(editSubmissionUrl);
    await expect(newPage.getByTestId("participant-menu")).toBeVisible({
      timeout: 10000,
    });
  });
});
