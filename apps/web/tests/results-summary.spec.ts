import { expect, test } from "@playwright/test";
import { prisma } from "@rallly/database";
import { NewPollPage } from "./new-poll-page";

const RANKED_POLL_ID = "results-summary-ranked";
const HIDDEN_SCORES_POLL_ID = "results-summary-hidden-scores";

type Vote = "yes" | "ifNeedBe" | "no" | null;

/**
 * One row per option, in date order, one column per participant. Ranked:
 * options 1 and 3 tie on three yes, option 2 has three available with one if
 * need be, then option 5 (2), option 0 (1), and options 4 and 6 nobody can
 * attend.
 */
const VOTES: Vote[][] = [
  ["yes", "no", "no"],
  ["yes", "yes", "yes"],
  ["yes", "yes", "ifNeedBe"],
  ["yes", "yes", "yes"],
  ["no", "no", "no"],
  ["ifNeedBe", "ifNeedBe", "no"],
  [null, null, null],
];

async function seedPoll({
  id,
  hideScores,
}: {
  id: string;
  hideScores: boolean;
}) {
  const year = new Date().getUTCFullYear() + 1;
  const poll = await prisma.poll.create({
    data: {
      id,
      title: `Results summary ${id}`,
      kind: "date",
      timeZone: null,
      hideScores,
      options: {
        create: VOTES.map((_, index) => ({
          startTime: new Date(Date.UTC(year, 2, 2 + index)),
          duration: 0,
        })),
      },
    },
    include: { options: { orderBy: { startTime: "asc" } } },
  });

  for (const [participantIndex, name] of ["Ann", "Ben", "Cid"].entries()) {
    await prisma.participant.create({
      data: {
        name,
        pollId: poll.id,
        token: `${id}-${name}`.padEnd(32, "x"),
        votes: {
          create: poll.options.flatMap((option, optionIndex) => {
            const type = VOTES[optionIndex][participantIndex];
            return type ? [{ optionId: option.id, pollId: poll.id, type }] : [];
          }),
        },
      },
    });
  }
}

async function cleanup() {
  await prisma.poll.deleteMany({
    where: { id: { in: [RANKED_POLL_ID, HIDDEN_SCORES_POLL_ID] } },
  });
}

test.describe("results summary", () => {
  test.beforeAll(async () => {
    await cleanup();
    await seedPoll({ id: RANKED_POLL_ID, hideScores: false });
    await seedPoll({ id: HIDDEN_SCORES_POLL_ID, hideScores: true });
  });

  test.afterAll(cleanup);

  test("ranks the best options with shared places for ties", async ({
    page,
  }) => {
    await page.goto(`/invite/${RANKED_POLL_ID}`);

    const summary = page.getByTestId("poll-results-summary");
    await expect(
      summary.getByRole("heading", { name: "Best options" }),
    ).toBeVisible();

    const rows = summary.locator("ol > li");
    await expect(rows).toHaveCount(5);
    await expect(rows.getByTestId("results-summary-place")).toHaveText([
      "1",
      "1",
      "3",
      "4",
      "5",
    ]);
    await expect(rows.getByTestId("results-summary-score")).toHaveText([
      "3/3",
      "3/3",
      "3/3",
      "2/3",
      "1/3",
    ]);
    await expect(rows.first().getByRole("img")).toHaveAccessibleName(
      "3 yes, 0 if need be, 0 no, out of 3 participants",
    );
    await expect(rows.nth(2).getByRole("img")).toHaveAccessibleName(
      "2 yes, 1 if need be, 0 no, out of 3 participants",
    );

    await summary.getByRole("button", { name: "Show all 7 options" }).click();
    await expect(rows).toHaveCount(7);
    await expect(rows.getByTestId("results-summary-place").nth(5)).toHaveText(
      "–",
    );
    await expect(rows.getByTestId("results-summary-score").nth(6)).toHaveText(
      "0/3",
    );

    await summary.getByRole("button", { name: "Show top 5" }).click();
    await expect(rows).toHaveCount(5);
  });

  test("stays hidden until the viewer votes when scores are hidden", async ({
    page,
  }) => {
    await page.goto(`/invite/${HIDDEN_SCORES_POLL_ID}`);

    await expect(page.getByTestId("vote-selector").first()).toBeVisible();
    await expect(page.getByTestId("poll-results-summary")).toHaveCount(0);
  });

  test("shows on the host page once someone responds", async ({ page }) => {
    const newPollPage = new NewPollPage(page);
    await newPollPage.goto();
    const pollPage = await newPollPage.create({ name: "Summary Meetup" });
    await pollPage.closeShareDialog();
    const adminUrl = page.url();

    // Nothing to rank before the first response
    await expect(page.getByTestId("add-participant-button")).toBeVisible();
    await expect(page.getByTestId("poll-results-summary")).toHaveCount(0);

    const invitePage = await pollPage.gotoInvitePage();
    await invitePage.addParticipant("Anne");

    const inviteSummary = page.getByTestId("poll-results-summary");
    await expect(inviteSummary).toBeVisible();
    await expect(
      inviteSummary.getByTestId("results-summary-score").first(),
    ).toHaveText("1/1");

    await page.goto(adminUrl);
    const hostSummary = page.getByTestId("poll-results-summary");
    await expect(hostSummary).toBeVisible();
    await expect(hostSummary.locator("ol > li")).toHaveCount(4);
    await expect(
      hostSummary.getByTestId("results-summary-place").first(),
    ).toHaveText("1");
  });
});
