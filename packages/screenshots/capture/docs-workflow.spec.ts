import type { Locator, Page } from "@playwright/test";
import { expect, test } from "@playwright/test";
import { prisma } from "@rallly/database";
import { deleteAllMessages, loginWithEmail } from "@rallly/test-helpers";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { customAlphabet } from "nanoid";
import { docsImagePath } from "./helpers";

dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * The screenshots in docs/workflow (create, invite, finalize) and
 * docs/administrators/editing-a-meeting-poll.mdx, taken as a Pro organizer
 * walking one poll from creation to a final date.
 */

const timeZone = "America/New_York";
// Shaped like a real invite link id, since the Share dialog shows it.
const pollId = "Kq7xN2pLw9Rt";
const organizer = {
  id: "docs-workflow-user",
  email: "docs-workflow@rallly.co",
  name: "Jessie Smith",
};
const spaceId = "docs-workflow-space";

// Monday of next month's second week, so every slot sits in one month and
// one calendar week.
const base = (() => {
  let date = dayjs()
    .tz(timeZone)
    .add(1, "month")
    .startOf("month")
    .add(7, "day");
  while (date.day() !== 1) {
    date = date.add(1, "day");
  }
  return date;
})();

// Mirrors generateAccessToken in apps/web/src/features/poll/utils.ts, which
// this package cannot import. Participant.token has no DB default.
const generateAccessToken = customAlphabet(
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  32,
);

test.use({
  viewport: { width: 1280, height: 800 },
  deviceScaleFactor: 2,
  timezoneId: timeZone,
});

// Dev routes compile on first hit.
test.describe.configure({ mode: "serial", timeout: 240_000 });

async function deleteOrganizer() {
  // Cascades through the space and its polls.
  await prisma.user.delete({ where: { id: organizer.id } }).catch(() => {});
}

test.beforeAll(async () => {
  await deleteAllMessages();
  await deleteOrganizer();

  await prisma.user.create({
    data: {
      ...organizer,
      emailVerified: true,
      timeZone,
      weekStart: 1,
      spaces: { create: { id: spaceId, name: "Personal", tier: "pro" } },
      memberOf: {
        create: { id: `${spaceId}-member`, spaceId, role: "ADMIN" },
      },
    },
  });

  // Built from a wall clock string: dayjs keeps the original offset across
  // date arithmetic, which is wrong on the other side of a DST change.
  const slot = (day: number) => ({
    startTime: dayjs
      .tz(`${base.add(day, "day").format("YYYY-MM-DD")} 12:00`, timeZone)
      .toDate(),
    duration: 60,
  });

  const participants = [
    { name: "Emma Davis", email: "emma@example.com" },
    { name: "Liam Nguyen", email: "liam@example.com" },
    { name: "Olivia Brown", email: "olivia@example.com" },
  ];

  const poll = await prisma.poll.create({
    data: {
      id: pollId,
      title: "Monthly Meetup",
      description: "Hey everyone, please choose the dates that work for you!",
      location: "Joe's Coffee Shop",
      userId: organizer.id,
      spaceId,
      status: "open",
      timeZone,
      options: { create: [slot(0), slot(1), slot(2), slot(3)] },
      participants: {
        create: participants.map((participant) => ({
          ...participant,
          token: generateAccessToken(),
        })),
      },
    },
    include: {
      options: { orderBy: { startTime: "asc" } },
      participants: true,
    },
  });

  const votes: Record<string, ("yes" | "no" | "ifNeedBe")[]> = {
    "Emma Davis": ["yes", "no", "yes", "yes"],
    "Liam Nguyen": ["ifNeedBe", "yes", "no", "yes"],
    "Olivia Brown": ["yes", "yes", "ifNeedBe", "yes"],
  };

  await prisma.vote.createMany({
    data: poll.participants.flatMap((participant) =>
      poll.options.map((option, i) => ({
        optionId: option.id,
        participantId: participant.id,
        pollId: poll.id,
        type: votes[participant.name]?.[i] ?? "yes",
      })),
    ),
  });

  const emma = poll.participants.find((p) => p.name === "Emma Davis");
  await prisma.pollInvite.createMany({
    data: [
      {
        pollId,
        email: "emma@example.com",
        token: generateAccessToken(),
        openedAt: new Date(),
        participantId: emma?.id,
      },
      {
        pollId,
        email: "michael@example.com",
        token: generateAccessToken(),
        openedAt: new Date(),
      },
      {
        pollId,
        email: "priya@example.com",
        token: generateAccessToken(),
      },
    ],
  });
});

test.afterAll(deleteOrganizer);

async function settle(page: Page) {
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => document.fonts.ready);
  await page.mouse.move(0, 0);
}

// Invite links read as production rather than the dev server.
async function showProductionUrls(page: Page) {
  await page.evaluate((origin) => {
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
    );
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (node.nodeValue?.includes(origin)) {
        node.nodeValue = node.nodeValue.replaceAll(
          origin,
          "https://app.rallly.co",
        );
      }
    }
  }, new URL(page.url()).origin);
}

// A dialog animates in, so its box is only final once two reads agree.
async function settledDialog(locator: Locator) {
  await locator.waitFor();
  let previous = "";
  await expect
    .poll(
      async () => {
        const current = JSON.stringify(await locator.boundingBox());
        const settled = current === previous;
        previous = current;
        return settled;
      },
      { intervals: [150] },
    )
    .toBe(true);
}

// The floating create bar is marked once so it can be found again while
// hidden, when it no longer has an accessible role.
async function setCreateBarVisibility(
  page: Page,
  visibility: "hidden" | "visible",
) {
  await page.evaluate((value) => {
    let bar = document.querySelector<HTMLElement>("[data-docs-create-bar]");
    if (!bar) {
      const button = Array.from(document.querySelectorAll("button")).find(
        (el) => el.textContent?.trim() === "Create poll",
      );
      let el: HTMLElement | null = button ?? null;
      while (
        el &&
        !["fixed", "sticky"].includes(getComputedStyle(el).position)
      ) {
        el = el.parentElement;
      }
      if (!el) throw new Error("create bar not found");
      el.dataset.docsCreateBar = "";
      bar = el;
    }
    bar.style.visibility = value;
  }, visibility);
}

async function captureCard(page: Page, card: Locator, name: string) {
  await settle(page);
  await card.evaluate((el) => el.scrollIntoView({ block: "center" }));
  const box = await card.boundingBox();
  if (!box) throw new Error("card not visible");
  await page.screenshot({ path: docsImagePath(name), clip: box });
}

test("create a poll", async ({ page }) => {
  await deleteAllMessages();
  await loginWithEmail(page, { email: organizer.email });
  await page.goto("/new");
  await page.getByLabel("Title").fill("Monthly Meetup");

  // "Add location" is a menu when the organizer can add a video call and a
  // plain button otherwise; either way the address field appears after.
  const locationField = page.getByLabel("Location", { exact: true });
  await expect(async () => {
    await page
      .getByRole("button", { name: "Add location" })
      .click({ timeout: 2000 });
    const addressItem = page.getByRole("menuitem", { name: "Address" });
    await addressItem.or(locationField).first().waitFor({ timeout: 2000 });
    if (await addressItem.isVisible()) {
      await addressItem.click();
    }
    await expect(locationField).toBeVisible({ timeout: 2000 });
  }).toPass();
  await locationField.fill("Joe's Coffee Shop");

  await page.getByRole("button", { name: "Add description" }).click();
  await page.locator('[contenteditable="true"]').click();
  await page.keyboard.type(
    "Hey everyone, please choose the dates that work for you!",
  );
  await page.evaluate(() => {
    (document.activeElement as HTMLElement | null)?.blur();
    for (const el of document.querySelectorAll("*")) {
      el.scrollTop = 0;
    }
    window.scrollTo(0, 0);
  });
  await settle(page);
  await page.screenshot({ path: docsImagePath("workflow/new-poll-page") });

  await page.getByRole("button", { name: "Next month" }).click();
  for (let day = 0; day < 4; day++) {
    await page
      .getByRole("button", {
        name: String(base.add(day, "day").date()),
        exact: true,
      })
      .click();
  }
  await page.getByText("Add time option").first().waitFor();

  // The floating create bar would sit over the calendar card.
  await setCreateBarVisibility(page, "hidden");
  const card = page
    .locator("#create-poll > div > div")
    .filter({ hasText: "Lock time zone" });
  await captureCard(page, card, "workflow/month-view");

  await page.getByRole("tab", { name: "Week view" }).click();
  await expect(page.getByText("Add time option").first()).toBeHidden();
  await captureCard(page, card, "workflow/week-view");
  await setCreateBarVisibility(page, "visible");

  await page.getByRole("button", { name: "Create poll" }).click();
  const share = page.getByRole("dialog", { name: "Share" });
  await settledDialog(share);
  await settle(page);
  await showProductionUrls(page);
  await page.screenshot({ path: docsImagePath("workflow/poll-created") });
});

test("invite participants", async ({ page, browser }) => {
  // A guest, so the invite page shows no organizer header.
  const guest = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 2,
    timezoneId: timeZone,
  });
  const guestPage = await guest.newPage();
  await guestPage.goto(`/invite/${pollId}`);
  await guestPage.getByRole("heading", { name: "Monthly Meetup" }).waitFor();
  const selectors = guestPage.getByTestId("vote-selector");
  await selectors.first().waitFor();
  // Clicks cycle yes, if need be, no.
  await selectors.nth(0).click();
  await selectors.nth(1).click();
  await selectors.nth(1).click();
  await selectors.nth(3).click();
  await settle(guestPage);
  // Vote changes animate.
  await guestPage.waitForTimeout(600);
  await guestPage.screenshot({ path: docsImagePath("workflow/voting") });
  await guest.close();

  await deleteAllMessages();
  await loginWithEmail(page, { email: organizer.email });
  await page.goto(`/poll/${pollId}`);
  await page.getByText("Olivia Brown").waitFor();
  await settle(page);
  await page.screenshot({ path: docsImagePath("workflow/review") });

  await page.getByRole("button", { name: "Share" }).click();
  const share = page.getByRole("dialog", { name: "Share" });
  await share.getByText("priya@example.com").waitFor();
  await settledDialog(share);
  await settle(page);
  await showProductionUrls(page);
  await page.screenshot({ path: docsImagePath("workflow/invite-link") });
});

test("edit a poll", async ({ page }) => {
  await deleteAllMessages();
  await loginWithEmail(page, { email: organizer.email });
  await page.goto(`/poll/${pollId}`);
  await page.getByText("Olivia Brown").waitFor();
  await page.getByRole("button", { name: "Manage" }).click();
  await page.getByRole("menuitem", { name: "Edit" }).waitFor();
  await page.waitForTimeout(300);
  await page.screenshot({
    path: docsImagePath("administrators/edit-poll-menu"),
  });

  await page.getByRole("menuitem", { name: "Edit" }).click();
  await page.getByRole("button", { name: "Save changes" }).waitFor();
  await settle(page);
  await page.screenshot({
    path: docsImagePath("administrators/edit-poll-page"),
  });
});

test("finalize", async ({ page }) => {
  await deleteAllMessages();
  await loginWithEmail(page, { email: organizer.email });
  await page.goto(`/poll/${pollId}`);
  await page.getByText("Olivia Brown").waitFor();

  await page.getByRole("button", { name: "Finalize" }).click();
  // The dialog takes each step's title as its name.
  const dialog = page.getByRole("dialog");
  await dialog.getByText("Finalize poll").waitFor();
  await settledDialog(dialog);
  await settle(page);
  await page.screenshot({ path: docsImagePath("workflow/finalize") });

  await dialog
    .getByRole("button")
    .filter({ hasText: base.format("D") })
    .first()
    .click();
  await page.getByRole("dialog", { name: "Notify participants" }).waitFor();
  await settledDialog(dialog);
  await settle(page);
  await page.screenshot({ path: docsImagePath("workflow/finalize-notify") });

  await dialog.getByRole("button", { name: "Next" }).click();
  await page.getByRole("dialog", { name: "Summary" }).waitFor();
  await settledDialog(dialog);
  await settle(page);
  await page.screenshot({ path: docsImagePath("workflow/finalize-summary") });

  await dialog.getByRole("button", { name: /^Finalize/ }).click();
  await dialog.getByRole("button", { name: "Back to poll" }).click();
  await page.getByText("Add to calendar", { exact: false }).first().waitFor();
  await settle(page);
  await page.screenshot({ path: docsImagePath("workflow/finalized") });
});
