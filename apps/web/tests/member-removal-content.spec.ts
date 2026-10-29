import { randomUUID } from "node:crypto";
import type { Browser, Page } from "@playwright/test";
import { expect, test } from "@playwright/test";
import { prisma } from "@rallly/database";
import { deleteAllMessages, getMessages } from "@rallly/test-helpers";
import dayjs from "dayjs";
import {
  createUserInDb,
  loginWithEmail,
  upgradeSpaceToPro,
} from "./test-utils";

// Removing a member settles everything they created in the space: it is
// reassigned to a current member, or deleted. Reassign is the default when
// anything is active, delete when nothing is.

test.describe.configure({ mode: "serial" });

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

async function createOwner({
  name,
  shared = true,
}: {
  name: string;
  shared?: boolean;
}) {
  const email = emailFor(name);
  const user = await createUserInDb({ email, name });
  createdUserIds.push(user.id);

  const space = await prisma.space.findFirstOrThrow({
    where: { ownerId: user.id },
  });
  await upgradeSpaceToPro({ spaceId: space.id, userId: user.id, seats: 5 });
  await prisma.space.update({ where: { id: space.id }, data: { shared } });

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
}: {
  userId: string;
  spaceId: string;
  status?: "open" | "closed";
}) {
  const id = nextId("removal");
  return prisma.poll.create({
    data: {
      id,
      title: `Poll ${id}`,
      userId,
      spaceId,
      status,
      closedReason: status === "closed" ? "manual" : null,
      kind: "time",
      options: {
        create: [1, 2].map((day) => ({
          startTime: dayjs().add(day, "day").startOf("hour").toDate(),
          duration: 60,
        })),
      },
    },
  });
}

async function createEvent({
  userId,
  spaceId,
  when,
  attendees = [],
  conferencing,
}: {
  userId: string;
  spaceId: string;
  when: "upcoming" | "past";
  attendees?: { name: string; email: string }[];
  conferencing?: object;
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
      title: `Event ${id}`,
      start: start.toDate(),
      end: start.add(1, "hour").toDate(),
      conferencing,
      invites: {
        create: attendees.map((attendee) => ({
          uid: randomUUID(),
          inviteeName: attendee.name,
          inviteeEmail: attendee.email,
          status: "accepted",
        })),
      },
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

async function isMember({
  spaceId,
  userId,
}: {
  spaceId: string;
  userId: string;
}) {
  return (await prisma.spaceMember.count({ where: { spaceId, userId } })) > 0;
}

test.afterAll(async () => {
  if (createdUserIds.length > 0) {
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
    createdUserIds.length = 0;
  }
});

test.describe("Member removal", () => {
  test("reassigns everything to the admin by default when anything is active", async ({
    browser,
  }) => {
    const owner = await createOwner({ name: "Reassign Owner" });
    const member = await createMember({
      spaceId: owner.space.id,
      name: "Reassign Leaver",
    });
    const ids = { userId: member.user.id, spaceId: owner.space.id };

    const openPoll = await createPoll(ids);
    const closedPoll = await createPoll({ ...ids, status: "closed" });
    const upcomingEvent = await createEvent({
      ...ids,
      when: "upcoming",
      conferencing: { type: "custom", url: "https://meet.example.com/abc" },
    });
    const pastEvent = await createEvent({ ...ids, when: "past" });
    const { eventType, sheet } = await createBookingPage({
      hostId: member.user.id,
      spaceId: owner.space.id,
    });

    const page = await loginAs(browser, owner.email);
    const dialog = await openRemoveDialog(page, member.email);
    await expect(dialog.getByText("1 open poll")).toBeVisible();
    await expect(dialog.getByText("1 upcoming event")).toBeVisible();
    await expect(dialog.getByText("1 closed poll")).toBeVisible();
    await expect(dialog.getByText("1 past event")).toBeVisible();
    await expect(dialog.getByRole("radio", { name: /Reassign/ })).toBeChecked();
    await expect(
      dialog.getByRole("combobox", { name: "Reassign to" }),
    ).toContainText(owner.user.name);
    await expect(
      dialog.getByText("Video call links created by Reassign Leaver"),
    ).toBeVisible();
    await dialog.getByRole("button", { name: "Remove member" }).click();
    await expect(page.getByText("Member removed successfully")).toBeVisible();

    expect(await isMember(ids)).toBe(false);

    const polls = await prisma.poll.findMany({
      where: { id: { in: [openPoll.id, closedPoll.id] } },
      select: { userId: true, deleted: true },
    });
    expect(polls).toEqual([
      { userId: owner.user.id, deleted: false },
      { userId: owner.user.id, deleted: false },
    ]);
    const events = await prisma.scheduledEvent.findMany({
      where: { id: { in: [upcomingEvent.id, pastEvent.id] } },
      select: { userId: true, status: true, deletedAt: true },
    });
    expect(events).toEqual([
      { userId: owner.user.id, status: "confirmed", deletedAt: null },
      { userId: owner.user.id, status: "confirmed", deletedAt: null },
    ]);
    expect(
      (
        await prisma.eventType.findUniqueOrThrow({
          where: { id: eventType.id },
        })
      ).hostId,
    ).toBe(owner.user.id);
    expect(
      (await prisma.sheet.findUniqueOrThrow({ where: { id: sheet.id } }))
        .hostId,
    ).toBe(owner.user.id);

    const activities = await prisma.pollActivity.findMany({
      where: {
        pollId: { in: [openPoll.id, closedPoll.id] },
        type: "poll_organizer_changed",
      },
      select: { pollId: true, userId: true, payload: true },
    });
    expect(activities).toHaveLength(2);
    for (const activity of activities) {
      expect(activity.userId).toBe(owner.user.id);
      expect(activity.payload).toEqual({
        from: { id: member.user.id, name: member.user.name },
        to: { id: owner.user.id, name: owner.user.name },
        reason: "member_removed",
      });
    }
  });

  test("reassigns to the chosen member, who then sees the content in an independent space", async ({
    browser,
  }) => {
    const owner = await createOwner({
      name: "Independent Owner",
      shared: false,
    });
    const leaving = await createMember({
      spaceId: owner.space.id,
      name: "Independent Leaver",
    });
    const recipient = await createMember({
      spaceId: owner.space.id,
      name: "Independent Recipient",
    });
    const bystander = await createMember({
      spaceId: owner.space.id,
      name: "Independent Bystander",
    });
    const poll = await createPoll({
      userId: leaving.user.id,
      spaceId: owner.space.id,
    });

    const page = await loginAs(browser, owner.email);
    const dialog = await openRemoveDialog(page, leaving.email);
    await dialog.getByRole("combobox", { name: "Reassign to" }).click();
    await page.getByRole("option", { name: recipient.user.name }).click();
    await dialog.getByRole("button", { name: "Remove member" }).click();
    await expect(page.getByText("Member removed successfully")).toBeVisible();

    const moved = await prisma.poll.findUniqueOrThrow({
      where: { id: poll.id },
      select: { userId: true },
    });
    expect(moved.userId).toBe(recipient.user.id);

    const recipientPage = await loginAs(browser, recipient.email);
    await recipientPage.goto("/polls");
    await expect(
      recipientPage
        .getByRole("link", { name: poll.title })
        .filter({ visible: true }),
    ).toBeVisible();

    const bystanderPage = await loginAs(browser, bystander.email);
    await bystanderPage.goto("/polls");
    await bystanderPage.getByRole("heading", { name: "Polls" }).waitFor();
    await expect(
      bystanderPage.getByRole("link", { name: poll.title }),
    ).toHaveCount(0);
  });

  test("deletes by default when nothing is active, without emailing anyone", async ({
    browser,
  }) => {
    const owner = await createOwner({ name: "Finished Owner" });
    const member = await createMember({
      spaceId: owner.space.id,
      name: "Finished Leaver",
    });
    const ids = { userId: member.user.id, spaceId: owner.space.id };
    const closedPoll = await createPoll({ ...ids, status: "closed" });
    const pastEvent = await createEvent({
      ...ids,
      when: "past",
      attendees: [
        { name: "Past Attendee", email: `past-attendee-${runId}@example.com` },
      ],
    });

    const page = await loginAs(browser, owner.email);
    await deleteAllMessages();
    const dialog = await openRemoveDialog(page, member.email);
    await expect(
      dialog.getByText("No open polls or upcoming events"),
    ).toBeVisible();
    await expect(dialog.getByRole("radio", { name: /Delete/ })).toBeChecked();
    await dialog.getByRole("button", { name: "Remove member" }).click();
    await expect(page.getByText("Member removed successfully")).toBeVisible();

    expect(await isMember(ids)).toBe(false);
    const poll = await prisma.poll.findUniqueOrThrow({
      where: { id: closedPoll.id },
      select: { deleted: true },
    });
    expect(poll.deleted).toBe(true);
    const event = await prisma.scheduledEvent.findUniqueOrThrow({
      where: { id: pastEvent.id },
      select: { status: true, deletedAt: true },
    });
    expect(event.status).toBe("confirmed");
    expect(event.deletedAt).not.toBeNull();

    await page.waitForTimeout(1000);
    const { messages } = await getMessages();
    expect(
      messages.filter((message) =>
        message.To.some(
          (to) => to.Address === `past-attendee-${runId}@example.com`,
        ),
      ),
    ).toHaveLength(0);
  });

  test("deleting cancels upcoming events and emails each attendee", async ({
    browser,
  }) => {
    const owner = await createOwner({ name: "Delete Owner" });
    const member = await createMember({
      spaceId: owner.space.id,
      name: "Delete Leaver",
    });
    const ids = { userId: member.user.id, spaceId: owner.space.id };
    const attendees = [
      { name: "Attendee One", email: `attendee-one-${runId}@example.com` },
      { name: "Attendee Two", email: `attendee-two-${runId}@example.com` },
    ];
    const openPoll = await createPoll(ids);
    const upcomingEvent = await createEvent({
      ...ids,
      when: "upcoming",
      attendees,
    });

    const page = await loginAs(browser, owner.email);
    await deleteAllMessages();
    const dialog = await openRemoveDialog(page, member.email);
    await dialog.getByRole("radio", { name: /Delete/ }).click();
    await dialog.getByRole("button", { name: "Remove member" }).click();
    await expect(page.getByText("Member removed successfully")).toBeVisible();

    const poll = await prisma.poll.findUniqueOrThrow({
      where: { id: openPoll.id },
      select: { deleted: true, userId: true },
    });
    expect(poll).toEqual({ deleted: true, userId: member.user.id });
    const deletedActivity = await prisma.pollActivity.count({
      where: { pollId: openPoll.id, type: "poll_deleted" },
    });
    expect(deletedActivity).toBe(1);

    const event = await prisma.scheduledEvent.findUniqueOrThrow({
      where: { id: upcomingEvent.id },
      select: { status: true, deletedAt: true, sequence: true },
    });
    expect(event.status).toBe("canceled");
    expect(event.deletedAt).not.toBeNull();
    expect(event.sequence).toBe(1);

    for (const attendee of attendees) {
      await expect
        .poll(async () => {
          const { messages } = await getMessages();
          return messages.filter((message) =>
            message.To.some((to) => to.Address === attendee.email),
          ).length;
        })
        .toBe(1);
    }
  });
});
