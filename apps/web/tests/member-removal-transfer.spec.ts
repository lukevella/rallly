import { randomUUID } from "node:crypto";
import type { Browser, Page } from "@playwright/test";
import { expect, test } from "@playwright/test";
import { prisma } from "@rallly/database";
import dayjs from "dayjs";
import {
  createUserInDb,
  loginWithEmail,
  upgradeSpaceToPro,
} from "./test-utils";

// Removing a member hands what they still have running to another member
// and leaves their history alone. Live: open polls, scheduled polls whose
// event is still ahead (with that event), upcoming events, booking pages.
// Settled: closed polls, past and cancelled events. A settled poll under a
// departed creator is adopted by whoever reopens or schedules it.

const runId = Date.now().toString(36);
const createdUserIds: string[] = [];
let counter = 0;

function nextId(prefix: string) {
  counter += 1;
  return `${prefix}-${runId}-${counter}`;
}

function emailFor(name: string) {
  return `${name.toLowerCase().replace(/\s/g, "-")}-${runId}@example.com`;
}

async function createOwner({ name }: { name: string }) {
  const email = emailFor(name);
  const user = await createUserInDb({ email, name });
  createdUserIds.push(user.id);

  const space = await prisma.space.findFirstOrThrow({
    where: { ownerId: user.id },
  });
  await upgradeSpaceToPro({ spaceId: space.id, userId: user.id, seats: 5 });
  await prisma.space.update({
    where: { id: space.id },
    data: { shared: true },
  });

  return { user, space, email };
}

async function createMember({
  spaceId,
  name,
}: {
  spaceId: string;
  name: string;
}) {
  const email = emailFor(name);
  const user = await createUserInDb({ email, name });
  createdUserIds.push(user.id);

  await prisma.spaceMember.create({
    data: { spaceId, userId: user.id, role: "MEMBER" },
  });

  return { user, email };
}

async function createPoll({
  userId,
  spaceId,
  status = "open",
  scheduledEventId,
}: {
  userId: string;
  spaceId: string;
  status?: "open" | "closed" | "scheduled";
  scheduledEventId?: string;
}) {
  return prisma.poll.create({
    data: {
      id: nextId("transfer"),
      title: `Poll ${counter}`,
      userId,
      spaceId,
      status,
      closedReason: status === "closed" ? "manual" : null,
      scheduledEventId,
      kind: "time",
      options: {
        create: [1, 2, 3].map((day) => ({
          startTime: dayjs().add(day, "day").startOf("hour").toDate(),
          duration: 60,
        })),
      },
    },
    include: { options: true },
  });
}

async function createEvent({
  userId,
  spaceId,
  when,
  status = "confirmed",
}: {
  userId: string;
  spaceId: string;
  when: "upcoming" | "past";
  status?: "confirmed" | "canceled";
}) {
  const start =
    when === "upcoming"
      ? dayjs().add(1, "day").startOf("hour")
      : dayjs().subtract(2, "day").startOf("hour");
  const id = nextId("event");
  return prisma.scheduledEvent.create({
    data: {
      id,
      uid: `${id}@rallly.co`,
      userId,
      spaceId,
      title: `Event ${counter}`,
      start: start.toDate(),
      end: start.add(1, "hour").toDate(),
      status,
    },
  });
}

async function createBookingPage({
  hostId,
  spaceId,
}: {
  hostId: string;
  spaceId: string;
}) {
  const eventType = await prisma.eventType.create({
    data: { spaceId, hostId, name: "Office hours", duration: 30 },
  });
  const sheet = await prisma.sheet.create({
    data: {
      spaceId,
      hostId,
      title: "Office hours",
      urlId: randomUUID().replace(/-/g, ""),
    },
  });
  return { eventType, sheet };
}

async function loginAs(browser: Browser, email: string) {
  const page = await (await browser.newContext()).newPage();
  await loginWithEmail(page, { email });
  return page;
}

async function openRemoveDialog(page: Page, memberEmail: string) {
  await page.goto("/members");
  await page.getByRole("heading", { name: "Members" }).waitFor();
  const row = page.getByRole("listitem").filter({ hasText: memberEmail });
  await row.getByRole("button", { name: "More options" }).click();
  await page.getByRole("menuitem", { name: "Remove member" }).click();
  return page.getByRole("dialog");
}

async function creatorOf(pollId: string) {
  const poll = await prisma.poll.findUniqueOrThrow({
    where: { id: pollId },
    select: { userId: true },
  });
  return poll.userId;
}

async function hostOf(eventId: string) {
  const event = await prisma.scheduledEvent.findUniqueOrThrow({
    where: { id: eventId },
    select: { userId: true },
  });
  return event.userId;
}

test.afterAll(async () => {
  if (createdUserIds.length > 0) {
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
    createdUserIds.length = 0;
  }
});

test.describe("Member removal transfers live content", () => {
  test("hands live content to the admin removing the member and leaves history alone", async ({
    browser,
  }) => {
    const owner = await createOwner({ name: "Transfer Owner" });
    const member = await createMember({
      spaceId: owner.space.id,
      name: "Leaving Member",
    });
    const ids = { userId: member.user.id, spaceId: owner.space.id };

    const openPoll = await createPoll(ids);
    const closedPoll = await createPoll({ ...ids, status: "closed" });
    const upcomingBooked = await createEvent({ ...ids, when: "upcoming" });
    const scheduledLive = await createPoll({
      ...ids,
      status: "scheduled",
      scheduledEventId: upcomingBooked.id,
    });
    const pastBooked = await createEvent({ ...ids, when: "past" });
    const scheduledSettled = await createPoll({
      ...ids,
      status: "scheduled",
      scheduledEventId: pastBooked.id,
    });
    const upcomingEvent = await createEvent({ ...ids, when: "upcoming" });
    const pastEvent = await createEvent({ ...ids, when: "past" });
    const canceledEvent = await createEvent({
      ...ids,
      when: "upcoming",
      status: "canceled",
    });
    const { eventType, sheet } = await createBookingPage({
      hostId: member.user.id,
      spaceId: owner.space.id,
    });

    const page = await loginAs(browser, owner.email);
    const dialog = await openRemoveDialog(page, member.email);
    await expect(dialog.getByText("1 open poll")).toBeVisible();
    await expect(dialog.getByText("2 upcoming events")).toBeVisible();
    await expect(
      dialog.getByRole("combobox", { name: "Transfer to" }),
    ).toContainText(owner.user.name);
    await dialog.getByRole("button", { name: "Confirm" }).click();
    await expect(page.getByText("Member removed successfully")).toBeVisible();

    expect(
      await prisma.spaceMember.count({
        where: { spaceId: owner.space.id, userId: member.user.id },
      }),
    ).toBe(0);

    // Live content follows the recipient.
    expect(await creatorOf(openPoll.id)).toBe(owner.user.id);
    expect(await creatorOf(scheduledLive.id)).toBe(owner.user.id);
    expect(await hostOf(upcomingBooked.id)).toBe(owner.user.id);
    expect(await hostOf(upcomingEvent.id)).toBe(owner.user.id);
    const [movedType, movedSheet] = await Promise.all([
      prisma.eventType.findUniqueOrThrow({ where: { id: eventType.id } }),
      prisma.sheet.findUniqueOrThrow({ where: { id: sheet.id } }),
    ]);
    expect(movedType.hostId).toBe(owner.user.id);
    expect(movedSheet.hostId).toBe(owner.user.id);

    // Settled content keeps its author.
    expect(await creatorOf(closedPoll.id)).toBe(member.user.id);
    expect(await creatorOf(scheduledSettled.id)).toBe(member.user.id);
    expect(await hostOf(pastBooked.id)).toBe(member.user.id);
    expect(await hostOf(pastEvent.id)).toBe(member.user.id);
    expect(await hostOf(canceledEvent.id)).toBe(member.user.id);
  });

  test("hands live content to another member when one is chosen", async ({
    browser,
  }) => {
    const owner = await createOwner({ name: "Picker Owner" });
    const leaving = await createMember({
      spaceId: owner.space.id,
      name: "Picker Leaving",
    });
    const recipient = await createMember({
      spaceId: owner.space.id,
      name: "Picker Recipient",
    });
    const poll = await createPoll({
      userId: leaving.user.id,
      spaceId: owner.space.id,
    });

    const page = await loginAs(browser, owner.email);
    const dialog = await openRemoveDialog(page, leaving.email);
    await dialog.getByRole("combobox", { name: "Transfer to" }).click();
    await page.getByRole("option", { name: recipient.user.name }).click();
    await dialog.getByRole("button", { name: "Confirm" }).click();
    await expect(page.getByText("Member removed successfully")).toBeVisible();

    expect(await creatorOf(poll.id)).toBe(recipient.user.id);
  });

  test("a member with nothing live is removed with a plain confirmation", async ({
    browser,
  }) => {
    const owner = await createOwner({ name: "Plain Owner" });
    const member = await createMember({
      spaceId: owner.space.id,
      name: "Plain Member",
    });
    const closedPoll = await createPoll({
      userId: member.user.id,
      spaceId: owner.space.id,
      status: "closed",
    });

    const page = await loginAs(browser, owner.email);
    const dialog = await openRemoveDialog(page, member.email);
    await expect(
      dialog.getByRole("combobox", { name: "Transfer to" }),
    ).toHaveCount(0);
    await dialog.getByRole("button", { name: "Confirm" }).click();
    await expect(page.getByText("Member removed successfully")).toBeVisible();

    expect(
      await prisma.spaceMember.count({
        where: { spaceId: owner.space.id, userId: member.user.id },
      }),
    ).toBe(0);
    expect(await creatorOf(closedPoll.id)).toBe(member.user.id);
  });

  test("reopening a poll whose creator has left makes the reopener its organizer", async ({
    browser,
  }) => {
    const owner = await createOwner({ name: "Reopen Owner" });
    const member = await createMember({
      spaceId: owner.space.id,
      name: "Reopen Departed",
    });
    const poll = await createPoll({
      userId: member.user.id,
      spaceId: owner.space.id,
      status: "closed",
    });
    await prisma.spaceMember.deleteMany({
      where: { spaceId: owner.space.id, userId: member.user.id },
    });

    const page = await loginAs(browser, owner.email);
    await page.goto(`/poll/${poll.id}`);
    await page.getByRole("button", { name: "Manage" }).click();
    await page.getByRole("menuitem", { name: "Reopen poll" }).click();

    await expect.poll(() => creatorOf(poll.id)).toBe(owner.user.id);
    const reopened = await prisma.poll.findUniqueOrThrow({
      where: { id: poll.id },
      select: { status: true },
    });
    expect(reopened.status).toBe("open");
  });

  test("scheduling a poll whose creator has left makes the scheduler its organizer", async ({
    browser,
  }) => {
    const owner = await createOwner({ name: "Book Owner" });
    const member = await createMember({
      spaceId: owner.space.id,
      name: "Book Departed",
    });
    const poll = await createPoll({
      userId: member.user.id,
      spaceId: owner.space.id,
    });
    await prisma.spaceMember.deleteMany({
      where: { spaceId: owner.space.id, userId: member.user.id },
    });

    const page = await loginAs(browser, owner.email);
    // The tRPC gate, exercised directly; the body shape is the superjson
    // transformer's.
    const response = await page.request.post("/api/trpc/polls.book", {
      data: {
        json: {
          pollId: poll.id,
          optionId: poll.options[0]?.id,
          notify: "none",
        },
      },
    });
    expect(response.status()).toBe(200);

    expect(await creatorOf(poll.id)).toBe(owner.user.id);
    const booked = await prisma.poll.findUniqueOrThrow({
      where: { id: poll.id },
      select: { status: true, scheduledEvent: { select: { userId: true } } },
    });
    expect(booked.status).toBe("scheduled");
    expect(booked.scheduledEvent?.userId).toBe(owner.user.id);
  });
});
