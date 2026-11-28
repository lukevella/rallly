import { expect, test } from "@playwright/test";
import { prisma } from "@rallly/database";
import {
  captureOne,
  deleteAllMessages,
  getMessages,
} from "@rallly/test-helpers";
import { createUserInDb, loginWithEmail } from "./test-utils";

/**
 * The new poll page (/polls/[id]) end to end: it recommends the best date and
 * finalizes it, emailing only the recipients left in the To field.
 */

const POLL_ID = "poll-admin-page-poll";
const HOST_EMAIL = "poll-admin-page-host@rallly.co";
const ALICE = "poll-admin-page-alice@example.com";
const BOB = "poll-admin-page-bob@example.com";
const YEAR = new Date().getFullYear() + 1;

async function cleanup() {
  const poll = await prisma.poll.findUnique({
    where: { id: POLL_ID },
    select: { scheduledEventId: true },
  });
  await prisma.poll.deleteMany({ where: { id: POLL_ID } });
  if (poll?.scheduledEventId) {
    await prisma.scheduledEvent.deleteMany({
      where: { id: poll.scheduledEventId },
    });
  }
  await prisma.user.deleteMany({ where: { email: HOST_EMAIL } });
}

test.describe("poll admin page", () => {
  test.beforeEach(async () => {
    await cleanup();
    await deleteAllMessages();
  });

  test.afterAll(async () => {
    await cleanup();
    await deleteAllMessages();
  });

  test("finalizes the best date and notifies only the chosen recipients", async ({
    page,
  }) => {
    const user = await createUserInDb({ email: HOST_EMAIL, name: "Page Host" });
    const space = await prisma.space.findFirstOrThrow({
      where: { ownerId: user.id },
    });
    const poll = await prisma.poll.create({
      data: {
        id: POLL_ID,
        title: "Poll Admin Page Poll",
        userId: user.id,
        spaceId: space.id,
        timeZone: "Europe/London",
        options: {
          create: [
            // Everyone can make both, but only the first has no if need be,
            // so it alone is the best date.
            {
              startTime: new Date(`${YEAR}-09-10T09:00:00.000Z`),
              duration: 60,
            },
            {
              startTime: new Date(`${YEAR}-09-11T09:00:00.000Z`),
              duration: 60,
            },
          ],
        },
      },
      include: { options: { orderBy: { startTime: "asc" } } },
    });
    const [best, other] = poll.options;
    const participants = [
      { name: "Alice", email: ALICE, votes: ["yes", "yes"] },
      { name: "Bob", email: BOB, votes: ["yes", "ifNeedBe"] },
      { name: "Carol", email: null, votes: ["yes", "yes"] },
    ] as const;
    for (const [index, p] of participants.entries()) {
      await prisma.participant.create({
        data: {
          name: p.name,
          email: p.email,
          locale: "en",
          token: `poll-admin-page-token-${index}-${Date.now()}`,
          pollId: poll.id,
          votes: {
            create: [
              { optionId: best.id, pollId: poll.id, type: p.votes[0] },
              { optionId: other.id, pollId: poll.id, type: p.votes[1] },
            ],
          },
        },
      });
    }

    await loginWithEmail(page, { email: HOST_EMAIL });
    await page.goto(`/polls/${poll.id}`);

    // One best date: the card shows it with no tied dates to step through,
    // and the results star only that row (its label and the card heading).
    await expect(page.getByText(/Sep 10/).first()).toBeVisible();
    await expect(page.getByText("Best date", { exact: true })).toHaveCount(2);
    await expect(
      page.getByRole("button", { name: "Next tied date" }),
    ).toHaveCount(0);

    await page
      .getByRole("button", { name: "Pick this date", exact: true })
      .click();
    const dialog = page.getByRole("dialog", { name: "Finalize poll" });
    await expect(dialog).toBeVisible();

    // Everyone with an email starts in the To field; Carol has none.
    const chips = dialog.locator('[data-slot="combobox-chip"]');
    await expect(chips).toHaveText(["Alice", "Bob"]);
    await expect(
      dialog.getByText("1 participant has no email and won't be notified."),
    ).toBeVisible();

    await chips
      .filter({ hasText: "Bob" })
      .getByRole("button", { name: "Remove" })
      .click();
    await expect(chips).toHaveText(["Alice"]);

    // The confirmation step repeats the event and how many get the email.
    await dialog.getByRole("button", { name: "Next" }).click();
    await expect(dialog.getByText("Notify 1 participant")).toBeVisible();

    await dialog
      .getByRole("button", { name: "Finalize and notify 1 participant" })
      .click();
    await expect(dialog.getByText("Date scheduled")).toBeVisible();

    const { email } = await captureOne(ALICE);
    expect(email.Subject).toBe("Date booked for Poll Admin Page Poll");

    const scheduled = await prisma.poll.findUniqueOrThrow({
      where: { id: poll.id },
      select: { status: true, scheduledEventId: true },
    });
    expect(scheduled.status).toBe("scheduled");
    expect(scheduled.scheduledEventId).not.toBeNull();

    const { messages } = await getMessages();
    expect(messages.some((m) => m.To.some((to) => to.Address === BOB))).toBe(
      false,
    );
  });
});
