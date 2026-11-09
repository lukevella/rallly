import { randomUUID } from "node:crypto";
import type { Browser, Page } from "@playwright/test";
import { expect, test } from "@playwright/test";
import { prisma } from "@rallly/database";

const DAY = 24 * 60 * 60 * 1000;

/**
 * A time poll with two slots on one day and one on the next, all in the
 * future, plus one existing response from "Other Person" who said yes to
 * the first slot.
 */
async function seedPoll({
  id,
  hideParticipants = false,
  hideScores = false,
  withPastOption = false,
  description,
  disableComments = false,
  allowTentativeVotes = true,
}: {
  id: string;
  hideParticipants?: boolean;
  hideScores?: boolean;
  /** Adds a fourth option two days ago. */
  withPastOption?: boolean;
  description?: string;
  disableComments?: boolean;
  allowTentativeVotes?: boolean;
}) {
  await prisma.poll.deleteMany({ where: { id } });
  const base = new Date(Date.now() + 10 * DAY);
  base.setUTCHours(9, 0, 0, 0);
  const starts = [0, 2 * 60 * 60 * 1000, DAY].map(
    (offset) => new Date(base.getTime() + offset),
  );
  if (withPastOption) {
    starts.push(new Date(Date.now() - 2 * DAY));
  }
  await prisma.poll.create({
    data: {
      id,
      title: `Ballot ${id}`,
      kind: "time",
      timeZone: "UTC",
      description,
      disableComments,
      allowTentativeVotes,
      hideParticipants,
      hideScores,
      options: {
        create: starts.map((startTime, i) => ({
          id: `${id}-o${i}`,
          startTime,
          duration: 60,
        })),
      },
    },
  });
  await prisma.participant.create({
    data: {
      id: `${id}-other`,
      pollId: id,
      name: "Other Person",
      token: randomUUID().replace(/-/g, ""),
      votes: {
        create: [
          { pollId: id, optionId: `${id}-o0`, type: "yes" },
          { pollId: id, optionId: `${id}-o1`, type: "no" },
          { pollId: id, optionId: `${id}-o2`, type: "no" },
        ],
      },
    },
  });
}

/** Each option is a group of radios named by its date and time. */
function options(page: Page) {
  return page.getByRole("main").locator("fieldset:has(input[type=radio])");
}

/** With a mouse the radios shrink away, so answer the way a keyboard does. */
async function answer(option: ReturnType<typeof options>, name: string) {
  await option.getByRole("radio", { name, exact: true }).focus();
  await option.page().keyboard.press("Space");
}

function radio(option: ReturnType<typeof options>, name: string) {
  return option.getByRole("radio", { name, exact: true });
}

async function addParticipant(page: Page, name: string) {
  await answer(options(page).nth(0), "Yes");
  await answer(options(page).nth(2), "Yes");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByLabel("Name").fill(name);
  await page.getByRole("button", { name: "Confirm" }).click();
  await expect(page.getByText(`Thanks, ${name}`)).toBeVisible();
}

function responseBar(page: Page) {
  return page.getByRole("region", { name: "Response" });
}

async function freshPage(browser: Browser) {
  const context = await browser.newContext();
  return { context, page: await context.newPage() };
}

test.describe("invite ballot", () => {
  test.afterAll(async () => {
    await prisma.poll.deleteMany({
      where: { id: { startsWith: "ballot-spec-" } },
    });
  });

  test("link token owner can change votes in a fresh browser", async ({
    browser,
  }) => {
    await seedPoll({ id: "ballot-spec-token" });
    const first = await freshPage(browser);
    await first.page.goto("/invite/ballot-spec-token/vote");
    await addParticipant(first.page, "Token Owner");
    await first.context.close();

    const participant = await prisma.participant.findFirstOrThrow({
      where: { pollId: "ballot-spec-token", name: "Token Owner" },
    });

    const { context, page } = await freshPage(browser);
    await page.goto(
      `/invite/ballot-spec-token/vote?token=${participant.token}`,
    );
    await expect(responseBar(page)).toContainText("Token Owner");

    await page.getByRole("button", { name: "Edit response" }).click();
    const option = options(page).nth(1);
    await expect(radio(option, "No")).toBeChecked();
    await answer(option, "Yes");
    await expect(radio(option, "Yes")).toBeChecked();
    await page.getByRole("button", { name: "Save changes" }).first().click();
    await expect(
      page.getByRole("button", { name: "Edit response" }),
    ).toBeVisible();

    await page.reload();
    await page.getByRole("button", { name: "Edit response" }).click();
    await expect(radio(options(page).nth(1), "Yes")).toBeChecked();
    await context.close();
  });

  test("cancelling an edit restores the saved answers and counts", async ({
    browser,
  }) => {
    await seedPoll({ id: "ballot-spec-cancel" });
    const { context, page } = await freshPage(browser);
    await page.goto("/invite/ballot-spec-cancel/vote");
    await addParticipant(page, "Canceller");
    await page.reload();

    await page.getByRole("button", { name: "Edit response" }).click();
    const tally = options(page).nth(1).getByTestId("ballot-tally");
    await expect(tally).toContainText("0");
    await answer(options(page).nth(1), "Yes");
    await expect(tally).toContainText("1");

    await responseBar(page).getByRole("button", { name: "Cancel" }).click();
    await page.getByRole("button", { name: "Edit response" }).click();
    await expect(radio(options(page).nth(1), "No")).toBeChecked();
    await expect(
      options(page).nth(1).getByTestId("ballot-tally"),
    ).toContainText("0");
    await context.close();
  });

  test("rename and delete from the response menu", async ({ browser }) => {
    await seedPoll({ id: "ballot-spec-manage" });
    const { context, page } = await freshPage(browser);
    await page.goto("/invite/ballot-spec-manage/vote");
    await addParticipant(page, "Before");
    await page.reload();

    await page.getByRole("button", { name: "More options" }).click();
    await page.getByRole("menuitem", { name: "Change name" }).click();
    const rename = page.getByRole("dialog", { name: "Change name" });
    await rename.getByLabel("Name").fill("Renamed");
    await rename.getByRole("button", { name: "Save" }).click();
    await expect(responseBar(page)).toContainText("Renamed");

    await page.getByRole("button", { name: "More options" }).click();
    await page.getByRole("menuitem", { name: "Delete response" }).click();
    await page
      .getByRole("dialog", { name: "Delete your answers?" })
      .getByRole("button", { name: "Delete" })
      .click();
    await expect(responseBar(page)).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Continue" })).toBeVisible();
    await context.close();
  });

  test("the page itself never scrolls while editing in the card view", async ({
    browser,
  }) => {
    await seedPoll({ id: "ballot-spec-scroll" });
    const context = await browser.newContext({
      viewport: { width: 1440, height: 560 },
    });
    const page = await context.newPage();
    await page.goto("/invite/ballot-spec-scroll/vote");
    await addParticipant(page, "Scroller");
    await page.reload();
    await page.getByRole("button", { name: "Edit response" }).click();
    await expect(
      responseBar(page).getByRole("button", { name: "Cancel" }),
    ).toBeVisible();

    const overflow = await page.evaluate(
      () => document.documentElement.scrollHeight - window.innerHeight,
    );
    expect(overflow).toBe(0);
    await context.close();
  });

  test("hide participants still shows counts", async ({ browser }) => {
    await seedPoll({ id: "ballot-spec-hidden", hideParticipants: true });
    const { context, page } = await freshPage(browser);
    await page.goto("/invite/ballot-spec-hidden/vote");

    await expect(page.getByTestId("ballot-tally").first()).toContainText("1");
    await expect(page.getByText("Other Person")).toHaveCount(0);
    await context.close();
  });

  test("past times are hidden until asked for", async ({ browser }) => {
    await seedPoll({ id: "ballot-spec-past", withPastOption: true });
    const { context, page } = await freshPage(browser);
    await page.goto("/invite/ballot-spec-past/vote");

    await expect(options(page)).toHaveCount(3);

    await page.getByRole("button", { name: "Show 1 past time" }).click();
    await expect(options(page)).toHaveCount(4);
    // The past option sorts first and cannot be voted on.
    await expect(
      options(page).first().getByRole("radio").first(),
    ).toBeDisabled();

    await page.getByRole("button", { name: "Show 1 past time" }).click();
    await expect(options(page)).toHaveCount(3);
    await context.close();
  });

  test("says so when every time has passed", async ({ browser }) => {
    await seedPoll({ id: "ballot-spec-all-past", withPastOption: true });
    await prisma.option.deleteMany({
      where: {
        pollId: "ballot-spec-all-past",
        id: { not: "ballot-spec-all-past-o3" },
      },
    });
    const { context, page } = await freshPage(browser);
    await page.goto("/invite/ballot-spec-all-past/vote");

    await expect(
      page.getByText("All of these times have passed"),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Continue" })).toHaveCount(0);
    await context.close();
  });

  test("results that overflow can be reached from the keyboard", async ({
    browser,
  }) => {
    await seedPoll({ id: "ballot-spec-closed" });
    await prisma.poll.update({
      where: { id: "ballot-spec-closed" },
      data: { status: "closed" },
    });
    const context = await browser.newContext({
      viewport: { width: 1440, height: 380 },
    });
    const page = await context.newPage();
    await page.goto("/invite/ballot-spec-closed/vote");

    const results = page.getByRole("group", { name: "Results" });
    await expect(results).toHaveAttribute("tabindex", "0");
    await results.focus();
    await page.keyboard.press("End");
    await expect
      .poll(() => results.evaluate((element) => element.scrollTop))
      .toBeGreaterThan(0);
    await context.close();
  });

  test("clicking a row cycles its answer", async ({ browser }) => {
    await seedPoll({ id: "ballot-spec-row", allowTentativeVotes: true });
    const { context, page } = await freshPage(browser);
    await page.goto("/invite/ballot-spec-row/vote");

    const option = options(page).first();
    await option.click();
    await expect(radio(option, "Yes")).toBeChecked();
    await option.click();
    await expect(radio(option, "If need be")).toBeChecked();
    await option.click();
    await expect(radio(option, "No")).toBeChecked();
    await option.click();
    await expect(radio(option, "Yes")).toBeChecked();
    await context.close();
  });

  test("answers are a radio group a keyboard can work", async ({ browser }) => {
    await seedPoll({ id: "ballot-spec-keyboard", allowTentativeVotes: true });
    const { context, page } = await freshPage(browser);
    await page.goto("/invite/ballot-spec-keyboard/vote");

    const option = options(page).first();
    await expect(option).toHaveAccessibleName(/\d/);
    await expect(option.getByRole("radio")).toHaveCount(3);

    await answer(option, "Yes");
    await expect(radio(option, "Yes")).toBeChecked();
    await page.keyboard.press("ArrowRight");
    await expect(radio(option, "If need be")).toBeChecked();
    await context.close();
  });

  test("only yes and no when the poll does not allow if need be", async ({
    browser,
  }) => {
    await seedPoll({
      id: "ballot-spec-no-tentative",
      allowTentativeVotes: false,
    });
    const { context, page } = await freshPage(browser);
    await page.goto("/invite/ballot-spec-no-tentative/vote");

    await expect(options(page).first().getByRole("radio")).toHaveCount(2);
    await context.close();
  });

  test("the sticky actions never cover what has focus", async ({ browser }) => {
    await seedPoll({ id: "ballot-spec-focus" });
    const context = await browser.newContext({
      viewport: { width: 390, height: 560 },
    });
    const page = await context.newPage();
    await page.goto("/invite/ballot-spec-focus/vote");
    await page.getByRole("radio").first().waitFor({ state: "attached" });
    await page.getByRole("radio").first().focus();
    for (let stop = 0; stop < 6; stop++) {
      const focused = await page.evaluate(() => {
        const element = document.activeElement;
        if (!(element instanceof HTMLInputElement)) {
          return null;
        }
        const box = element.getBoundingClientRect();
        const hit = document.elementFromPoint(
          box.left + box.width / 2,
          box.top + box.height / 2,
        );
        return { covered: hit !== element };
      });
      if (!focused) {
        break;
      }
      expect(focused.covered).toBe(false);
      await page.keyboard.press("Tab");
    }
    await context.close();
  });

  test("help keeps unsaved answers", async ({ browser }) => {
    await seedPoll({ id: "ballot-spec-toggle" });
    const { context, page } = await freshPage(browser);
    await page.goto("/invite/ballot-spec-toggle/vote");

    const option = options(page).first();
    await answer(option, "Yes");

    await page.getByRole("button", { name: "Help" }).click();
    const help = page.getByRole("dialog", { name: "How to vote" });
    await expect(help).toBeVisible();
    await help.getByRole("button", { name: "Close" }).click();
    await expect(help).toBeHidden();

    await expect(radio(option, "Yes")).toBeChecked();
    await context.close();
  });

  test("hide scores hides counts until responding", async ({ browser }) => {
    await seedPoll({ id: "ballot-spec-scores", hideScores: true });
    const { context, page } = await freshPage(browser);
    await page.goto("/invite/ballot-spec-scores/vote");

    await expect(options(page).first()).toBeVisible();
    await expect(page.getByTestId("ballot-tally")).toHaveCount(0);

    await addParticipant(page, "Scorer");
    await page.reload();
    await expect(page.getByTestId("ballot-tally").first()).toBeVisible();
    await context.close();
  });
});
