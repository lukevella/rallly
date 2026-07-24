import { expect, test } from "@playwright/test";
import { prisma } from "@rallly/database";

/**
 * The desktop poll header renders one duration per timed option. It must not
 * be focusable: otherwise a keyboard user tabbing toward the voting form hits
 * one tab stop per option, each announcing only the duration ("1h"). Regression
 * guard — the default E2E poll uses all-day options, so no other spec covers
 * the timed-header path.
 */
const POLL_ID = "header-tab-timed-poll";
const YEAR = new Date().getFullYear() + 1;

test.beforeAll(async () => {
  await prisma.poll.deleteMany({ where: { id: POLL_ID } });
  await prisma.poll.create({
    data: {
      id: POLL_ID,
      title: "Header Tab Timed Poll",
      participantUrlId: `${POLL_ID}-participant`,
      adminUrlId: `${POLL_ID}-admin`,
      kind: "time",
      timeZone: "Europe/London",
      options: {
        create: [
          { startTime: new Date(`${YEAR}-09-10T09:00:00.000Z`), duration: 60 },
          { startTime: new Date(`${YEAR}-09-10T11:00:00.000Z`), duration: 60 },
          { startTime: new Date(`${YEAR}-09-10T14:00:00.000Z`), duration: 60 },
        ],
      },
    },
  });
});

test.afterAll(async () => {
  await prisma.poll.deleteMany({ where: { id: POLL_ID } });
});

test("header duration is not tabbable", async ({ page }) => {
  await page.goto(`/invite/${POLL_ID}`);
  await page.getByTestId("option-start-time").first().waitFor();

  // Sanity: multiple timed option headers render (each has a duration).
  expect(await page.getByTestId("option-start-time").count()).toBe(3);

  // The duration triggers live in <thead>. None may be focusable, or a
  // keyboard user hits one tab stop per option before reaching the form.
  const focusableInHead = await page
    .locator("thead button, thead a[href], thead [tabindex='0']")
    .count();
  expect(focusableInHead).toBe(0);
});
