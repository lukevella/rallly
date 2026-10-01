import path from "node:path";
import { expect, test } from "@playwright/test";
import { prisma } from "@rallly/database";
import { deleteAllMessages, loginWithEmail } from "@rallly/test-helpers";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { customAlphabet } from "nanoid";

dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * The six screenshots on the landing site's press kit page, written straight
 * into apps/landing/public/press/screenshots. Re-run after a UI change, then
 * rebuild rallly-press-kit.zip (see the README).
 */

const timeZone = "America/New_York";
const pollId = "screenshot-press-kit";
const organizer = {
  id: "screenshot-press-kit-user",
  email: "press-kit@rallly.co",
  name: "Jessie Smith",
};
const spaceId = "screenshot-press-kit-space";

// Next month's Wednesday and Thursday in the second week, two times each,
// so the grid reads as one month and the week view holds both days.
const base = (() => {
  let date = dayjs()
    .tz(timeZone)
    .add(1, "month")
    .startOf("month")
    .add(7, "day");
  while (date.day() !== 3) {
    date = date.add(1, "day");
  }
  return date;
})();

const pressImage = (name: string) =>
  path.join(
    __dirname,
    "../../../apps/landing/public/press/screenshots",
    `${name}.png`,
  );

// Mirrors generateAccessToken in apps/web/src/features/poll/utils.ts, which
// this package cannot import. Participant.token has no DB default.
const generateAccessToken = customAlphabet(
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  32,
);

test.use({
  viewport: { width: 1280, height: 960 },
  deviceScaleFactor: 2,
  timezoneId: timeZone,
});

// Dev routes compile on first hit.
test.describe.configure({ mode: "serial", timeout: 180_000 });

test.beforeAll(async () => {
  await deleteAllMessages();
  await prisma.user.delete({ where: { id: organizer.id } }).catch(() => {});

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

  // Build each instant from a wall-clock string: dayjs keeps the offset of
  // the original instant across date arithmetic, which is wrong once the
  // target month sits on the other side of a DST change.
  const slot = (day: number, hour: number) => ({
    startTime: dayjs
      .tz(`${base.add(day, "day").format("YYYY-MM-DD")} ${hour}:00`, timeZone)
      .toDate(),
    duration: 60,
  });

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
      options: {
        create: [slot(0, 17), slot(0, 18), slot(1, 17), slot(1, 18)],
      },
      participants: {
        create: [
          { name: "Emma Davis", email: "emma@example.com" },
          { name: "Liam Nguyen", email: "liam@example.com" },
          { name: "Olivia Brown", email: "olivia@example.com" },
        ].map((participant) => ({
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
});

test.afterAll(async () => {
  // Cascades through the space and the poll.
  await prisma.user.delete({ where: { id: organizer.id } }).catch(() => {});
});

for (const theme of ["light", "dark"] as const) {
  test.describe(theme, () => {
    test.use({ colorScheme: theme });
    const image = (name: string) =>
      pressImage(theme === "dark" ? `${name}-dark` : name);

    test("voting", async ({ page }) => {
      await page.goto(`/invite/${pollId}`);
      await page.getByRole("heading", { name: "Monthly Meetup" }).waitFor();

      const selectors = page.getByTestId("vote-selector");
      await selectors.first().waitFor();
      // Clicks cycle yes, if need be, no.
      await selectors.nth(0).click();
      await selectors.nth(1).click();
      await selectors.nth(1).click();
      await selectors.nth(1).click();
      await selectors.nth(2).click();
      await selectors.nth(3).click();
      await page.waitForLoadState("networkidle");
      await page.screenshot({ path: image("voting") });
    });

    test("results and schedule", async ({ page }) => {
      await loginWithEmail(page, { email: organizer.email });
      await page.goto(`/poll/${pollId}`);
      await page.getByRole("heading", { name: "Monthly Meetup" }).waitFor();
      await page.getByText("Olivia Brown").waitFor();
      await page.waitForLoadState("networkidle");
      await page.screenshot({ path: image("review-results") });

      await page.getByRole("button", { name: "Manage" }).click();
      await page.getByRole("menuitem", { name: "Schedule" }).click();
      const dialog = page.getByRole("dialog", { name: "Schedule" });
      await expect(dialog).toBeVisible();
      await page.waitForTimeout(1500);
      await page.screenshot({ path: image("finalize") });
    });

    test("calendar views", async ({ page }) => {
      await loginWithEmail(page, { email: organizer.email });
      await page.goto(`/poll/${pollId}/edit-options`);

      // The smallest div holding both the header and the footer is the card.
      const card = page
        .locator("div")
        .filter({ has: page.getByRole("heading", { name: "Calendar" }) })
        .filter({ has: page.getByText("Lock time zone") })
        .last();
      await card.waitFor();
      await page.getByText("Add time option").first().waitFor();

      const captureCard = async (name: string) => {
        await page.waitForLoadState("networkidle");
        const box = await card.boundingBox();
        if (!box) {
          throw new Error("Calendar card not visible");
        }
        // Pad the card out to 4:3 so it matches the page shots.
        const margin = 24;
        let width = box.width + margin * 2;
        let height = box.height + margin * 2;
        if (width / height > 4 / 3) {
          height = (width * 3) / 4;
        } else {
          width = (height * 4) / 3;
        }
        await page.screenshot({
          path: image(name),
          fullPage: true,
          clip: {
            x: box.x + box.width / 2 - width / 2,
            y: Math.max(0, box.y + box.height / 2 - height / 2),
            width,
            height,
          },
        });
      };

      await captureCard("calendar-month-view");

      await page.getByRole("tab", { name: "Week view" }).click();
      await expect(page.getByText("Add time option").first()).toBeHidden();
      await captureCard("calendar-week-view");
    });

    test("create poll", async ({ page }) => {
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

      // The description stays collapsed: with it open the sticky create bar
      // lands on the time slot list.
      await page.getByLabel("Title").click();

      // Pick the same two days so the time slot list has content.
      await page.getByRole("button", { name: "Next month" }).click();
      await page
        .getByRole("button", { name: String(base.date()), exact: true })
        .click();
      await page
        .getByRole("button", {
          name: String(base.add(1, "day").date()),
          exact: true,
        })
        .click();
      await page.getByText("Add time option").first().waitFor();

      await page.waitForLoadState("networkidle");
      await page.screenshot({ path: image("create-poll") });
    });
  });
}
