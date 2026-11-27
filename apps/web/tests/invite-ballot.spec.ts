import { randomUUID } from "node:crypto";
import type { Browser, Page } from "@playwright/test";
import { expect, test } from "@playwright/test";
import { prisma } from "@rallly/database";
import { createUserInDb, loginWithEmail } from "./test-utils";

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
  await expect(
    page.getByRole("heading", {
      name: `Thanks, ${name}`,
    }),
  ).toBeVisible();
}

/** The status bar saying so, not the announcement of it. */
function changesSaved(page: Page) {
  return page.locator("p").filter({ hasText: "Changes saved" });
}

function responseBar(page: Page) {
  return page.getByRole("region", { name: "Status" });
}

async function freshPage(browser: Browser) {
  const context = await browser.newContext();
  return { context, page: await context.newPage() };
}

async function seedComment({
  pollId,
  authorName,
  content,
  userId,
}: {
  pollId: string;
  authorName: string;
  content: string;
  userId?: string;
}) {
  await prisma.comment.create({
    data: { pollId, authorName, content, userId },
  });
}

async function openComments(page: Page) {
  await page.getByRole("button", { name: /^(\d+ )?Comments?$/ }).click();
  return page.getByRole("dialog", { name: "Comments" });
}

/** A host who owns the poll and can manage it. */
async function seedHostedPoll({
  id,
  email,
  ...options
}: Parameters<typeof seedPoll>[0] & { email: string }) {
  await prisma.user.deleteMany({ where: { email } });
  const host = await createUserInDb({ email, name: "Ballot Host" });
  const space = await prisma.space.findFirstOrThrow({
    where: { ownerId: host.id },
  });
  await seedPoll({ id, ...options });
  await prisma.poll.update({
    where: { id },
    data: { userId: host.id, spaceId: space.id },
  });
  return { host, space };
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
    await first.page.goto("/invite/ballot-spec-token");
    await addParticipant(first.page, "Token Owner");
    await first.context.close();

    const participant = await prisma.participant.findFirstOrThrow({
      where: { pollId: "ballot-spec-token", name: "Token Owner" },
    });

    const { context, page } = await freshPage(browser);
    await page.goto(`/invite/ballot-spec-token?token=${participant.token}`);
    await expect(responseBar(page)).toContainText(
      "You responded as Token Owner",
    );

    // Nothing to save until an answer changes.
    const save = page.getByRole("button", { name: "Save changes" });
    await expect(options(page).nth(1)).toBeVisible();
    await expect(save).toHaveCount(0);

    const option = options(page).nth(1);
    await expect(radio(option, "No")).toBeChecked();
    await answer(option, "Yes");
    await expect(radio(option, "Yes")).toBeChecked();
    await save.click();
    await expect(changesSaved(page)).toBeVisible();
    await expect(save).toHaveCount(0);

    await page.reload();
    await expect(radio(options(page).nth(1), "Yes")).toBeChecked();
    // The notice is for the moment of saving, not for a later visit.
    await expect(changesSaved(page)).toHaveCount(0);
    await context.close();
  });

  test("discarding changes restores the saved answers and counts", async ({
    browser,
  }) => {
    await seedPoll({ id: "ballot-spec-cancel" });
    const { context, page } = await freshPage(browser);
    await page.goto("/invite/ballot-spec-cancel");
    await addParticipant(page, "Canceller");
    await page.reload();

    const tally = options(page).nth(1).getByTestId("ballot-tally");
    await expect(tally).toContainText("0 available");
    await answer(options(page).nth(1), "Yes");
    await expect(tally).toContainText("1 available");

    const discard = page.getByRole("button", { name: "Discard" });
    await discard.click();
    await expect(discard).toHaveCount(0);
    await expect(radio(options(page).nth(1), "No")).toBeChecked();
    await expect(
      options(page).nth(1).getByTestId("ballot-tally"),
    ).toContainText("0 available");
    await context.close();
  });

  test("rename and delete from the response menu", async ({ browser }) => {
    await seedPoll({ id: "ballot-spec-manage" });
    const { context, page } = await freshPage(browser);
    await page.goto("/invite/ballot-spec-manage");
    await addParticipant(page, "Before");
    await page.reload();

    await page.getByRole("button", { name: "More options" }).click();
    await page.getByRole("menuitem", { name: "Change name" }).click();
    const rename = page.getByRole("dialog", { name: "Change name" });
    await rename.getByLabel("Name").fill("Renamed");
    await rename.getByRole("button", { name: "Save" }).click();
    await expect(responseBar(page)).toContainText("You responded as Renamed");

    await page.getByRole("button", { name: "More options" }).click();
    await page.getByRole("menuitem", { name: "Delete response" }).click();
    await page
      .getByRole("dialog", { name: "Delete your answers?" })
      .getByRole("button", { name: "Delete" })
      .click();
    await expect(responseBar(page)).toContainText("When can you make it?");
    await expect(page.getByRole("button", { name: "Continue" })).toBeVisible();
    await context.close();
  });

  test("the page itself never scrolls with unsaved changes in the card view", async ({
    browser,
  }) => {
    await seedPoll({ id: "ballot-spec-scroll" });
    const context = await browser.newContext({
      viewport: { width: 1440, height: 560 },
    });
    const page = await context.newPage();
    await page.goto("/invite/ballot-spec-scroll");
    await addParticipant(page, "Scroller");
    await page.reload();
    await answer(options(page).nth(1), "Yes");
    await expect(
      page.getByRole("button", { name: "Save changes" }),
    ).toBeVisible();

    const overflow = await page.evaluate(
      () => document.documentElement.scrollHeight - window.innerHeight,
    );
    expect(overflow).toBe(0);
    await context.close();
  });

  test("shortcuts are only for a first response", async ({ browser }) => {
    await seedPoll({ id: "ballot-spec-shortcut" });
    const { context, page } = await freshPage(browser);
    await page.goto("/invite/ballot-spec-shortcut");
    const yesToAll = page.getByRole("button", { name: "Yes to all" });
    await expect(yesToAll).toBeVisible();

    await addParticipant(page, "Shortcutter");
    await page.reload();
    await expect(options(page).first()).toBeVisible();
    await expect(yesToAll).toHaveCount(0);
    await context.close();
  });

  test("the thanks gives way to the saved response", async ({ browser }) => {
    await seedPoll({ id: "ballot-spec-thanks" });
    const { context, page } = await freshPage(browser);
    await page.goto("/invite/ballot-spec-thanks");
    await addParticipant(page, "Thanked");
    // The thanks stands in for the form and the bar until it is left.
    await expect(responseBar(page)).toHaveCount(0);

    await page.getByRole("button", { name: "View or change response" }).click();
    await expect(responseBar(page)).toContainText("You responded as Thanked");
    await expect(radio(options(page).nth(0), "Yes")).toBeChecked();
    await context.close();
  });

  test("hide participants still shows counts", async ({ browser }) => {
    await seedPoll({ id: "ballot-spec-hidden", hideParticipants: true });
    const { context, page } = await freshPage(browser);
    await page.goto("/invite/ballot-spec-hidden");

    await expect(page.getByTestId("ballot-tally").first()).toContainText(
      "1 available",
    );
    await expect(page.getByText("Other Person")).toHaveCount(0);
    await context.close();
  });

  test("past times are hidden until asked for", async ({ browser }) => {
    await seedPoll({ id: "ballot-spec-past", withPastOption: true });
    const { context, page } = await freshPage(browser);
    await page.goto("/invite/ballot-spec-past");

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
    await page.goto("/invite/ballot-spec-all-past");

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
    await page.goto("/invite/ballot-spec-closed");

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
    await page.goto("/invite/ballot-spec-row");

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
    await page.goto("/invite/ballot-spec-keyboard");

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
    await page.goto("/invite/ballot-spec-no-tentative");

    await expect(options(page).first().getByRole("radio")).toHaveCount(2);
    await context.close();
  });

  test("the sticky actions never cover what has focus", async ({ browser }) => {
    await seedPoll({ id: "ballot-spec-focus" });
    const context = await browser.newContext({
      viewport: { width: 390, height: 560 },
    });
    const page = await context.newPage();
    await page.goto("/invite/ballot-spec-focus");
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
    await page.goto("/invite/ballot-spec-toggle");

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

  test("a signed-in viewer's name and email are already filled in", async ({
    browser,
  }) => {
    const email = "ballot-spec-member@example.com";
    await prisma.user.deleteMany({ where: { email } });
    await createUserInDb({ email, name: "Ballot Member" });
    await seedPoll({ id: "ballot-spec-prefill" });

    const guest = await freshPage(browser);
    await guest.page.goto("/invite/ballot-spec-prefill");
    await answer(options(guest.page).nth(0), "Yes");
    await guest.page.getByRole("button", { name: "Continue" }).click();
    await expect(guest.page.getByLabel("Name")).toHaveValue("");
    await expect(
      guest.page.getByRole("textbox", { name: "Email" }),
    ).toHaveValue("");
    await guest.context.close();

    const member = await freshPage(browser);
    await loginWithEmail(member.page, { email });
    await member.page.goto("/invite/ballot-spec-prefill");
    await answer(options(member.page).nth(0), "Yes");
    await member.page.getByRole("button", { name: "Continue" }).click();
    await expect(member.page.getByLabel("Name")).toHaveValue("Ballot Member");
    await expect(
      member.page.getByRole("textbox", { name: "Email" }),
    ).toHaveValue(email);
    await member.page.getByRole("button", { name: "Confirm" }).click();
    await expect(
      member.page.getByRole("heading", { name: "Thanks, Ballot Member" }),
    ).toBeVisible();
    await member.context.close();
    await prisma.user.deleteMany({ where: { email } });
  });

  test("hide scores hides counts until responding", async ({ browser }) => {
    await seedPoll({ id: "ballot-spec-scores", hideScores: true });
    const { context, page } = await freshPage(browser);
    await page.goto("/invite/ballot-spec-scores");

    await expect(options(page).first()).toBeVisible();
    await expect(page.getByTestId("ballot-tally")).toHaveCount(0);

    await addParticipant(page, "Scorer");
    await page.reload();
    await expect(page.getByTestId("ballot-tally").first()).toBeVisible();
    await context.close();
  });

  test("only someone who can manage the poll gets a link to manage it", async ({
    browser,
  }) => {
    const email = "ballot-spec-host@example.com";
    await prisma.user.deleteMany({ where: { email } });
    const host = await createUserInDb({ email, name: "Ballot Host" });
    const space = await prisma.space.findFirstOrThrow({
      where: { ownerId: host.id },
    });
    await seedPoll({ id: "ballot-spec-manage" });
    await prisma.poll.update({
      where: { id: "ballot-spec-manage" },
      data: { userId: host.id, spaceId: space.id },
    });

    const participant = await freshPage(browser);
    await participant.page.goto("/invite/ballot-spec-manage");
    await expect(options(participant.page).first()).toBeVisible();
    await expect(
      participant.page.getByRole("link", { name: "Manage poll" }),
    ).toHaveCount(0);
    await participant.context.close();

    const creator = await freshPage(browser);
    await loginWithEmail(creator.page, { email });
    await creator.page.goto("/invite/ballot-spec-manage");
    const manage = creator.page.getByRole("link", { name: "Manage poll" });
    await expect(manage).toHaveAttribute("href", "/poll/ballot-spec-manage");
    await manage.click();
    await expect(creator.page).toHaveURL(/\/poll\/ballot-spec-manage$/);
    await creator.context.close();
    await prisma.user.deleteMany({ where: { email } });
  });

  test("an invite open is recorded on interaction, not on load", async ({
    browser,
  }) => {
    await seedPoll({ id: "ballot-spec-open" });
    const token = randomUUID().replace(/-/g, "");
    const invite = await prisma.pollInvite.create({
      data: {
        pollId: "ballot-spec-open",
        email: "ballot-spec-open@example.com",
        token,
      },
    });
    const openedAt = async () => {
      const row = await prisma.pollInvite.findUniqueOrThrow({
        where: { id: invite.id },
        select: { openedAt: true },
      });
      return row.openedAt;
    };
    const { context, page } = await freshPage(browser);
    // A mail scanner loads the page and runs its scripts without touching it.
    await page.goto(`/invite/ballot-spec-open?token=${token}`);
    await page.waitForLoadState("networkidle");
    expect(await openedAt()).toBeNull();

    await expect(async () => {
      await page.keyboard.press("Tab");
      expect(await openedAt()).not.toBeNull();
    }).toPass();
    await context.close();
  });

  test("a scheduled poll can be added to a calendar", async ({ browser }) => {
    const email = "ballot-spec-scheduled@example.com";
    const eventId = "ballot-spec-scheduled-event";
    await prisma.scheduledEvent.deleteMany({ where: { id: eventId } });
    await prisma.user.deleteMany({ where: { email } });
    const host = await createUserInDb({ email, name: "Ballot Host" });
    const space = await prisma.space.findFirstOrThrow({
      where: { ownerId: host.id },
    });
    await seedPoll({ id: "ballot-spec-scheduled" });
    const option = await prisma.option.findUniqueOrThrow({
      where: { id: "ballot-spec-scheduled-o0" },
    });
    await prisma.scheduledEvent.create({
      data: {
        id: eventId,
        uid: `${eventId}@rallly.co`,
        userId: host.id,
        spaceId: space.id,
        title: "Ballot ballot-spec-scheduled",
        timeZone: "UTC",
        start: option.startTime,
        end: new Date(option.startTime.getTime() + 60 * 60 * 1000),
      },
    });
    await prisma.poll.update({
      where: { id: "ballot-spec-scheduled" },
      data: {
        userId: host.id,
        spaceId: space.id,
        status: "scheduled",
        scheduledEventId: eventId,
      },
    });

    const { context, page } = await freshPage(browser);
    await page.goto("/invite/ballot-spec-scheduled");

    await page.getByRole("button", { name: "Add to calendar" }).click();
    await expect(
      page.getByRole("menuitem", { name: "Google Calendar" }),
    ).toHaveAttribute("href", `/api/event/${eventId}/google-calendar`);
    await context.close();
    await prisma.user.deleteMany({ where: { email } });
  });

  test("a shared link has a preview card", async ({ browser }) => {
    await seedPoll({ id: "ballot-spec-preview" });
    const { context, page } = await freshPage(browser);
    await page.goto("/invite/ballot-spec-preview");

    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
      "content",
      "Ballot ballot-spec-preview",
    );
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      "content",
      /\/api\/og-image-poll\?/,
    );
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
      "content",
      /\/invite\/ballot-spec-preview$/,
    );
    await context.close();
  });

  test("a guest with no session can comment and sees it as theirs", async ({
    browser,
  }) => {
    await seedPoll({ id: "ballot-spec-comment" });
    await seedComment({
      pollId: "ballot-spec-comment",
      authorName: "Other Person",
      content: "Mornings suit me",
    });
    const { context, page } = await freshPage(browser);
    await page.goto("/invite/ballot-spec-comment");

    const sheet = await openComments(page);
    await sheet.getByRole("textbox", { name: "Your name" }).fill("Guest");
    await sheet
      .getByRole("textbox", { name: "Write a comment…" })
      .fill("Afternoons for me");
    await sheet.getByRole("button", { name: "Add comment" }).click();
    await expect(sheet.getByText("Your comment has been added")).toBeVisible();

    const own = sheet
      .getByTestId("comment")
      .filter({ hasText: "Afternoons for me" });
    await expect(own).toContainText("Guest");
    await expect(own).toContainText("You");
    await expect(
      own.getByRole("button", { name: "Delete comment by Guest" }),
    ).toBeVisible();
    const other = sheet
      .getByTestId("comment")
      .filter({ hasText: "Mornings suit me" });
    await expect(other).not.toContainText("You");
    await expect(other.getByRole("button")).toHaveCount(0);

    // Their own, newest first, and still theirs after a reload.
    await page.reload();
    const reopened = await openComments(page);
    await expect(reopened.getByTestId("comment").first()).toContainText(
      "Afternoons for me",
    );
    await reopened
      .getByRole("button", { name: "Delete comment by Guest" })
      .click();
    await expect(
      reopened.getByTestId("comment").filter({ hasText: "Afternoons for me" }),
    ).toHaveCount(0);
    await expect(reopened.getByTestId("comment")).toHaveCount(1);
    expect(
      await prisma.comment.count({ where: { pollId: "ballot-spec-comment" } }),
    ).toBe(1);
    await context.close();
  });

  test("a poll that hides participants shows a viewer only their own comments", async ({
    browser,
  }) => {
    await seedPoll({
      id: "ballot-spec-comment-hidden",
      hideParticipants: true,
    });
    await seedComment({
      pollId: "ballot-spec-comment-hidden",
      authorName: "Other Person",
      content: "Someone else's comment",
    });
    const { context, page } = await freshPage(browser);
    await page.goto("/invite/ballot-spec-comment-hidden");

    const sheet = await openComments(page);
    await expect(sheet.getByText("No comments yet")).toBeVisible();
    await sheet.getByRole("textbox", { name: "Your name" }).fill("Private");
    await sheet
      .getByRole("textbox", { name: "Write a comment…" })
      .fill("My own comment");
    await sheet.getByRole("button", { name: "Add comment" }).click();

    await expect(sheet.getByTestId("comment")).toHaveCount(1);
    await expect(sheet.getByTestId("comment")).toContainText("My own comment");
    await expect(sheet.getByText("Someone else's comment")).toHaveCount(0);
    await context.close();
  });

  test("comments turned off leave no comments button", async ({ browser }) => {
    await seedPoll({ id: "ballot-spec-no-comments", disableComments: true });
    const { context, page } = await freshPage(browser);
    await page.goto("/invite/ballot-spec-no-comments");

    await expect(options(page).first()).toBeVisible();
    await expect(
      page.getByRole("button", { name: /^(\d+ )?Comments?$/ }),
    ).toHaveCount(0);
    await context.close();
  });

  test("a scheduled poll's comments are readable but closed", async ({
    browser,
  }) => {
    const email = "ballot-spec-comment-scheduled@example.com";
    const eventId = "ballot-spec-comment-scheduled-event";
    await prisma.scheduledEvent.deleteMany({ where: { id: eventId } });
    const { host, space } = await seedHostedPoll({
      id: "ballot-spec-comment-scheduled",
      email,
    });
    const option = await prisma.option.findUniqueOrThrow({
      where: { id: "ballot-spec-comment-scheduled-o0" },
    });
    await prisma.scheduledEvent.create({
      data: {
        id: eventId,
        uid: `${eventId}@rallly.co`,
        userId: host.id,
        spaceId: space.id,
        title: "Ballot ballot-spec-comment-scheduled",
        timeZone: "UTC",
        start: option.startTime,
        end: new Date(option.startTime.getTime() + 60 * 60 * 1000),
      },
    });
    await prisma.poll.update({
      where: { id: "ballot-spec-comment-scheduled" },
      data: { status: "scheduled", scheduledEventId: eventId },
    });
    await seedComment({
      pollId: "ballot-spec-comment-scheduled",
      authorName: "Other Person",
      content: "See you there",
    });

    const { context, page } = await freshPage(browser);
    await page.goto("/invite/ballot-spec-comment-scheduled");

    const sheet = await openComments(page);
    await expect(sheet.getByTestId("comment")).toContainText("See you there");
    await expect(sheet.getByRole("textbox")).toHaveCount(0);
    await expect(
      sheet.getByRole("button", { name: "Add comment" }),
    ).toHaveCount(0);
    await context.close();
    await prisma.user.deleteMany({ where: { email } });
  });

  test("a poll manager can delete anyone's comment", async ({ browser }) => {
    const email = "ballot-spec-comment-host@example.com";
    await seedHostedPoll({ id: "ballot-spec-comment-manage", email });
    await seedComment({
      pollId: "ballot-spec-comment-manage",
      authorName: "Other Person",
      content: "Spam to remove",
    });

    const visitor = await freshPage(browser);
    await visitor.page.goto("/invite/ballot-spec-comment-manage");
    const visitorSheet = await openComments(visitor.page);
    await expect(visitorSheet.getByTestId("comment")).toContainText(
      "Spam to remove",
    );
    await expect(
      visitorSheet.getByRole("button", {
        name: "Delete comment by Other Person",
      }),
    ).toHaveCount(0);
    await visitor.context.close();

    const manager = await freshPage(browser);
    await loginWithEmail(manager.page, { email });
    await manager.page.goto("/invite/ballot-spec-comment-manage");
    const sheet = await openComments(manager.page);
    await sheet
      .getByRole("button", { name: "Delete comment by Other Person" })
      .click();
    await expect(sheet.getByTestId("comment")).toHaveCount(0);
    expect(
      await prisma.comment.count({
        where: { pollId: "ballot-spec-comment-manage" },
      }),
    ).toBe(0);
    await manager.context.close();
    await prisma.user.deleteMany({ where: { email } });
  });

  test("picking a time zone shows the times in it", async ({ browser }) => {
    await seedPoll({ id: "ballot-spec-time-zone" });
    const context = await browser.newContext({ timezoneId: "UTC" });
    const page = await context.newPage();
    await page.goto("/invite/ballot-spec-time-zone");

    const first = options(page).first();
    // Seeded at 09:00 UTC.
    await expect(first).toHaveAccessibleName(/9:00|09:00/);

    await page.getByRole("button", { name: /Change time zone$/ }).click();
    const picker = page.getByRole("dialog", { name: "Time zone" });
    await picker.getByPlaceholder("Search time zone…").fill("Tokyo");
    await picker.getByRole("option", { name: /^Tokyo/ }).click();
    await expect(picker).toBeHidden();

    await expect(
      page.getByRole("button", { name: "Tokyo time. Change time zone" }),
    ).toBeVisible();
    // 09:00 UTC is 18:00 in Tokyo.
    await expect(first).toHaveAccessibleName(/18:00|6:00\sPM/);
    await context.close();
  });
});
