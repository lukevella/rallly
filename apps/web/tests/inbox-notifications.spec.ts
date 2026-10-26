import type { Browser, Page } from "@playwright/test";
import { expect, test } from "@playwright/test";
import { prisma } from "@rallly/database";
import { deleteAllMessages } from "@rallly/test-helpers";
import { InvitePage } from "./invite-page";
import { NewPollPage } from "./new-poll-page";
import { PollPage } from "./poll-page";
import { createUserInDb, loginWithEmail } from "./test-utils";

/**
 * Responses and comments on a poll land in its organizer's in-app inbox,
 * following the same recipient rules as the notification email.
 */

const OWNER_EMAIL = "inbox-owner@rallly.co";
const POLL_TITLE = "Inbox Poll";
const OTHER_OWNER_EMAIL = "inbox-other-owner@rallly.co";

test.describe.configure({ mode: "serial" });

async function cleanup() {
  await prisma.user.deleteMany({
    where: { email: { in: [OWNER_EMAIL, OTHER_OWNER_EMAIL] } },
  });
}

async function asGuest(
  browser: Browser,
  inviteUrl: string,
  act: (page: Page) => Promise<void>,
) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(inviteUrl);
  await act(page);
  await context.close();
}

async function openInbox(page: Page) {
  if (!page.url().includes("/polls")) {
    await page.goto("/polls");
  }
  await page.getByRole("button", { name: /^Notifications/ }).click();
}

async function inboxCount(pollId: string) {
  return prisma.inboxNotification.count({ where: { activity: { pollId } } });
}

test.describe("Inbox notifications", () => {
  let page: Page;
  let pollId: string;
  let inviteUrl: string;

  test.beforeAll(async ({ browser }) => {
    await cleanup();
    await deleteAllMessages();
    await createUserInDb({ email: OWNER_EMAIL, name: "Inbox Owner" });

    const context = await browser.newContext({
      permissions: ["clipboard-read"],
    });
    page = await context.newPage();
    await loginWithEmail(page, { email: OWNER_EMAIL });

    const newPollPage = new NewPollPage(page);
    await newPollPage.goto();
    const pollPage = await newPollPage.create({
      name: POLL_TITLE,
      enableComments: true,
    });

    pollId = page.url().match(/\/poll\/([a-zA-Z0-9]+)/)?.[1] ?? "";
    expect(pollId).not.toBe("");

    inviteUrl = await pollPage.copyInviteLink();
    await pollPage.closeShareDialog();
  });

  test.afterAll(async () => {
    await cleanup();
  });

  test("a response shows in the inbox and opening it marks it read", async ({
    browser,
  }) => {
    await asGuest(browser, inviteUrl, (guest) =>
      new InvitePage(guest).addParticipant("First Voter"),
    );
    await expect.poll(() => inboxCount(pollId)).toBe(1);

    await page.goto("/polls");
    const bell = page.getByRole("button", { name: "Notifications, 1 unread" });
    await bell.click();

    const entry = page.getByRole("link", {
      name: `First Voter responded to ${POLL_TITLE}`,
    });
    await expect(entry).toBeVisible();
    await entry.click();

    await page.waitForURL(`**/polls/${pollId}`);
    await expect
      .poll(() =>
        prisma.inboxNotification.count({
          where: { activity: { pollId }, readAt: null },
        }),
      )
      .toBe(0);
    await expect(
      page.getByRole("button", { name: "Notifications", exact: true }),
    ).toBeVisible();
  });

  test("a comment shows in the inbox and mark all as read clears it", async ({
    browser,
  }) => {
    await asGuest(browser, inviteUrl, async (guest) => {
      await new PollPage(guest).addComment();
      await expect(
        guest.getByTestId("comment").getByText("This is a comment!"),
      ).toBeVisible();
    });
    await expect.poll(() => inboxCount(pollId)).toBe(2);

    await page.goto("/polls");
    await page.getByRole("button", { name: "Notifications, 1 unread" }).click();
    await expect(
      page.getByRole("link", {
        name: `Test user commented on ${POLL_TITLE}`,
      }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Mark all as read" }).click();
    await expect(
      page.getByRole("button", { name: "Notifications", exact: true }),
    ).toBeVisible();
    expect(
      await prisma.inboxNotification.count({
        where: { activity: { pollId }, readAt: null },
      }),
    ).toBe(0);
  });

  test("turning the in-app preference off hides responses, past and new", async ({
    browser,
  }) => {
    const toggle = page.locator("#notify-inApp-poll\\.response\\.submitted");
    await page.goto("/settings/notifications");
    await toggle.click();
    await expect(page.getByText("Saved")).toBeVisible();

    await asGuest(browser, inviteUrl, (guest) =>
      new InvitePage(guest).addParticipant("Second Voter"),
    );
    // The email still goes out, so wait on the response itself.
    await expect
      .poll(() => prisma.participant.count({ where: { pollId } }))
      .toBe(2);
    await page.waitForTimeout(2000);
    expect(await inboxCount(pollId)).toBe(2);

    await openInbox(page);
    await expect(page.getByRole("link", { name: /responded to/ })).toHaveCount(
      0,
    );
    await expect(
      page.getByRole("link", { name: /commented on/ }),
    ).toBeVisible();

    await page.goto("/settings/notifications");
    await toggle.click();
    await expect(page.getByText("Saved")).toBeVisible();
  });

  test("a muted poll adds nothing and hides its entries", async ({
    browser,
  }) => {
    await prisma.poll.update({ where: { id: pollId }, data: { muted: true } });

    await asGuest(browser, inviteUrl, (guest) =>
      new InvitePage(guest).addParticipant("Third Voter"),
    );
    await expect
      .poll(() => prisma.participant.count({ where: { pollId } }))
      .toBe(3);
    await page.waitForTimeout(2000);
    expect(await inboxCount(pollId)).toBe(2);

    await openInbox(page);
    await expect(page.getByText("No notifications yet")).toBeVisible();

    await prisma.poll.update({ where: { id: pollId }, data: { muted: false } });
  });

  test("comments are recorded in the poll's activity log", async () => {
    await page.goto(`/polls/${pollId}/activity`);
    await expect(page.getByText("Test user commented")).toBeVisible();
  });

  test("load more pages through older entries", async () => {
    const owner = await prisma.user.findUniqueOrThrow({
      where: { email: OWNER_EMAIL },
    });
    // 25 older, read responses: two pages with the two real entries.
    for (let i = 0; i < 25; i++) {
      const createdAt = new Date(Date.now() - (i + 1) * 60 * 60 * 1000);
      await prisma.pollActivity.create({
        data: {
          pollId,
          type: "response_created",
          participantId: `seeded-${i}`,
          payload: { name: `Seeded Voter ${i}` },
          createdAt,
          inboxNotifications: {
            create: { userId: owner.id, readAt: createdAt, createdAt },
          },
        },
      });
    }

    await openInbox(page);
    const entries = page.getByRole("link", { name: new RegExp(POLL_TITLE) });
    await expect(entries).toHaveCount(20);
    await page.getByRole("button", { name: "Load more" }).click();
    await expect(entries).toHaveCount(27);
    await expect(page.getByRole("button", { name: "Load more" })).toBeHidden();
    await page.keyboard.press("Escape");
  });

  test("the house-keeping cron prunes entries past retention", async ({
    request,
  }) => {
    const old = new Date(Date.now() - 100 * 24 * 60 * 60 * 1000);
    const { count } = await prisma.inboxNotification.updateMany({
      where: {
        activity: {
          pollId,
          payload: { path: ["name"], string_starts_with: "Seeded" },
        },
      },
      data: { readAt: old },
    });
    expect(count).toBe(25);

    // Past the unread cutoff by age: only the unread one goes.
    const owner = await prisma.user.findUniqueOrThrow({
      where: { email: OWNER_EMAIL },
    });
    const yearAgo = new Date(Date.now() - 400 * 24 * 60 * 60 * 1000);
    const recently = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
    for (const readAt of [recently, null]) {
      await prisma.pollActivity.create({
        data: {
          pollId,
          type: "response_created",
          participantId: `old-${readAt ? "read" : "unread"}`,
          payload: { name: "Old Voter" },
          createdAt: yearAgo,
          inboxNotifications: {
            create: { userId: owner.id, createdAt: yearAgo, readAt },
          },
        },
      });
    }

    const response = await request.get(
      "/api/house-keeping/prune-inbox-notifications",
      { headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` } },
    );
    expect(response.ok()).toBe(true);
    expect(await inboxCount(pollId)).toBe(3);
    expect(
      await prisma.inboxNotification.count({
        where: { activity: { participantId: "old-read" } },
      }),
    ).toBe(1);
  });

  test("losing access to the poll's space hides its entries", async () => {
    const poll = await prisma.poll.findUniqueOrThrow({ where: { id: pollId } });
    // A space the organizer is not a member of, as after losing access.
    const other = await createUserInDb({
      email: OTHER_OWNER_EMAIL,
      name: "Other Owner",
    });
    const otherSpace = await prisma.space.findFirstOrThrow({
      where: { ownerId: other.id },
    });
    await prisma.poll.update({
      where: { id: pollId },
      data: { spaceId: otherSpace.id },
    });

    await openInbox(page);
    await expect(page.getByText("No notifications yet")).toBeVisible();
    await page.keyboard.press("Escape");

    await prisma.poll.update({
      where: { id: pollId },
      data: { spaceId: poll.spaceId },
    });
  });

  test("the inbox works on a phone", async ({ browser }) => {
    const context = await browser.newContext({
      storageState: await page.context().storageState(),
      viewport: { width: 375, height: 667 },
      isMobile: true,
      hasTouch: true,
    });
    const mobile = await context.newPage();
    await mobile.goto("/polls");
    await mobile
      .getByRole("button", { name: "Toggle Sidebar" })
      .first()
      .click();
    await mobile.getByRole("button", { name: /^Notifications/ }).click();
    const popover = mobile.locator("[data-slot=popover-content]");
    await expect(
      popover.getByRole("link", { name: /commented on/ }),
    ).toBeVisible();

    const box = await popover.boundingBox();
    expect(box).not.toBeNull();
    expect(box?.x ?? -1).toBeGreaterThanOrEqual(0);
    expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(375);
    await expect(popover).toHaveCSS("opacity", "1");
    await mobile.screenshot({
      path: "test-results/inbox-mobile.png",
    });

    await popover.getByRole("link", { name: /commented on/ }).click();
    await mobile.waitForURL(`**/polls/${pollId}`);
    await context.close();
  });
});
