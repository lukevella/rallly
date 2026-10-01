import type { APIRequestContext } from "@playwright/test";
import { expect, test } from "@playwright/test";
import { prisma } from "@rallly/database";
import {
  captureOne,
  deleteAllMessages,
  getAttachmentText,
  getMessages,
} from "@rallly/test-helpers";
import { createSpaceInDb, createUserInDb, loginWithEmail } from "./test-utils";

/**
 * Booking a poll queues one email per invite the organizer chose to notify;
 * the minute cron sends them. These tests seed a booked event with invites
 * in each state, run the cron and assert on mailpit and the invite rows.
 */

const CRON_SECRET = process.env.CRON_SECRET;
const EVENT_ID = "invite-email-event";
const EVENT_UID = "invite-email-event@rallly.co";
const POLL_ID = "invite-email-poll";
const TITLE = "Invite Email Test Event";
const HOST_EMAIL = "invite-email-host@rallly.co";

const YEAR = new Date().getFullYear() + 1;

async function runCron(request: APIRequestContext) {
  const response = await request.get("/api/house-keeping/send-invite-emails", {
    headers: { Authorization: `Bearer ${CRON_SECRET}` },
  });
  expect(response.ok()).toBeTruthy();
  const data = await response.json();
  expect(data.success).toBe(true);
  return data.summary as Record<string, number>;
}

async function cleanup() {
  await prisma.poll.deleteMany({ where: { id: POLL_ID } });
  await prisma.scheduledEvent.deleteMany({ where: { id: EVENT_ID } });
  await prisma.user.deleteMany({ where: { email: HOST_EMAIL } });
}

async function seed({
  status = "confirmed",
  banned = false,
}: {
  status?: "confirmed" | "canceled";
  banned?: boolean;
} = {}) {
  await cleanup();
  const user = await createUserInDb({
    email: HOST_EMAIL,
    name: "Invite Email Host",
  });
  if (banned) {
    await prisma.user.update({ where: { id: user.id }, data: { banned } });
  }
  const space = await createSpaceInDb({
    name: "Invite Email Space",
    ownerId: user.id,
    tier: "hobby",
  });
  await prisma.scheduledEvent.create({
    data: {
      id: EVENT_ID,
      uid: EVENT_UID,
      userId: user.id,
      spaceId: space.id,
      title: TITLE,
      status,
      timeZone: "Europe/London",
      location: { provider: "custom", address: "100 Fish Street, London" },
      start: new Date(`${YEAR}-09-10T16:00:00.000Z`),
      end: new Date(`${YEAR}-09-10T17:00:00.000Z`),
      invites: {
        createMany: {
          data: [
            {
              uid: "invite-email-pending",
              inviteeName: "Pending Invitee",
              inviteeEmail: "invite-pending@example.com",
              inviteeTimeZone: "America/New_York",
              inviteeLocale: "en",
              status: "accepted",
              emailStatus: "pending",
            },
            {
              uid: "invite-email-skipped",
              inviteeName: "Skipped Invitee",
              inviteeEmail: "invite-skipped@example.com",
              status: "accepted",
              emailStatus: "skipped",
            },
          ],
        },
      },
    },
  });
  await prisma.poll.create({
    data: {
      id: POLL_ID,
      title: TITLE,
      userId: user.id,
      spaceId: space.id,
      status: "scheduled",
      scheduledEventId: EVENT_ID,
    },
  });
}

function findInvite(uid: string) {
  return prisma.scheduledEventInvite.findUniqueOrThrow({ where: { uid } });
}

test.describe("Invite emails", () => {
  test.beforeEach(async () => {
    await deleteAllMessages();
  });

  test.afterAll(async () => {
    await cleanup();
    await deleteAllMessages();
  });

  test("sends pending invites once and leaves skipped ones alone", async ({
    request,
  }) => {
    await seed();

    const summary = await runCron(request);
    expect(summary.sent).toBeGreaterThanOrEqual(1);

    const { email } = await captureOne("invite-pending@example.com");
    expect(email.Subject).toBe(`Date booked for ${TITLE}`);
    expect(email.Text).toContain("Invite Email Host");
    expect(email.Attachments).toHaveLength(1);
    const ics = (
      await getAttachmentText(email.ID, email.Attachments[0].PartID)
    ).replace(/\r?\n[ \t]/g, "");
    expect(ics).toContain(`UID:${EVENT_UID}`);
    expect(ics).toContain("LOCATION:100 Fish Street\\, London");

    const sent = await findInvite("invite-email-pending");
    expect(sent.emailStatus).toBe("sent");
    expect(sent.emailSentAt).not.toBeNull();
    expect(sent.emailAttempts).toBe(1);
    expect(sent.emailClaimedAt).toBeNull();

    const skipped = await findInvite("invite-email-skipped");
    expect(skipped.emailStatus).toBe("skipped");
    expect(skipped.emailAttempts).toBe(0);

    // A second run finds nothing left to send.
    await deleteAllMessages();
    await runCron(request);
    const { messages } = await getMessages();
    expect(
      messages.filter((m) =>
        m.To.some((t) => t.Address.endsWith("@example.com")),
      ),
    ).toHaveLength(0);
  });

  test("skips invites of a canceled event", async ({ request }) => {
    await seed({ status: "canceled" });

    await runCron(request);

    const invite = await findInvite("invite-email-pending");
    expect(invite.emailStatus).toBe("skipped");
    const { messages } = await getMessages();
    expect(messages).toHaveLength(0);
  });

  test("skips invites queued by an account banned since", async ({
    request,
  }) => {
    await seed({ banned: true });

    await runCron(request);

    const invite = await findInvite("invite-email-pending");
    expect(invite.emailStatus).toBe("skipped");
    const { messages } = await getMessages();
    expect(messages).toHaveLength(0);
  });

  test("does not claim an invite another run claimed recently", async ({
    request,
  }) => {
    await seed();
    await prisma.scheduledEventInvite.update({
      where: { uid: "invite-email-pending" },
      data: { emailClaimedAt: new Date(), emailAttempts: 1 },
    });

    await runCron(request);

    const invite = await findInvite("invite-email-pending");
    expect(invite.emailStatus).toBe("pending");
    expect(invite.emailAttempts).toBe(1);
  });

  test("fails an invite whose final claim was abandoned", async ({
    request,
  }) => {
    await seed();
    await prisma.scheduledEventInvite.update({
      where: { uid: "invite-email-pending" },
      data: {
        emailClaimedAt: new Date(Date.now() - 60 * 60_000),
        emailAttempts: 3,
      },
    });

    const summary = await runCron(request);
    expect(summary.abandoned).toBeGreaterThanOrEqual(1);

    const invite = await findInvite("invite-email-pending");
    expect(invite.emailStatus).toBe("failed");
  });
});

test.describe("Booking a poll", () => {
  const BOOKING_POLL_ID = "invite-email-booking-poll";
  const BOOKING_HOST_EMAIL = "invite-email-booking-host@rallly.co";
  const ALICE = "invite-booking-alice@example.com";
  const BOB = "invite-booking-bob@example.com";

  async function cleanupBooking() {
    const poll = await prisma.poll.findUnique({
      where: { id: BOOKING_POLL_ID },
      select: { scheduledEventId: true },
    });
    await prisma.poll.deleteMany({ where: { id: BOOKING_POLL_ID } });
    if (poll?.scheduledEventId) {
      await prisma.scheduledEvent.deleteMany({
        where: { id: poll.scheduledEventId },
      });
    }
    await prisma.user.deleteMany({ where: { email: BOOKING_HOST_EMAIL } });
  }

  test.beforeEach(async () => {
    await cleanupBooking();
    await deleteAllMessages();
  });

  test.afterAll(async () => {
    await cleanupBooking();
    await deleteAllMessages();
  });

  test("queues the selected participants and sends them after the response", async ({
    page,
  }) => {
    const user = await createUserInDb({
      email: BOOKING_HOST_EMAIL,
      name: "Booking Host",
    });
    const space = await prisma.space.findFirstOrThrow({
      where: { ownerId: user.id },
    });
    const poll = await prisma.poll.create({
      data: {
        id: BOOKING_POLL_ID,
        title: "Booking Path Poll",
        userId: user.id,
        spaceId: space.id,
        timeZone: "Europe/London",
        options: {
          create: {
            startTime: new Date(`${YEAR}-09-10T16:00:00.000Z`),
            duration: 60,
          },
        },
      },
      include: { options: true },
    });
    const optionId = poll.options[0].id;
    const participants = [
      // Two responses behind one address: selecting either emails it once.
      { name: "Alice", email: ALICE, vote: "yes" },
      { name: "Alice Again", email: ALICE, vote: "no" },
      { name: "Bob", email: BOB, vote: "ifNeedBe" },
      { name: "Carol", email: null, vote: "yes" },
    ] as const;
    for (const [index, p] of participants.entries()) {
      await prisma.participant.create({
        data: {
          name: p.name,
          email: p.email,
          locale: "en",
          token: `invite-booking-token-${index}-${Date.now()}`,
          pollId: poll.id,
          votes: {
            create: { optionId, pollId: poll.id, type: p.vote },
          },
        },
      });
    }

    await loginWithEmail(page, { email: BOOKING_HOST_EMAIL });
    await page.goto(`/poll/${poll.id}`);
    await page.getByRole("button", { name: "Finalize" }).click();

    const dialog = page.getByRole("dialog");
    await dialog.getByRole("button", { name: /September/ }).click();

    // Everyone with an email starts selected; keep only the first Alice.
    await dialog.getByLabel("Alice Again").uncheck();
    await dialog.getByLabel("Bob").uncheck();
    await dialog.getByRole("button", { name: "Next" }).click();
    await dialog
      .getByRole("button", { name: "Finalize and notify 1 participant" })
      .click();
    await expect(
      dialog.getByText("1 participant will be notified."),
    ).toBeVisible();

    // No cron run: the booking's own after() sends the first batch.
    const { email } = await captureOne(ALICE);
    expect(email.Subject).toBe("Date booked for Booking Path Poll");
    expect(email.Text).toContain("Booking Host");
    expect(email.Attachments).toHaveLength(1);

    const { scheduledEventId } = await prisma.poll.findUniqueOrThrow({
      where: { id: poll.id },
      select: { scheduledEventId: true },
    });
    const invites = await prisma.scheduledEventInvite.findMany({
      where: { scheduledEventId: scheduledEventId ?? "" },
      orderBy: { inviteeEmail: "asc" },
    });
    expect(
      invites.map((i) => ({
        email: i.inviteeEmail,
        status: i.status,
        emailStatus: i.emailStatus,
        attempts: i.emailAttempts,
        locale: i.inviteeLocale,
      })),
    ).toEqual([
      {
        email: ALICE,
        status: "accepted",
        emailStatus: "sent",
        attempts: 1,
        locale: "en",
      },
      {
        email: BOB,
        status: "tentative",
        emailStatus: "skipped",
        attempts: 0,
        locale: "en",
      },
    ]);

    // Exactly one participant email went out: none to Bob, none twice.
    const { messages } = await getMessages();
    const recipients = messages.flatMap((m) => m.To.map((t) => t.Address));
    expect(recipients.filter((r) => r === ALICE)).toHaveLength(1);
    expect(recipients).not.toContain(BOB);
    expect(recipients).toContain(BOOKING_HOST_EMAIL);
  });
});
