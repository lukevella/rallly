import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";
import { prisma } from "@rallly/database";
import { LoginPage } from "./login-page";
import { NewPollPage } from "./new-poll-page";
import {
  createUserInDb,
  loginWithEmail,
  upgradeSpaceToPro,
} from "./test-utils";

// Guests may have 1 open poll, free spaces 3 per organizer, Pro unlimited.
// The limit is exercised through tRPC: the UI that explains it is not what
// is under test here.

const runId = Date.now().toString(36);
const createdUserIds: string[] = [];

test.afterAll(async () => {
  await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
});

async function createFreeUser(name: string) {
  const user = await createUserInDb({
    email: `${name}-${runId}@example.com`,
    name,
  });
  createdUserIds.push(user.id);
  const space = await prisma.space.findFirstOrThrow({
    where: { ownerId: user.id },
  });
  return { user, space };
}

async function seedOpenPolls({
  userId,
  spaceId,
  count,
}: {
  userId: string;
  spaceId: string;
  count: number;
}) {
  const ids = Array.from(
    { length: count },
    (_, i) => `limit-${runId}-${userId}-${i}`,
  );
  await prisma.poll.createMany({
    data: ids.map((id) => ({ id, title: id, userId, spaceId })),
  });
  return ids;
}

// The body and response shapes are the superjson transformer's.
async function makePoll(page: Page) {
  const res = await page.request.post("/api/trpc/polls.make", {
    data: {
      json: {
        title: "Over the limit",
        options: [{ startDate: "2099-01-01" }],
      },
    },
  });
  expect(res.ok()).toBe(true);
  const body = await res.json();
  return body.result.data.json as
    | { ok: true; data: { id: string } }
    | { ok: false; error: { code: string; usage: unknown } };
}

async function reopenPoll(page: Page, pollId: string) {
  const res = await page.request.post("/api/trpc/polls.reopen", {
    data: { json: { pollId } },
  });
  expect(res.ok()).toBe(true);
  return (await res.json()).result.data.json as
    | { ok: true }
    | { ok: false; error: { code: string; usage: unknown } };
}

function countOpen(userId: string) {
  return prisma.poll.count({
    where: { userId, status: "open", deleted: false },
  });
}

test.describe("free organizer", () => {
  let page: Page;
  let userId: string;
  let spaceId: string;
  let pollIds: string[];

  test.beforeEach(async ({ browser }) => {
    const { user, space } = await createFreeUser(
      `free-${Math.random().toString(36).slice(2, 8)}`,
    );
    userId = user.id;
    spaceId = space.id;
    pollIds = await seedOpenPolls({ userId, spaceId, count: 3 });
    page = await (await browser.newContext()).newPage();
    await loginWithEmail(page, { email: user.email });
  });

  test.afterEach(async () => {
    await page.context().close();
  });

  test("is refused a fourth open poll", async () => {
    expect(await makePoll(page)).toMatchObject({
      ok: false,
      error: {
        code: "OPEN_POLL_LIMIT_REACHED",
        usage: { tier: "hobby", limit: 3, openCount: 3 },
      },
    });
    expect(await countOpen(userId)).toBe(3);
  });

  test("gets a slot back when a poll is closed", async () => {
    await prisma.poll.update({
      where: { id: pollIds[0] },
      data: { status: "closed", closedReason: "manual" },
    });
    expect((await makePoll(page)).ok).toBe(true);
  });

  test("gets a slot back when a poll is scheduled", async () => {
    await prisma.poll.update({
      where: { id: pollIds[0] },
      data: { status: "scheduled" },
    });
    expect((await makePoll(page)).ok).toBe(true);
  });

  test("gets a slot back when a poll is deleted", async () => {
    await prisma.poll.update({
      where: { id: pollIds[0] },
      data: { deleted: true, deletedAt: new Date() },
    });
    expect((await makePoll(page)).ok).toBe(true);
  });

  test("cannot reopen a closed poll while at the limit", async () => {
    const closedId = `limit-${runId}-${userId}-closed`;
    await prisma.poll.create({
      data: {
        id: closedId,
        title: closedId,
        userId,
        spaceId,
        status: "closed",
        closedReason: "manual",
      },
    });

    expect(await reopenPoll(page, closedId)).toMatchObject({
      ok: false,
      error: { code: "OPEN_POLL_LIMIT_REACHED" },
    });
    expect(
      (await prisma.poll.findUniqueOrThrow({ where: { id: closedId } })).status,
    ).toBe("closed");
  });

  test("is shown the limit with the open polls and an upgrade", async () => {
    await page.goto("/new");
    const dialog = page.getByRole("dialog", {
      name: "Open poll limit reached",
    });
    await expect(dialog).toBeVisible();
    await expect(
      dialog.getByRole("progressbar", { name: "Open polls" }),
    ).toHaveAttribute("aria-valuetext", "3 of 3");
    await page.keyboard.press("Escape");
    await expect(dialog).toBeVisible();
    await page.screenshot({
      path: "test-results/open-poll-limit-free.png",
    });

    await dialog.getByRole("button", { name: "Upgrade" }).click();
    await expect(
      page.getByRole("button", { name: "Continue to checkout" }),
    ).toBeVisible();
  });

  test("is shown the limit on a /new the router had cached below it", async () => {
    // Start one under the limit, so /new renders without the dialog and the
    // client router keeps that render.
    await prisma.poll.update({
      where: { id: pollIds[0] },
      data: { status: "closed", closedReason: "manual" },
    });
    const newPollPage = new NewPollPage(page);
    await newPollPage.goto();
    await expect(
      page.getByRole("dialog", { name: "Open poll limit reached" }),
    ).toHaveCount(0);

    const pollPage = await newPollPage.create({ name: "Third poll" });
    await pollPage.closeShareDialog();

    // Back to /new without a full page load: the cached render says 2 of 3.
    await page.goBack();
    await expect(page).toHaveURL(/\/new/);
    await expect(
      page.getByRole("dialog", { name: "Open poll limit reached" }),
    ).toBeVisible();
  });

  test("can leave the limit for their polls", async () => {
    await page.goto("/new");
    await page
      .getByRole("dialog", { name: "Open poll limit reached" })
      .getByRole("link", { name: "Go to polls" })
      .click();
    await expect(page).toHaveURL(/\/polls/);
    // Any dialog, titled or not: an empty shell has no accessible name.
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  test("is shown the limit when reopening from the poll page", async () => {
    const closedId = `limit-${runId}-${userId}-closed-ui`;
    await prisma.poll.create({
      data: {
        id: closedId,
        title: "Closed poll",
        userId,
        spaceId,
        status: "closed",
        closedReason: "manual",
      },
    });

    await page.goto(`/poll/${closedId}`);
    await page.getByRole("button", { name: "Manage" }).click();
    await page.getByRole("menuitem", { name: "Reopen poll" }).click();
    await expect(
      page.getByRole("dialog", { name: "Open poll limit reached" }),
    ).toBeVisible();
  });

  test("has no limit on Pro", async () => {
    await upgradeSpaceToPro({ spaceId, userId, seats: 1 });
    expect((await makePoll(page)).ok).toBe(true);
    expect(await countOpen(userId)).toBe(4);
  });
});

test("a guest is limited to one poll and keeps every poll on sign in", async ({
  page,
}) => {
  const { user, space } = await createFreeUser(`adopter-${runId}`);
  await seedOpenPolls({ userId: user.id, spaceId: space.id, count: 3 });

  const newPollPage = new NewPollPage(page);
  await newPollPage.goto();
  const pollPage = await newPollPage.create({ name: "Guest poll" });
  await pollPage.closeShareDialog();
  const guestPollUrl = page.url();

  expect(await makePoll(page)).toMatchObject({
    ok: false,
    error: {
      code: "OPEN_POLL_LIMIT_REACHED",
      usage: { tier: "guest", limit: 1, openCount: 1 },
    },
  });

  await newPollPage.goto();
  const dialog = page.getByRole("dialog", {
    name: "Open poll limit reached",
  });
  await expect(
    dialog.getByRole("progressbar", { name: "Open polls" }),
  ).toHaveAttribute("aria-valuetext", "1 of 1");
  await expect(
    dialog.getByRole("link", { name: "Log in or sign up" }),
  ).toBeVisible();
  await page.screenshot({ path: "test-results/open-poll-limit-guest.png" });
  await expect(dialog.getByRole("link", { name: "Go to polls" })).toHaveCount(
    0,
  );
  await page.goto(guestPollUrl);
  await expect(page.getByRole("heading", { name: "Guest poll" })).toBeVisible();

  await page.getByRole("link", { name: "Login" }).click();
  await new LoginPage(page).login({ email: user.email });
  await expect(page.getByRole("heading", { name: "Guest poll" })).toBeVisible();

  // Adoption is never blocked, so the organizer ends up over the limit.
  expect(
    await prisma.poll.count({
      where: {
        userId: user.id,
        spaceId: space.id,
        status: "open",
        deleted: false,
      },
    }),
  ).toBe(4);

  await new NewPollPage(page).goto();
  await expect(
    page
      .getByRole("dialog", { name: "Open poll limit reached" })
      .getByRole("progressbar", { name: "Open polls" }),
  ).toHaveAttribute("aria-valuetext", "4 of 3");
  await page.screenshot({ path: "test-results/open-poll-limit-over.png" });
});
