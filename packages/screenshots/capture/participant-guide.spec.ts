import path from "node:path";
import { test } from "@playwright/test";
import { prisma } from "@rallly/database";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);
dayjs.extend(timezone);

// The browser context renders in this zone, so slots are built in it too:
// the runner's own clock would shift every displayed time.
const timeZone = "Europe/London";

/**
 * The three screenshots in docs/guide/participant-guide.mdx, taken as a
 * guest walking through a response on the invite page. Written straight
 * into the docs so a UI change is a re-run away from the guide.
 */

const pollId = "screenshot-participant-guide";

const docsImage = (name: string) =>
  path.join(__dirname, "../../../apps/docs/images/guide", `${name}.png`);

test.use({
  viewport: { width: 1182, height: 820 },
  deviceScaleFactor: 2,
  timezoneId: timeZone,
});

test.beforeAll(async () => {
  await prisma.poll.delete({ where: { id: pollId } }).catch(() => {});

  // Next month's second week, so the calendar header reads as one month.
  const base = dayjs()
    .tz(timeZone)
    .add(1, "month")
    .startOf("month")
    .add(7, "day");
  const slot = (
    day: number,
    hour: number,
    minute: number,
    duration: number,
  ) => ({
    startTime: base
      .add(day, "day")
      .hour(hour)
      .minute(minute)
      .second(0)
      .toDate(),
    duration,
  });

  await prisma.poll.create({
    data: {
      id: pollId,
      title: "Monthly Meetup",
      description: "Hey everyone, please choose the dates that work for you!",
      location: "Joe's Coffee Shop",
      userId: "user-1",
      spaceId: "space-1",
      status: "open",
      timeZone,
      options: {
        create: [
          slot(0, 13, 0, 60),
          slot(2, 13, 30, 60),
          slot(3, 15, 30, 60),
          slot(4, 14, 0, 60),
          slot(9, 12, 0, 60),
          slot(10, 12, 0, 60),
        ],
      },
    },
  });
});

test.afterAll(async () => {
  await prisma.poll.delete({ where: { id: pollId } }).catch(() => {});
});

test("participant guide", async ({ page }) => {
  await page.goto(`/invite/${pollId}`);
  await page.getByRole("heading", { name: "Monthly Meetup" }).waitFor();

  const selectors = page.getByTestId("vote-selector");
  await selectors.first().waitFor();
  // yes, yes, no, if need be, no, yes
  await selectors.nth(0).click();
  await selectors.nth(1).click();
  await selectors.nth(3).click();
  await selectors.nth(3).click();
  await selectors.nth(5).click();
  await page.waitForLoadState("networkidle");
  await page.screenshot({ path: docsImage("voting-in-progress") });

  await page.getByRole("button", { name: "Continue" }).click();
  const dialog = page.getByRole("dialog", { name: "New participant" });
  await dialog.getByLabel("Name").fill("John Doe");
  await dialog.getByLabel("Email").fill("john@example.com");
  await page.screenshot({ path: docsImage("voting-submitting") });

  await dialog.getByRole("button", { name: "Save availability" }).click();
  await page.getByText("Your response has been saved").waitFor();
  await page.getByRole("button", { name: "Back to poll" }).click();
  await page.getByText("John Doe").waitFor();
  await page.getByTestId("participant-menu").click();
  await page.getByRole("menuitem", { name: "Edit votes" }).waitFor();
  await page.screenshot({ path: docsImage("voting-submitted") });
});
