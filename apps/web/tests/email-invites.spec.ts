// apps/web/tests/email-invites.spec.ts
import type { Browser, Page } from "@playwright/test";
import { expect, test } from "@playwright/test";
import { prisma } from "@rallly/database";
import { captureOne, deleteAllMessages } from "@rallly/test-helpers";
import { InvitePage } from "./invite-page";
import { NewPollPage } from "./new-poll-page";
import {
  createUserInDb,
  loginWithEmail,
  upgradeSpaceToPro,
} from "./test-utils";

/**
 * The Share dialog sends one email invite per submit and lists every invite
 * with its status. Free hosts see the pay wall instead of sending.
 */

const PRO_HOST = "email-invites-pro@rallly.co";
const FREE_HOST = "email-invites-free@rallly.co";
const INVITEE = "email-invitee@rallly.co";
const POLL_TITLE = "Email Invites Poll";

test.describe.configure({ mode: "serial" });

async function cleanup() {
  await prisma.user.deleteMany({
    where: { email: { in: [PRO_HOST, FREE_HOST] } },
  });
}

async function openAsGuest(browser: Browser, inviteUrl: string) {
  const context = await browser.newContext();
  const guestPage = await context.newPage();
  await guestPage.goto(inviteUrl.replace(/&amp;/g, "&"));
  return { guestPage, close: () => context.close() };
}

async function reopenShareDialog(page: Page) {
  // Load the poll page without the post-creation `share` param: the dialog
  // strips it with a raw replaceState the router does not track, and a
  // router refresh (dev HMR, revalidation) can bring it back before a
  // reload, which would reopen the dialog and block the Share button.
  const url = new URL(page.url());
  url.searchParams.delete("share");
  await page.goto(url.toString());
  await page.getByRole("button", { name: "Share" }).click();
  return page.getByRole("dialog", { name: "Share" });
}

test.describe("Email invites", () => {
  test.beforeAll(async () => {
    await cleanup();
    await deleteAllMessages();
  });

  test.afterAll(async () => {
    await cleanup();
  });

  test("pro host sends, sees status, and is stopped on duplicates", async ({
    page,
  }) => {
    const user = await createUserInDb({ email: PRO_HOST, name: "Pro Host" });
    const space = await prisma.space.findFirstOrThrow({
      where: { ownerId: user.id },
    });
    await upgradeSpaceToPro({ spaceId: space.id, userId: user.id, seats: 1 });

    await loginWithEmail(page, { email: PRO_HOST });
    const newPollPage = new NewPollPage(page);
    await newPollPage.goto();
    await newPollPage.create({ name: POLL_TITLE });
    await deleteAllMessages();

    await page.getByRole("button", { name: "Share" }).click();
    const dialog = page.getByRole("dialog", { name: "Share" });
    await expect(dialog.getByRole("button", { name: "Copy" })).toBeVisible();

    const field = dialog.getByLabel("Email address");
    await field.fill(INVITEE);
    await field.press("Enter");

    const row = dialog.getByRole("listitem").filter({ hasText: INVITEE });
    await expect(row).toBeVisible();
    await expect(row.getByText("Sent")).toBeVisible();
    await expect(
      dialog.getByRole("heading", { name: "1 invited" }),
    ).toBeVisible();

    const { email } = await captureOne(INVITEE);
    expect(email.Subject).toBe(
      `Pro Host invited you to respond to ${POLL_TITLE}`,
    );
    expect(email.HTML).toContain("/invite/");
    expect(email.HTML).toContain("?invite=");

    // Same address again is refused without sending.
    await field.fill(INVITEE);
    await field.press("Enter");
    // Scoped to the dialog: the same message also lands in a toast.
    await expect(
      dialog.getByText(`${INVITEE} is already invited`),
    ).toBeVisible();
    await expect(
      dialog.getByRole("heading", { name: "1 invited" }),
    ).toBeVisible();

    // Opening the emailed link records the open once: a second visit
    // neither moves the timestamp nor adds another activity event.
    const inviteUrl = email.HTML.match(
      /href="([^"]*\/invite\/[^"]*invite=[^"]*)"/,
    )?.[1];
    expect(inviteUrl).toBeTruthy();
    const browser = page.context().browser();
    expect(browser).toBeTruthy();
    const guest = await openAsGuest(browser as Browser, inviteUrl as string);
    const invite = await prisma.pollInvite.findFirstOrThrow({
      where: { email: INVITEE, poll: { title: POLL_TITLE } },
      select: { id: true },
    });
    await expect
      .poll(async () => {
        const row = await prisma.pollInvite.findUniqueOrThrow({
          where: { id: invite.id },
          select: { openedAt: true },
        });
        return row.openedAt;
      })
      .not.toBeNull();
    const { openedAt } = await prisma.pollInvite.findUniqueOrThrow({
      where: { id: invite.id },
      select: { openedAt: true },
    });

    await guest.guestPage.reload();
    await expect(guest.guestPage.getByText(POLL_TITLE)).toBeVisible();

    const openedRow = (await reopenShareDialog(page))
      .getByRole("listitem")
      .filter({ hasText: INVITEE });
    await expect(openedRow.getByText("Opened")).toBeVisible();
    const reread = await prisma.pollInvite.findUniqueOrThrow({
      where: { id: invite.id },
      select: { openedAt: true },
    });
    expect(reread.openedAt).toEqual(openedAt);
    expect(
      await prisma.pollActivity.count({
        where: { inviteId: invite.id, type: "invite_opened" },
      }),
    ).toBe(1);

    // Responding through the emailed link joins the response to the invite.
    await new InvitePage(guest.guestPage).addParticipant("Invited Guest");
    await guest.close();

    const respondedRow = (await reopenShareDialog(page))
      .getByRole("listitem")
      .filter({ hasText: INVITEE });
    await expect(respondedRow.getByText("Responded")).toBeVisible();
  });

  test("free host sees the pay wall and nothing is sent", async ({ page }) => {
    await createUserInDb({ email: FREE_HOST, name: "Free Host" });
    await loginWithEmail(page, { email: FREE_HOST });
    const newPollPage = new NewPollPage(page);
    await newPollPage.goto();
    await newPollPage.create({ name: `${POLL_TITLE} Free` });

    await page.getByRole("button", { name: "Share" }).click();
    const dialog = page.getByRole("dialog", { name: "Share" });
    const sendButton = dialog.getByRole("button", { name: /Send invite/ });
    await expect(sendButton).toBeEnabled();
    await expect(sendButton.getByText("Pro")).toBeVisible();

    await dialog.getByLabel("Email address").fill(INVITEE);
    await sendButton.click();

    await expect(page.getByText("Select plan:")).toBeVisible();
    const count = await prisma.pollInvite.count({
      where: { email: INVITEE, poll: { title: `${POLL_TITLE} Free` } },
    });
    expect(count).toBe(0);
  });
});
