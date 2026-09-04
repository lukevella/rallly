import type { Browser } from "@playwright/test";
import { expect, test } from "@playwright/test";
import { prisma } from "@rallly/database";
import {
  captureOne,
  deleteAllMessages,
  getMessageHeaders,
} from "@rallly/test-helpers";
import { load } from "cheerio";
import { InvitePage } from "./invite-page";
import { NewPollPage } from "./new-poll-page";
import { createUserInDb, loginWithEmail } from "./test-utils";

/**
 * Owner notification mail carries RFC 8058 one-click unsubscribe headers and
 * a tokenized link. Both mute the poll for the owner without a session.
 */

const OWNER_EMAIL = "list-unsubscribe-owner@rallly.co";
const POLL_TITLE = "List Unsubscribe Poll";

test.describe.configure({ mode: "serial" });

async function cleanup() {
  await prisma.user.deleteMany({ where: { email: OWNER_EMAIL } });
}

async function voteAsGuest(browser: Browser, inviteUrl: string, name: string) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(inviteUrl);
  await new InvitePage(page).addParticipant(name);
  await context.close();
}

async function isMuted(pollId: string) {
  const poll = await prisma.poll.findUniqueOrThrow({
    where: { id: pollId },
    select: { muted: true },
  });
  return poll.muted;
}

test.describe("List-Unsubscribe", () => {
  let pollId: string;
  let inviteUrl: string;
  let oneClickUrl: string;
  let pageUrl: string;

  test.beforeAll(async ({ browser }) => {
    await cleanup();
    await deleteAllMessages();
    await createUserInDb({ email: OWNER_EMAIL, name: "Unsubscribe Owner" });

    const page = await browser.newPage();
    await loginWithEmail(page, { email: OWNER_EMAIL });

    const newPollPage = new NewPollPage(page);
    await newPollPage.goto();
    const pollPage = await newPollPage.create({ name: POLL_TITLE });

    const match = page.url().match(/\/poll\/([a-zA-Z0-9]+)/);
    pollId = match?.[1] ?? "";
    expect(pollId).not.toBe("");

    inviteUrl = await pollPage.copyInviteLink();
    await pollPage.closeDialog();
    await page.close();

    // Drop the login OTP so the first capture is the notification.
    await deleteAllMessages();
  });

  test.afterAll(async () => {
    await cleanup();
  });

  test("notification mail carries one-click headers and a body link", async ({
    browser,
  }) => {
    await voteAsGuest(browser, inviteUrl, "First Voter");

    const { email } = await captureOne(OWNER_EMAIL);
    expect(email.Subject).toBe(`First Voter has responded to ${POLL_TITLE}`);

    const headers = await getMessageHeaders(email.ID);
    const listUnsubscribe = headers["List-Unsubscribe"]?.[0] ?? "";
    expect(listUnsubscribe).toMatch(/^<https?:\/\/.+\/api\/unsubscribe\/.+>$/);
    // The test server is plain http, and RFC 8058 one-click requires https,
    // so the flag must be withheld here. Its emission over https is covered
    // by the send unit test in packages/emails.
    expect(headers["List-Unsubscribe-Post"]).toBeUndefined();
    oneClickUrl = listUnsubscribe.slice(1, -1);

    const $ = load(email.HTML);
    pageUrl = $('a[href*="/unsubscribe/"]').attr("href") ?? "";
    expect(pageUrl).toMatch(/\/unsubscribe\/.+/);
    expect($('a[href*="/settings/notifications"]').length).toBe(1);
  });

  test("confirmation page mutes the poll without a session", async ({
    browser,
  }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(pageUrl);

    await expect(
      page.getByRole("heading", { name: "Mute this poll?" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Mute notifications" }).click();
    await expect(
      page.getByRole("heading", { name: "Poll muted" }),
    ).toBeVisible();
    await context.close();

    expect(await isMuted(pollId)).toBe(true);

    // A muted poll sends nothing, so the next test starts from unmuted.
    await prisma.poll.update({ where: { id: pollId }, data: { muted: false } });
  });

  test("one-click POST mutes the poll and stops further mail", async ({
    browser,
    request,
  }) => {
    const response = await request.post(oneClickUrl, {
      form: { "List-Unsubscribe": "One-Click" },
    });
    expect(response.status()).toBe(200);
    expect(await isMuted(pollId)).toBe(true);

    await deleteAllMessages();
    await voteAsGuest(browser, inviteUrl, "Second Voter");
    await expect(captureOne(OWNER_EMAIL, { wait: 3000 })).rejects.toThrow();
  });

  test("a tampered token is rejected", async ({ request }) => {
    const response = await request.post(`${oneClickUrl}x`);
    expect(response.status()).toBe(400);
  });
});
