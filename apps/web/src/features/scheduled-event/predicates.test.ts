import { describe, expect, it } from "vitest";
import {
  pastScheduledEventWhere,
  upcomingScheduledEventWhere,
} from "./predicates";

type TestEvent = {
  status: string;
  deletedAt: Date | null;
  allDay: boolean;
  start: Date;
  end: Date;
};

type Where =
  | ReturnType<typeof upcomingScheduledEventWhere>
  | ReturnType<typeof pastScheduledEventWhere>;

// Interprets the Prisma where clause against an in-memory event so the tests
// exercise the exact predicate the queries send to the database.
function matchesWhere(where: Where, event: TestEvent) {
  if (event.status !== where.status || event.deletedAt !== where.deletedAt) {
    return false;
  }
  return where.OR.some((arm) => {
    if (arm.allDay !== event.allDay) {
      return false;
    }
    if ("gt" in arm.end && arm.end.gt !== undefined) {
      return event.end.getTime() > arm.end.gt.getTime();
    }
    if ("lte" in arm.end && arm.end.lte !== undefined) {
      return event.end.getTime() <= arm.end.lte.getTime();
    }
    throw new Error("Unexpected end filter shape");
  });
}

function allDayEvent({ start, end }: { start: string; end: string }) {
  return {
    status: "confirmed",
    deletedAt: null,
    allDay: true,
    start: new Date(`${start}T00:00:00Z`),
    end: new Date(`${end}T00:00:00Z`),
  } satisfies TestEvent;
}

function timedEvent({ start, end }: { start: string; end: string }) {
  return {
    status: "confirmed",
    deletedAt: null,
    allDay: false,
    start: new Date(start),
    end: new Date(end),
  } satisfies TestEvent;
}

// 3pm July 1 in Honolulu (UTC-10)
const honolulu = {
  now: new Date("2025-07-02T01:00:00Z"),
  timeZone: "Pacific/Honolulu",
};

describe("upcomingScheduledEventWhere", () => {
  it("keeps today's all-day event upcoming for a viewer west of UTC", () => {
    // Stored as UTC midnight; end is exclusive (start + 1 day)
    const event = allDayEvent({ start: "2025-07-01", end: "2025-07-02" });

    expect(matchesWhere(upcomingScheduledEventWhere(honolulu), event)).toBe(
      true,
    );
    expect(matchesWhere(pastScheduledEventWhere(honolulu), event)).toBe(false);
  });

  it("moves the same all-day event to past for a viewer already on the next day", () => {
    const event = allDayEvent({ start: "2025-07-01", end: "2025-07-02" });
    const utcViewer = { now: honolulu.now, timeZone: "UTC" };

    expect(matchesWhere(upcomingScheduledEventWhere(utcViewer), event)).toBe(
      false,
    );
    expect(matchesWhere(pastScheduledEventWhere(utcViewer), event)).toBe(true);
  });

  it("keeps a multi-day all-day span upcoming through its final day", () => {
    const event = allDayEvent({ start: "2025-06-29", end: "2025-07-02" });

    expect(matchesWhere(upcomingScheduledEventWhere(honolulu), event)).toBe(
      true,
    );
  });

  it("counts an in-progress timed event as upcoming", () => {
    const event = timedEvent({
      start: "2025-07-02T00:30:00Z",
      end: "2025-07-02T01:30:00Z",
    });

    expect(matchesWhere(upcomingScheduledEventWhere(honolulu), event)).toBe(
      true,
    );
  });
});

describe("pastScheduledEventWhere", () => {
  it("is the exact negation of upcoming for the same inputs", () => {
    const events = [
      allDayEvent({ start: "2025-06-30", end: "2025-07-01" }),
      allDayEvent({ start: "2025-07-01", end: "2025-07-02" }),
      allDayEvent({ start: "2025-07-02", end: "2025-07-03" }),
      allDayEvent({ start: "2025-06-29", end: "2025-07-02" }),
      // Boundary: all-day event ending exactly at today's UTC midnight
      allDayEvent({ start: "2025-06-28", end: "2025-07-01" }),
      timedEvent({
        start: "2025-07-01T22:00:00Z",
        end: "2025-07-02T00:00:00Z",
      }),
      timedEvent({
        start: "2025-07-02T00:30:00Z",
        end: "2025-07-02T01:30:00Z",
      }),
      timedEvent({
        start: "2025-07-02T02:00:00Z",
        end: "2025-07-02T03:00:00Z",
      }),
      // Boundary: timed event ending exactly at now
      timedEvent({
        start: "2025-07-02T00:00:00Z",
        end: "2025-07-02T01:00:00Z",
      }),
    ];

    for (const viewer of [
      honolulu,
      { now: honolulu.now, timeZone: "UTC" },
      { now: honolulu.now, timeZone: "Asia/Tokyo" },
    ]) {
      const upcoming = upcomingScheduledEventWhere(viewer);
      const past = pastScheduledEventWhere(viewer);
      for (const event of events) {
        expect(matchesWhere(upcoming, event)).toBe(!matchesWhere(past, event));
      }
    }
  });
});
