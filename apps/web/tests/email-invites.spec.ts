// apps/web/tests/email-invites.spec.ts
import type { Browser } from "@playwright/test";
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

async function respondAsGuest(
  browser: Browser,
  inviteUrl: string,
  name: string,
) {
  const context = await browser.newContext();
  const guestPage = await context.newPage();
  await guestPage.goto(inviteUrl.replace(/&amp;/g, "&"));
  await new InvitePage(guestPage).addParticipant(name);
  await context.close();
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
    const created = await newPollPage.create({ name: POLL_TITLE });
    await created.goToPollPage();
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
    await expect(page.getByText(`${INVITEE} is already invited`)).toBeVisible();
    await expect(
      dialog.getByRole("heading", { name: "1 invited" }),
    ).toBeVisible();

    // Responding through the emailed link joins the response to the invite.
    const inviteUrl = email.HTML.match(
      /href="([^"]*\/invite\/[^"]*invite=[^"]*)"/,
    )?.[1];
    expect(inviteUrl).toBeTruthy();
    await respondAsGuest(
      page.context().browser() as Browser,
      inviteUrl as string,
      "Invited Guest",
    );

    await page.reload();
    await page.getByRole("button", { name: "Share" }).click();
    const reopened = page.getByRole("dialog", { name: "Share" });
    const respondedRow = reopened
      .getByRole("listitem")
      .filter({ hasText: INVITEE });
    await expect(respondedRow.getByText("Responded")).toBeVisible();
  });

  test("free host sees the pay wall and nothing is sent", async ({ page }) => {
    await createUserInDb({ email: FREE_HOST, name: "Free Host" });
    await loginWithEmail(page, { email: FREE_HOST });
    const newPollPage = new NewPollPage(page);
    await newPollPage.goto();
    const created = await newPollPage.create({ name: `${POLL_TITLE} Free` });
    await created.goToPollPage();

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
