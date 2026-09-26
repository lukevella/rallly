import type { Browser, Page } from "@playwright/test";
import { expect, test } from "@playwright/test";
import { prisma } from "@rallly/database";
import {
  captureOne,
  deleteAllMessages,
  getMessages,
} from "@rallly/test-helpers";
import dayjs from "dayjs";
import { InvitePage } from "./invite-page";
import {
  createUserInDb,
  loginWithEmail,
  upgradeSpaceToPro,
} from "./test-utils";

// A poll that belongs to a space is the space's: its creator manages it for
// as long as they are an effective member and not a day longer. These tests
// pin that rule at the two places it is enforced (the admin page loader and
// the tRPC/action gate) and at the notification recipient, which must fall
// silent for a creator who has left.

const runId = Date.now().toString(36);
const createdUserIds: string[] = [];
let pollCounter = 0;

function emailFor(name: string) {
  return `${name.toLowerCase().replace(/\s/g, "-")}-${runId}@example.com`;
}

async function createOwner({
  name,
  shared,
}: {
  name: string;
  shared: boolean;
}) {
  const email = emailFor(name);
  const user = await createUserInDb({ email, name });
  createdUserIds.push(user.id);

  const space = await prisma.space.findFirstOrThrow({
    where: { ownerId: user.id },
  });
  await upgradeSpaceToPro({ spaceId: space.id, userId: user.id, seats: 3 });
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
}: {
  userId: string;
  spaceId: string | null;
}) {
  pollCounter += 1;
  return prisma.poll.create({
    data: {
      id: `removal-${runId}-${pollCounter}`,
      title: `Team poll ${pollCounter}`,
      userId,
      spaceId,
      kind: "time",
      options: {
        create: [1, 2, 3].map((day) => ({
          startTime: dayjs().add(day, "day").startOf("hour").toDate(),
          duration: 60,
        })),
      },
    },
  });
}

async function removeMember({
  spaceId,
  userId,
}: {
  spaceId: string;
  userId: string;
}) {
  await prisma.spaceMember.deleteMany({ where: { spaceId, userId } });
}

async function loginAs(browser: Browser, email: string) {
  const page = await (await browser.newContext()).newPage();
  await loginWithEmail(page, { email });
  return page;
}

async function expectAdminPage(page: Page, pollId: string) {
  await page.goto(`/poll/${pollId}`);
  await expect(page).toHaveURL(new RegExp(`/poll/${pollId}$`));
  await expect(page.getByRole("button", { name: "Manage" })).toBeVisible();
}

async function expectInvitePage(page: Page, pollId: string) {
  await page.goto(`/poll/${pollId}`);
  await expect(page).toHaveURL(new RegExp(`/invite/${pollId}$`));
}

// The tRPC gate, exercised without the UI the loader already hides. The
// body shape is the superjson transformer's.
async function closePollViaTrpc(page: Page, pollId: string) {
  return page.request.post("/api/trpc/polls.close", {
    data: { json: { pollId } },
  });
}

async function respondAsGuest(browser: Browser, pollId: string, name: string) {
  const page = await (await browser.newContext()).newPage();
  await page.goto(`/invite/${pollId}`);
  await new InvitePage(page).addParticipant(name);
  await page.context().close();
}

function messagesTo(email: string) {
  return getMessages().then(({ messages }) =>
    messages.filter((message) =>
      message.To.some((recipient) => recipient.Address === email),
    ),
  );
}

test.afterAll(async () => {
  if (createdUserIds.length > 0) {
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
    createdUserIds.length = 0;
  }
});

test.describe("Poll access after a member is removed", () => {
  test("the removed creator lands on the invite page and cannot close the poll", async ({
    browser,
  }) => {
    const owner = await createOwner({ name: "Shared Owner", shared: true });
    const member = await createMember({
      spaceId: owner.space.id,
      name: "Departing Member",
    });
    const poll = await createPoll({
      userId: member.user.id,
      spaceId: owner.space.id,
    });
    await removeMember({ spaceId: owner.space.id, userId: member.user.id });

    const page = await loginAs(browser, member.email);
    await expectInvitePage(page, poll.id);

    const response = await closePollViaTrpc(page, poll.id);
    expect(response.status()).toBe(403);
    const after = await prisma.poll.findUniqueOrThrow({
      where: { id: poll.id },
      select: { status: true },
    });
    expect(after.status).toBe("open");
  });

  test("a remaining member of a shared space keeps managing the poll", async ({
    browser,
  }) => {
    const owner = await createOwner({ name: "Staying Owner", shared: true });
    const member = await createMember({
      spaceId: owner.space.id,
      name: "Former Colleague",
    });
    const poll = await createPoll({
      userId: member.user.id,
      spaceId: owner.space.id,
    });
    await removeMember({ spaceId: owner.space.id, userId: member.user.id });

    const page = await loginAs(browser, owner.email);
    await expectAdminPage(page, poll.id);
  });

  test("in an independent space the removed creator loses access and the owner does not gain it", async ({
    browser,
  }) => {
    test.setTimeout(90_000);

    const owner = await createOwner({
      name: "Independent Owner",
      shared: false,
    });
    const member = await createMember({
      spaceId: owner.space.id,
      name: "Independent Member",
    });
    const poll = await createPoll({
      userId: member.user.id,
      spaceId: owner.space.id,
    });
    await removeMember({ spaceId: owner.space.id, userId: member.user.id });

    const memberPage = await loginAs(browser, member.email);
    await expectInvitePage(memberPage, poll.id);

    const ownerPage = await loginAs(browser, owner.email);
    await expectInvitePage(ownerPage, poll.id);
  });

  test("a poll outside any space stays with its creator", async ({
    browser,
  }) => {
    const owner = await createOwner({ name: "Spaceless Owner", shared: true });
    const member = await createMember({
      spaceId: owner.space.id,
      name: "Spaceless Member",
    });
    const poll = await createPoll({ userId: member.user.id, spaceId: null });
    await removeMember({ spaceId: owner.space.id, userId: member.user.id });

    const page = await loginAs(browser, member.email);
    await expectAdminPage(page, poll.id);
  });

  test("a member left behind by a downgrade cannot manage the space's polls", async ({
    browser,
  }) => {
    const owner = await createOwner({ name: "Lapsed Owner", shared: true });
    const member = await createMember({
      spaceId: owner.space.id,
      name: "Lapsed Member",
    });
    const poll = await createPoll({
      userId: member.user.id,
      spaceId: owner.space.id,
    });
    // syncSpaceTier leaves membership rows in place when Pro lapses; only
    // the tier decides whether they are effective.
    await prisma.space.update({
      where: { id: owner.space.id },
      data: { tier: "hobby" },
    });

    const page = await loginAs(browser, member.email);
    await expectInvitePage(page, poll.id);
  });

  test("the removed creator no longer receives response notifications", async ({
    browser,
  }) => {
    test.setTimeout(90_000);

    const owner = await createOwner({ name: "Notified Owner", shared: true });
    const member = await createMember({
      spaceId: owner.space.id,
      name: "Notified Member",
    });
    const poll = await createPoll({
      userId: member.user.id,
      spaceId: owner.space.id,
    });

    // Control: while still a member, a response reaches the creator.
    await deleteAllMessages();
    await respondAsGuest(browser, poll.id, "First Voter");
    const { email } = await captureOne(member.email);
    expect(email.Subject).toContain("First Voter");

    await removeMember({ spaceId: owner.space.id, userId: member.user.id });

    await deleteAllMessages();
    await respondAsGuest(browser, poll.id, "Second Voter");
    // The notification is sent inside the action, so by the time the
    // response is saved a mail would already be in the inbox.
    await new Promise((resolve) => setTimeout(resolve, 2000));
    expect(await messagesTo(member.email)).toHaveLength(0);
  });
});
