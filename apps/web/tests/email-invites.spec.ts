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
 * with its status. Free hosts see the pay wall instead of sending. The
 * emailed link keeps granting the invitee edit access to their response.
 */

const PRO_HOST = "email-invites-pro@rallly.co";
const FREE_HOST = "email-invites-free@rallly.co";
const CLEAN_URL_HOST = "email-invites-clean-url@rallly.co";
const INVITEE = "email-invitee@rallly.co";
const POLL_TITLE = "Email Invites Poll";

test.describe.configure({ mode: "serial" });

async function cleanup() {
  await prisma.user.deleteMany({
    where: { email: { in: [PRO_HOST, FREE_HOST, CLEAN_URL_HOST] } },
  });
}

async function openAsGuest(browser: Browser, inviteUrl: string) {
  const context = await browser.newContext();
  const guestPage = await context.newPage();
  await guestPage.goto(inviteUrl.replace(/&amp;/g, "&"));
  return { guestPage, close: () => context.close() };
}

// The invite list is server data, so a guest's activity only shows after
// the host's page reloads.
/**
 * A fresh context has no guest cookie, so the only thing identifying the
 * viewer is the token in the link.
 */
async function renameThroughInviteLink(
  browser: Browser,
  inviteUrl: string,
  { from, to }: { from: string; to: string },
) {
  const guest = await openAsGuest(browser, inviteUrl);
  try {
    const { guestPage } = guest;
    await expect(guestPage.getByText(from)).toBeVisible();
    await guestPage.getByTestId("participant-menu").click();
    await guestPage.getByRole("menuitem", { name: "Change name" }).click();
    const dialog = guestPage.getByRole("dialog", { name: "Change name" });
    await dialog.getByLabel("Name").fill(to);
    await dialog.getByRole("button", { name: "Save" }).click();
    await expect(dialog).toBeHidden();
    await expect(guestPage.getByText(to)).toBeVisible();
  } finally {
    await guest.close();
  }
}

async function reopenShareDialog(page: Page) {
  await page.reload();
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
    expect(email.HTML).toContain("?token=");
    // Replies reach the host, not the From address.
    expect(email.ReplyTo.map((address) => address.Address)).toEqual([PRO_HOST]);

    // The row menu copies the same personal link the email carried, so a
    // host reaching the invitee another way keeps the response attributed.
    const emailedUrl = email.HTML.match(
      /href="([^"]*\/invite\/[^"]*token=[^"]*)"/,
    )?.[1];
    await row.getByRole("button", { name: `Options for ${INVITEE}` }).click();
    await page.getByRole("menuitem", { name: "Copy personal link" }).click();
    await expect(
      page.getByText(`Personal link for ${INVITEE} copied`),
    ).toBeVisible();
    expect(await page.evaluate("navigator.clipboard.readText()")).toBe(
      emailedUrl,
    );

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
    expect(emailedUrl).toBeTruthy();
    const browser = page.context().browser();
    expect(browser).toBeTruthy();
    const guest = await openAsGuest(browser as Browser, emailedUrl as string);
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
    await expect(
      guest.guestPage.getByRole("heading", { name: POLL_TITLE }),
    ).toBeVisible();

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

    // Responding through the emailed link joins the response to the invite,
    // and the response takes the invite's token as its own.
    await new InvitePage(guest.guestPage).addParticipant("Invited Guest");
    await guest.close();
    const converted = await prisma.pollInvite.findUniqueOrThrow({
      where: { id: invite.id },
      select: { token: true, participant: { select: { token: true } } },
    });
    expect(converted.participant?.token).toBe(converted.token);

    const respondedRow = (await reopenShareDialog(page))
      .getByRole("listitem")
      .filter({ hasText: INVITEE });
    await expect(respondedRow.getByText("Responded")).toBeVisible();
    await page.keyboard.press("Escape");

    // Opening the same link again, with no cookie, edits that response.
    await renameThroughInviteLink(browser as Browser, emailedUrl as string, {
      from: "Invited Guest",
      to: "Renamed Guest",
    });
    await page.reload();
    await expect(page.getByText("Renamed Guest")).toBeVisible();
  });

  test("creation opens the dialog and leaves the URL clean", async ({
    page,
  }) => {
    const user = await createUserInDb({
      email: CLEAN_URL_HOST,
      name: "Clean URL Host",
    });
    const space = await prisma.space.findFirstOrThrow({
      where: { ownerId: user.id },
    });
    await upgradeSpaceToPro({ spaceId: space.id, userId: user.id, seats: 1 });

    await loginWithEmail(page, { email: CLEAN_URL_HOST });
    const newPollPage = new NewPollPage(page);
    await newPollPage.goto();
    await newPollPage.create({ name: `${POLL_TITLE} Clean URL` });

    const dialog = page.getByRole("dialog", { name: "Share" });
    await expect(page).toHaveURL(/\/poll\/[^/?]+$/);

    // Sending an invite refreshes the route; a router sync must not put the
    // consumed param back on the address bar.
    const field = dialog.getByLabel("Email address");
    await field.fill(INVITEE);
    await field.press("Enter");
    const row = dialog.getByRole("listitem").filter({ hasText: INVITEE });
    await expect(row.getByText("Sent")).toBeVisible();
    await expect(page).toHaveURL(/\/poll\/[^/?]+$/);
    await expect(dialog).toBeVisible();

    // Removing a pending invite drops the row and stops its token; sending
    // to the same address again reactivates it.
    await row.getByRole("button", { name: `Options for ${INVITEE}` }).click();
    await page.getByRole("menuitem", { name: "Remove invite" }).click();
    await expect(page.getByText(`Invite for ${INVITEE} removed`)).toBeVisible();
    await expect(row).toBeHidden();
    await expect(dialog.getByText("No one invited yet")).toBeVisible();
    const revoked = await prisma.pollInvite.findFirstOrThrow({
      where: { email: INVITEE, poll: { title: `${POLL_TITLE} Clean URL` } },
      select: { id: true, revokedAt: true },
    });
    expect(revoked.revokedAt).not.toBeNull();
    expect(
      await prisma.pollActivity.count({
        where: { inviteId: revoked.id, type: "invite_revoked" },
      }),
    ).toBe(1);

    await field.fill(INVITEE);
    await field.press("Enter");
    await expect(row.getByText("Sent")).toBeVisible();

    await page.reload();
    await expect(page.getByRole("button", { name: "Share" })).toBeVisible();
    await expect(dialog).toBeHidden();
  });

  test("free host sees the pay wall and nothing is sent", async ({ page }) => {
    await createUserInDb({ email: FREE_HOST, name: "Free Host" });
    await loginWithEmail(page, { email: FREE_HOST });
    const newPollPage = new NewPollPage(page);
    await newPollPage.goto();
    await newPollPage.create({ name: `${POLL_TITLE} Free` });

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
