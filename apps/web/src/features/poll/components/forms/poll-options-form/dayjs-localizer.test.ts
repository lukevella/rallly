import { describe, expect, it } from "vitest";
import { dayjs } from "@/lib/dayjs";
import dayjsLocalizer from "./dayjs-localizer";

// The DateLocalizer typings omit the week unit react-big-calendar passes at
// runtime, so widen to the shape under test.
const createLocalizer = (weekStart?: number) =>
  dayjsLocalizer(dayjs, { weekStart }) as unknown as {
    startOfWeek: () => number;
    startOf: (date: Date, unit: string) => Date;
    endOf: (date: Date, unit: string) => Date;
    eq: (a: Date, b: Date, unit: string) => boolean;
  };

// 2026-07-14 is a Tuesday
const tuesday = new Date(2026, 6, 14, 12, 0, 0);

describe("dayjsLocalizer weekStart", () => {
  it("defaults to the dayjs locale week start when no weekStart is given", () => {
    const localizer = createLocalizer();
    expect(localizer.startOfWeek()).toBe(0);
    expect(localizer.startOf(tuesday, "week")).toEqual(
      new Date(2026, 6, 12, 0, 0, 0),
    );
  });

  it("starts the week on Monday when weekStart is 1", () => {
    const localizer = createLocalizer(1);
    expect(localizer.startOfWeek()).toBe(1);
    expect(localizer.startOf(tuesday, "week")).toEqual(
      new Date(2026, 6, 13, 0, 0, 0),
    );
    expect(localizer.endOf(tuesday, "week")).toEqual(
      new Date(2026, 6, 19, 23, 59, 59, 999),
    );
  });

  it("starts the week on Saturday when weekStart is 6", () => {
    const localizer = createLocalizer(6);
    expect(localizer.startOf(tuesday, "week")).toEqual(
      new Date(2026, 6, 11, 0, 0, 0),
    );
    expect(localizer.endOf(tuesday, "week")).toEqual(
      new Date(2026, 6, 17, 23, 59, 59, 999),
    );
  });

  it("keeps a date already on the week start day in place", () => {
    const localizer = createLocalizer(1);
    const monday = new Date(2026, 6, 13, 8, 30, 0);
    expect(localizer.startOf(monday, "week")).toEqual(
      new Date(2026, 6, 13, 0, 0, 0),
    );
  });

  it("compares dates by the configured week boundary", () => {
    const localizer = createLocalizer(1);
    const sunday = new Date(2026, 6, 12);
    const monday = new Date(2026, 6, 13);
    // With Monday as week start, Sunday belongs to the previous week
    expect(localizer.eq(sunday, monday, "week")).toBe(false);
    expect(localizer.eq(monday, tuesday, "week")).toBe(true);
  });
});
