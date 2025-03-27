import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";
import { prisma } from "@rallly/database";
import { load } from "cheerio";
import type { PollPage } from "tests/poll-page";

import { captureOne } from "./mailpit/mailpit";
import { NewPollPage } from "./new-poll-page";

test.describe(() => {
  let page: Page;
  let pollPage: PollPage;
  let editSubmissionUrl: string;
  let pollId: string;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await page.clock.install();

    const newPollPage = new NewPollPage(page);
    await newPollPage.goto();
    pollPage = await newPollPage.createPollAndCloseDialog({
      name: "Monthly Meetup",
    });

    // Extract the poll ID from the URL
    const url = page.url();
    const match = url.match(/\/poll\/([a-zA-Z0-9]+)/);
    pollId = match ? match[1] : "";
    expect(pollId).not.toBe("");
  });

  test("should record poll view", async () => {
    // Fast forward time to trigger view tracking
    await page.clock.fastForward(5000);

    let pollViews: Array<{
      id: string;
      pollId: string;
      ipAddress: string | null;
      userId: string | null;
      userAgent: string | null;
      viewedAt: Date;
    }> = [];

    // Retry until we find poll views or timeout
    await expect(async () => {
      // Query the database for poll views
      pollViews = await prisma.pollView.findMany({
        where: {
          pollId,
        },
        orderBy: {
          viewedAt: "desc",
        },
      });

      // This will throw if the condition is not met, causing a retry
      expect(pollViews.length).toBeGreaterThan(0);
    }).toPass({
      timeout: 5000, // 5 second timeout
      intervals: [100, 200, 500, 1000], // Retry intervals in milliseconds
    });

    // Now that we know we have at least one poll view, verify its properties
    const latestView = pollViews[0];
    expect(latestView.pollId).toBe(pollId);
    expect(latestView.ipAddress).toBeDefined();
    expect(latestView.userAgent).toBeDefined();
    expect(latestView.viewedAt).toBeDefined();
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
