import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";
import { prisma } from "@rallly/database";
import { fromNow } from "./test-utils";

// An option that has ended can no longer be voted on. The first tests pin
// the controls on both participant pages; the last one pins the server-side
// rule behind them, for a page that was opened while the option was open.

const createPoll = (id: string, startTimes: Date[]) =>
  prisma.poll.create({
    data: {
      id,
      title: "Past options",
      kind: "time",
      timeZone: "Europe/Paris",
      options: {
        create: startTimes.map((startTime) => ({ startTime, duration: 60 })),
      },
    },
  });

const voteSelectors = (page: Page) => page.getByTestId("vote-selector");

// The selector's accessible name carries the option's date, so this proves
// the one left is the open option and not the past one.
const expectOnlySelectorFor = async (page: Page, date: Date) => {
  await expect(voteSelectors(page)).toHaveCount(1);
  await expect(voteSelectors(page)).toHaveAccessibleName(
    new RegExp(`\\b${date.getUTCDate()}\\b`),
  );
};

test.describe("past options", () => {
  const pollIds: string[] = [];

  const newPollId = () => {
    const id = crypto.randomUUID();
    pollIds.push(id);
    return id;
  };

  // Polls left open with only past options would be closed by the
  // house-keeping tests, which count what they close.
  test.afterAll(async () => {
    await prisma.poll.deleteMany({ where: { id: { in: pollIds } } });
  });

  test("the voting grid only offers the options still open", async ({
    page,
  }) => {
    const id = newPollId();
    const open = fromNow({ days: 1 });
    await createPoll(id, [fromNow({ days: -1 }), open]);

    await page.goto(`/invite/${id}`);
    await expectOnlySelectorFor(page, open);
  });

  test("the vote page only offers the options still open", async ({ page }) => {
    const id = newPollId();
    const open = fromNow({ days: 1 });
    await createPoll(id, [fromNow({ days: -1 }), open]);

    await page.goto(`/invite/${id}/vote`);
    await expectOnlySelectorFor(page, open);
  });

  for (const path of ["", "/vote"]) {
    test(`a poll with only past options takes no response at ${path || "/"}`, async ({
      page,
    }) => {
      const id = newPollId();
      await createPoll(id, [fromNow({ days: -1 })]);

      await page.goto(`/invite/${id}${path}`);
      await expect(page.getByText("All the options are over")).toBeVisible();
      await expect(voteSelectors(page)).toHaveCount(0);
      await expect(page.getByRole("button", { name: "Continue" })).toHaveCount(
        0,
      );
    });
  }

  for (const path of ["", "/vote"]) {
    test(`a new response stops when the last option ends at ${path || "/"}`, async ({
      page,
    }) => {
      const id = newPollId();
      await createPoll(id, [fromNow({ minutes: -30 })]);

      await page.clock.install();
      await page.goto(`/invite/${id}${path}`);
      await expect(voteSelectors(page)).toHaveCount(1);

      await page.clock.fastForward("31:00");
      await expect(page.getByText("All the options are over")).toBeVisible();
      await expect(page.getByRole("button", { name: "Continue" })).toHaveCount(
        0,
      );
    });
  }

  test("a vote on an option that ended after the page loaded is refused", async ({
    page,
  }) => {
    const id = newPollId();
    const poll = await createPoll(id, [
      fromNow({ days: 1 }),
      fromNow({ days: 2 }),
    ]);

    await page.goto(`/invite/${id}`);
    await voteSelectors(page).first().click();

    const [first] = await prisma.option.findMany({
      where: { pollId: poll.id },
      orderBy: { startTime: "asc" },
    });
    await prisma.option.update({
      where: { id: first.id },
      data: { startTime: fromNow({ days: -1 }) },
    });

    await page.getByRole("button", { name: "Continue" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Name").fill("Anne");
    await dialog.locator('button[type="submit"]').click();

    await expect(
      dialog.getByText("One of the options is already over."),
    ).toBeVisible();
    await expect
      .poll(() => prisma.participant.count({ where: { pollId: id } }))
      .toBe(0);
  });
});
