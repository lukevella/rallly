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
 * the booking sends its first batch and the minute cron drains the queue.
 * The first suite seeds a booked event with a queued email, runs the cron
 * and asserts on mailpit and the queue row; the second books through the
 * finalize wizard.
 */

const CRON_SECRET = process.env.CRON_SECRET;
const EVENT_ID = "invite-email-event";
const EVENT_UID = "invite-email-event@rallly.co";
const POLL_ID = "invite-email-poll";
const TITLE = "Invite Email Test Event";
const HOST_EMAIL = "invite-email-host@rallly.co";
const QUEUED_INVITE_UID = "invite-email-queued";

const YEAR = new Date().getFullYear() + 1;

async function runCron(request: APIRequestContext) {
  const response = await request.get("/api/house-keeping/send-queued-emails", {
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
  // Queued emails go with the user that queued them.
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
              uid: QUEUED_INVITE_UID,
              inviteeName: "Queued Invitee",
              inviteeEmail: "invite-queued@example.com",
              inviteeTimeZone: "America/New_York",
              inviteeLocale: "en",
              status: "accepted",
            },
            {
              uid: "invite-email-not-queued",
              inviteeName: "Not Queued Invitee",
              inviteeEmail: "invite-not-queued@example.com",
              status: "accepted",
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
  return prisma.queuedEmail.create({
    data: {
      kind: "scheduled_event_invite",
      subjectId: QUEUED_INVITE_UID,
      batchId: EVENT_ID,
      userId: user.id,
    },
  });
}

function findQueued(id: string) {
  return prisma.queuedEmail.findUniqueOrThrow({ where: { id } });
}

test.describe("Queued invite emails", () => {
  test.beforeEach(async () => {
    await deleteAllMessages();
  });

  test.afterAll(async () => {
    await cleanup();
    await deleteAllMessages();
  });

  test("sends a queued invite once and nothing to invites not queued", async ({
    request,
  }) => {
    const queued = await seed();

    const summary = await runCron(request);
    expect(summary.sent).toBeGreaterThanOrEqual(1);

    const { email } = await captureOne("invite-queued@example.com");
    expect(email.Subject).toBe(`Date booked for ${TITLE}`);
    expect(email.Text).toContain("Invite Email Host");
    expect(email.Attachments).toHaveLength(1);
    const ics = (
      await getAttachmentText(email.ID, email.Attachments[0].PartID)
    ).replace(/\r?\n[ \t]/g, "");
    expect(ics).toContain(`UID:${EVENT_UID}`);
    expect(ics).toContain("LOCATION:100 Fish Street\\, London");

    const sent = await findQueued(queued.id);
    expect(sent.status).toBe("sent");
    expect(sent.sentAt).not.toBeNull();
    expect(sent.attempts).toBe(1);
    expect(sent.claimedAt).toBeNull();

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

  test("skips an invite whose event was canceled", async ({ request }) => {
    const queued = await seed({ status: "canceled" });

    await runCron(request);

    const row = await findQueued(queued.id);
    expect(row.status).toBe("skipped");
    expect(row.lastError).toBe("Event was canceled");
    const { messages } = await getMessages();
    expect(messages).toHaveLength(0);
  });

  test("skips emails queued by an account banned since", async ({
    request,
  }) => {
    const queued = await seed({ banned: true });

    await runCron(request);

    const row = await findQueued(queued.id);
    expect(row.status).toBe("skipped");
    expect(row.lastError).toBe("Queued by a banned account");
    const { messages } = await getMessages();
    expect(messages).toHaveLength(0);
  });

  test("does not claim an email another run claimed recently", async ({
    request,
  }) => {
    const queued = await seed();
    await prisma.queuedEmail.update({
      where: { id: queued.id },
      data: { claimedAt: new Date(), attempts: 1 },
    });

    await runCron(request);

    const row = await findQueued(queued.id);
    expect(row.status).toBe("pending");
    expect(row.attempts).toBe(1);
  });

  test("fails an email whose final claim was abandoned", async ({
    request,
  }) => {
    const queued = await seed();
    await prisma.queuedEmail.update({
      where: { id: queued.id },
      data: {
        claimedAt: new Date(Date.now() - 60 * 60_000),
        attempts: 3,
      },
    });

    const summary = await runCron(request);
    expect(summary.abandoned).toBeGreaterThanOrEqual(1);

    const row = await findQueued(queued.id);
    expect(row.status).toBe("failed");
  });

  test("purges finished emails past the retention period and keeps the rest", async ({
    request,
  }) => {
    const queued = await seed();
    const daysAgo = (days: number) =>
      new Date(Date.now() - days * 24 * 60 * 60_000);
    const base = {
      kind: "scheduled_event_invite" as const,
      batchId: EVENT_ID,
      userId: queued.userId,
    };
    const [oldSent, oldFailed, oldSkipped, recentSent] = await Promise.all([
      prisma.queuedEmail.create({
        data: { ...base, subjectId: "old-sent", status: "sent" },
      }),
      prisma.queuedEmail.create({
        data: { ...base, subjectId: "old-failed", status: "failed" },
      }),
      prisma.queuedEmail.create({
        data: { ...base, subjectId: "old-skipped", status: "skipped" },
      }),
      prisma.queuedEmail.create({
        data: { ...base, subjectId: "recent-sent", status: "sent" },
      }),
    ]);
    // Prisma stamps updatedAt on every write, so age the rows directly. The
    // queued pending email is aged too: pending is never purged.
    await prisma.$executeRaw`
      UPDATE queued_emails SET updated_at = ${daysAgo(31)}
      WHERE id IN (${oldSent.id}, ${oldFailed.id}, ${oldSkipped.id}, ${queued.id})`;
    await prisma.$executeRaw`
      UPDATE queued_emails SET updated_at = ${daysAgo(29)}
      WHERE id = ${recentSent.id}`;

    const summary = await runCron(request);
    expect(summary.purged).toBeGreaterThanOrEqual(3);

    const remaining = await prisma.queuedEmail.findMany({
      where: { batchId: EVENT_ID },
      select: { id: true },
    });
    const ids = remaining.map((row) => row.id);
    expect(ids).not.toContain(oldSent.id);
    expect(ids).not.toContain(oldFailed.id);
    expect(ids).not.toContain(oldSkipped.id);
    expect(ids).toContain(recentSent.id);
    expect(ids).toContain(queued.id);
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
        locale: i.inviteeLocale,
      })),
    ).toEqual([
      { email: ALICE, status: "accepted", locale: "en" },
      { email: BOB, status: "tentative", locale: "en" },
    ]);

    // Only the selected address was queued, and the booking sent it.
    const queued = await prisma.queuedEmail.findMany({
      where: { batchId: scheduledEventId ?? "" },
    });
    expect(
      queued.map((q) => ({
        kind: q.kind,
        subjectId: q.subjectId,
        status: q.status,
        attempts: q.attempts,
      })),
    ).toEqual([
      {
        kind: "scheduled_event_invite",
        subjectId: invites[0].uid,
        status: "sent",
        attempts: 1,
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
