import type { BrowserContext, Page } from "@playwright/test";
import { expect, test } from "@playwright/test";
import { prisma } from "@rallly/database";

/**
 * Cross-timezone rendering guarantees for the poll invite page and the
 * public event page:
 *
 * - Polls/events with a time zone are fixed instants: displayed times must
 *   shift between viewers in different zones.
 * - Floating (no zone) and all-day polls/events are wall times: displayed
 *   dates and times must be identical for every viewer.
 *
 * Both zones are deliberately non-whole-hour offsets (UTC+5:45 and UTC-2:30
 * in September) and neither matches a CI runner's zone, so a value that
 * leaks through the wrong zone can't accidentally format to the same string.
 */
const ZONE_A = "Asia/Kathmandu";
const ZONE_B = "America/St_Johns";

const HOST_EMAIL = "cross-tz-host@rallly.co";

const ZONED_POLL_ID = "cross-tz-zoned-poll";
const FLOATING_POLL_ID = "cross-tz-floating-poll";
const DATE_POLL_ID = "cross-tz-date-poll";
const FIXED_EVENT_ID = "cross-tz-fixed-event";
const ALL_DAY_EVENT_ID = "cross-tz-all-day-event";

// Always next year so the fixtures stay in the future. September avoids DST
// transitions in both zones (Kathmandu has none; St. John's is on NDT).
const YEAR = new Date().getFullYear() + 1;

// 16:00Z: 21:45 in Kathmandu, 13:30 in St. John's (same day in both, so only
// the time of day shifts).
const ZONED_POLL_START = new Date(`${YEAR}-09-10T16:00:00.000Z`);
// Stored wall time 00:30. A viewer west of UTC would see the previous day if
// this were wrongly treated as an instant.
const FLOATING_POLL_START = new Date(`${YEAR}-09-10T00:30:00.000Z`);
const DATE_POLL_START = new Date(`${YEAR}-09-10T00:00:00.000Z`);
// 20:00Z: already September 11 in Kathmandu, still September 10 in
// St. John's, so both the date and the time must shift.
const FIXED_EVENT_START = new Date(`${YEAR}-09-10T20:00:00.000Z`);
const FIXED_EVENT_END = new Date(`${YEAR}-09-10T21:00:00.000Z`);
const ALL_DAY_EVENT_START = new Date(`${YEAR}-09-10T00:00:00.000Z`);
const ALL_DAY_EVENT_END = new Date(`${YEAR}-09-11T00:00:00.000Z`);

function watchForHydrationErrors(page: Page) {
  const errors: string[] = [];
  const isHydrationError = (text: string) =>
    /hydrat/i.test(text) || /minified react error #(418|423|425)/i.test(text);

  page.on("console", (message) => {
    if (message.type() === "error" && isHydrationError(message.text())) {
      errors.push(message.text());
    }
  });
  page.on("pageerror", (error) => {
    if (isHydrationError(error.message)) {
      errors.push(error.message);
    }
  });
  return errors;
}

async function readWhenHydrated(page: Page, testId: string) {
  const locator = page.getByTestId(testId).first();
  // Datetime components render blank until hydration, when the viewer's
  // zone is known.
  await expect(locator).not.toHaveText(/^[\s ]*$/);
  const text = await locator.textContent();
  return text?.trim() ?? "";
}

/**
 * Formats an instant with the page's own Intl engine (matching the app's
 * "time" preset) in the context's zone, or a fixed zone when given.
 */
function formatTimeInPage(page: Page, iso: string, timeZone?: string) {
  return page.evaluate(
    ([value, zone]) =>
      new Intl.DateTimeFormat("en", {
        hour: "numeric",
        minute: "2-digit",
        timeZone: zone,
      }).format(new Date(value)),
    [iso, timeZone] as const,
  );
}

async function seed() {
  await cleanup();

  const user = await prisma.user.create({
    data: {
      email: HOST_EMAIL,
      name: "Cross TZ Host",
      locale: "en",
      timeZone: "Europe/London",
      timeFormat: "hours24",
      emailVerified: true,
    },
  });

  const space = await prisma.space.create({
    data: {
      name: "Cross TZ Space",
      ownerId: user.id,
      tier: "hobby",
    },
  });

  await prisma.poll.create({
    data: {
      id: ZONED_POLL_ID,
      title: "Cross TZ Zoned Poll",
      participantUrlId: `${ZONED_POLL_ID}-participant`,
      adminUrlId: `${ZONED_POLL_ID}-admin`,
      kind: "time",
      timeZone: "Europe/London",
      options: {
        create: { startTime: ZONED_POLL_START, duration: 60 },
      },
    },
  });

  await prisma.poll.create({
    data: {
      id: FLOATING_POLL_ID,
      title: "Cross TZ Floating Poll",
      participantUrlId: `${FLOATING_POLL_ID}-participant`,
      adminUrlId: `${FLOATING_POLL_ID}-admin`,
      kind: "time",
      timeZone: null,
      options: {
        create: { startTime: FLOATING_POLL_START, duration: 60 },
      },
    },
  });

  await prisma.poll.create({
    data: {
      id: DATE_POLL_ID,
      title: "Cross TZ Date Poll",
      participantUrlId: `${DATE_POLL_ID}-participant`,
      adminUrlId: `${DATE_POLL_ID}-admin`,
      kind: "date",
      timeZone: null,
      options: {
        create: { startTime: DATE_POLL_START, duration: 0 },
      },
    },
  });

  await prisma.scheduledEvent.create({
    data: {
      id: FIXED_EVENT_ID,
      uid: `${FIXED_EVENT_ID}-uid`,
      userId: user.id,
      spaceId: space.id,
      title: "Cross TZ Fixed Event",
      timeZone: "Europe/London",
      start: FIXED_EVENT_START,
      end: FIXED_EVENT_END,
      allDay: false,
    },
  });

  await prisma.scheduledEvent.create({
    data: {
      id: ALL_DAY_EVENT_ID,
      uid: `${ALL_DAY_EVENT_ID}-uid`,
      userId: user.id,
      spaceId: space.id,
      title: "Cross TZ All Day Event",
      timeZone: null,
      start: ALL_DAY_EVENT_START,
      end: ALL_DAY_EVENT_END,
      allDay: true,
    },
  });
}

async function cleanup() {
  await prisma.poll.deleteMany({
    where: { id: { in: [ZONED_POLL_ID, FLOATING_POLL_ID, DATE_POLL_ID] } },
  });
  await prisma.scheduledEvent.deleteMany({
    where: { id: { in: [FIXED_EVENT_ID, ALL_DAY_EVENT_ID] } },
  });
  await prisma.user.deleteMany({ where: { email: HOST_EMAIL } });
}

test.describe("cross-timezone rendering", () => {
  let contextA: BrowserContext;
  let contextB: BrowserContext;

  test.beforeAll(async ({ browser }) => {
    await seed();
    contextA = await browser.newContext({
      timezoneId: ZONE_A,
      locale: "en-US",
    });
    contextB = await browser.newContext({
      timezoneId: ZONE_B,
      locale: "en-US",
    });
  });

  test.afterAll(async () => {
    await contextA?.close();
    await contextB?.close();
    await cleanup();
  });

  async function openInBothZones(path: string) {
    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();
    const errorsA = watchForHydrationErrors(pageA);
    const errorsB = watchForHydrationErrors(pageB);
    await Promise.all([pageA.goto(path), pageB.goto(path)]);
    return {
      pageA,
      pageB,
      expectNoHydrationErrors: () => {
        expect(errorsA).toEqual([]);
        expect(errorsB).toEqual([]);
      },
      close: async () => {
        await pageA.close();
        await pageB.close();
      },
    };
  }

  test("poll with a time zone shifts slot times between viewers", async () => {
    const { pageA, pageB, expectNoHydrationErrors, close } =
      await openInBothZones(`/invite/${ZONED_POLL_ID}`);

    const startIso = ZONED_POLL_START.toISOString();
    const [timeA, timeB] = await Promise.all([
      readWhenHydrated(pageA, "option-start-time"),
      readWhenHydrated(pageB, "option-start-time"),
    ]);

    expect(timeA).toBe(await formatTimeInPage(pageA, startIso)); // 9:45 PM
    expect(timeB).toBe(await formatTimeInPage(pageB, startIso)); // 1:30 PM
    expect(timeA).not.toBe(timeB);

    expectNoHydrationErrors();
    await close();
  });

  test("floating time poll shows identical times to every viewer", async () => {
    const { pageA, pageB, expectNoHydrationErrors, close } =
      await openInBothZones(`/invite/${FLOATING_POLL_ID}`);

    const [timeA, timeB, dayA, dayB] = await Promise.all([
      readWhenHydrated(pageA, "option-start-time"),
      readWhenHydrated(pageB, "option-start-time"),
      readWhenHydrated(pageA, "option-day"),
      readWhenHydrated(pageB, "option-day"),
    ]);

    // Floating wall times are stored as UTC and must render unshifted.
    const expected = await formatTimeInPage(
      pageA,
      FLOATING_POLL_START.toISOString(),
      "UTC",
    ); // 12:30 AM
    expect(timeA).toBe(expected);
    expect(timeB).toBe(expected);
    // A viewer west of UTC must not see the previous day.
    expect(dayA).toBe("10");
    expect(dayB).toBe("10");

    expectNoHydrationErrors();
    await close();
  });

  test("all-day date poll shows the same date to every viewer", async () => {
    const { pageA, pageB, expectNoHydrationErrors, close } =
      await openInBothZones(`/invite/${DATE_POLL_ID}`);

    const [dayA, dayB, monthA, monthB] = await Promise.all([
      readWhenHydrated(pageA, "option-day"),
      readWhenHydrated(pageB, "option-day"),
      readWhenHydrated(pageA, "option-month"),
      readWhenHydrated(pageB, "option-month"),
    ]);

    expect(dayA).toBe("10");
    expect(dayB).toBe("10");
    expect(monthA).toBe("Sep");
    expect(monthB).toBe("Sep");

    expectNoHydrationErrors();
    await close();
  });

  test("event with a time zone shifts date and time between viewers", async () => {
    const { pageA, pageB, expectNoHydrationErrors, close } =
      await openInBothZones(`/e/${FIXED_EVENT_ID}`);

    const startIso = FIXED_EVENT_START.toISOString();
    const [dateA, dateB, rangeA, rangeB] = await Promise.all([
      readWhenHydrated(pageA, "event-start-date"),
      readWhenHydrated(pageB, "event-start-date"),
      readWhenHydrated(pageA, "event-time-range"),
      readWhenHydrated(pageB, "event-time-range"),
    ]);

    // 20:00 UTC is already the 11th in Kathmandu and still the 10th in
    // St. John's.
    expect(dateA).toContain("September 11");
    expect(dateB).toContain("September 10");

    const expectedStartA = await formatTimeInPage(pageA, startIso); // 1:45 AM
    const expectedStartB = await formatTimeInPage(pageB, startIso); // 5:30 PM
    expect(rangeA).toContain(expectedStartA.split(/\s/)[0]);
    expect(rangeB).toContain(expectedStartB.split(/\s/)[0]);
    expect(rangeA).not.toBe(rangeB);

    expectNoHydrationErrors();
    await close();
  });

  test("all-day event shows the same date to every viewer", async () => {
    const { pageA, pageB, expectNoHydrationErrors, close } =
      await openInBothZones(`/e/${ALL_DAY_EVENT_ID}`);

    const [dateA, dateB, rangeA, rangeB] = await Promise.all([
      readWhenHydrated(pageA, "event-start-date"),
      readWhenHydrated(pageB, "event-start-date"),
      readWhenHydrated(pageA, "event-time-range"),
      readWhenHydrated(pageB, "event-time-range"),
    ]);

    expect(dateA).toContain("September 10");
    expect(dateB).toBe(dateA);
    expect(rangeA).toBe("All day");
    expect(rangeB).toBe("All day");

    expectNoHydrationErrors();
    await close();
  });
});
