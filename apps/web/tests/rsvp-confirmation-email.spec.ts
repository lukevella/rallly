import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";
import { prisma } from "@rallly/database";
import {
  captureOne,
  deleteAllMessages,
  getAttachmentText,
  getMessages,
} from "@rallly/test-helpers";

/**
 * The public event page sends the invitee a confirmation email after they
 * register, with an .ics attachment whose PARTSTAT reflects their response.
 * These tests drive the real registration form and assert on the email that
 * lands in mailpit, plus the invite row the action wrote.
 */

const HOST_EMAIL = "rsvp-email-host@rallly.co";
const EVENT_ID = "rsvp-email-event";
const EVENT_UID = "rsvp-email-event-uid";
const EVENT_TITLE = "RSVP Email Test Event";

// Next year, September to dodge DST in the seeded zone.
const YEAR = new Date().getFullYear() + 1;
const EVENT_START = new Date(`${YEAR}-09-10T16:00:00.000Z`);
const EVENT_END = new Date(`${YEAR}-09-10T17:00:00.000Z`);

async function seed() {
  await cleanup();

  const user = await prisma.user.create({
    data: {
      email: HOST_EMAIL,
      name: "RSVP Email Host",
      locale: "en",
      timeZone: "Europe/London",
      emailVerified: true,
    },
  });

  const space = await prisma.space.create({
    data: { name: "RSVP Email Space", ownerId: user.id, tier: "hobby" },
  });

  await prisma.scheduledEvent.create({
    data: {
      id: EVENT_ID,
      uid: EVENT_UID,
      userId: user.id,
      spaceId: space.id,
      title: EVENT_TITLE,
      timeZone: "Europe/London",
      location: { provider: "custom", address: "100 Fish Street, London" },
      start: EVENT_START,
      end: EVENT_END,
      allDay: false,
    },
  });
}

async function cleanup() {
  await prisma.scheduledEvent.deleteMany({ where: { id: EVENT_ID } });
  await prisma.user.deleteMany({ where: { email: HOST_EMAIL } });
}

async function register(
  page: Page,
  { name, email }: { name: string; email: string },
) {
  await page.goto(`/e/${EVENT_ID}`);
  await page.getByRole("button", { name: "Register" }).click();
  await page.getByLabel("Name").fill(name);
  await page.getByLabel("Email").fill(email);
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Register" })
    .click();
}

test.describe("RSVP confirmation email", () => {
  test.beforeEach(async () => {
    await seed();
    await deleteAllMessages();
  });

  test.afterAll(async () => {
    await cleanup();
    await deleteAllMessages();
  });

  test("sends a confirmation email with an accepted .ics after registering", async ({
    browser,
  }) => {
    const context = await browser.newContext({
      locale: "en-US",
      timezoneId: "America/New_York",
    });
    const page = await context.newPage();
    const email = "rsvp-attendee@example.com";

    await register(page, { name: "Attendee One", email });

    // Confirmation of success in the UI before we look at the email.
    await expect(page.getByText("You're registered")).toBeVisible();

    const { email: message } = await captureOne(email);
    expect(message.Subject).toBe(`You responded to ${EVENT_TITLE}`);
    // Body copy names the response, the event, and the host. (The heading is
    // upper-cased in the plaintext render, so assert on the sentence instead.)
    expect(message.Text).toContain(
      `You accepted the invitation to ${EVENT_TITLE}`,
    );
    expect(message.Text).toContain("RSVP Email Host");

    // Exactly one .ics attachment, and its PARTSTAT matches the response.
    expect(message.Attachments).toHaveLength(1);
    const part = message.Attachments[0];
    expect(part.FileName).toBe("invite.ics");
    // Unfold RFC 5545 continuation lines ("\r\n " / "\r\n\t") so long values
    // like the attendee mailto aren't split mid-token.
    const ics = (await getAttachmentText(message.ID, part.PartID)).replace(
      /\r?\n[ \t]/g,
      "",
    );
    expect(ics).toContain("METHOD:request");
    expect(ics).toContain(`UID:${EVENT_UID}`);
    expect(ics).toContain('PARTSTAT="ACCEPTED"');
    expect(ics).toContain(`mailto:${email}`);

    // The action persisted the invitee's locale and zone for future emails.
    const invite = await prisma.scheduledEventInvite.findFirstOrThrow({
      where: { scheduledEventId: EVENT_ID, inviteeEmail: email },
    });
    expect(invite.status).toBe("accepted");
    expect(invite.inviteeLocale).toBe("en");
    expect(invite.inviteeTimeZone).toBe("America/New_York");

    await context.close();
  });

  test("does not send a second email when the same email registers twice", async ({
    browser,
  }) => {
    const email = "rsvp-duplicate@example.com";

    // First registration, from its own session.
    const firstContext = await browser.newContext({ locale: "en-US" });
    const firstPage = await firstContext.newPage();
    await register(firstPage, { name: "Attendee Two", email });
    await expect(firstPage.getByText("You're registered")).toBeVisible();
    await captureOne(email); // first email arrives
    await firstContext.close();

    await deleteAllMessages();

    // A second, unrelated visitor tries the same email. (A fresh context: the
    // first session would render as already-registered and hide the form.)
    const secondContext = await browser.newContext({ locale: "en-US" });
    const secondPage = await secondContext.newPage();
    await register(secondPage, { name: "Someone Else", email });
    await expect(
      secondPage.getByText("This email has already been used to respond"),
    ).toBeVisible();

    // Give any (incorrectly-fired) after() email time to land, then assert none.
    await secondPage.waitForTimeout(2000);
    const { messages } = await getMessages();
    expect(
      messages.filter((m) => m.To.some((t) => t.Address === email)),
    ).toHaveLength(0);

    await secondContext.close();
  });
});
