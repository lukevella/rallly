import { afterEach, describe, expect, it } from "vitest";
import type { DateTimeOption } from "./types";
import {
  DURATION_CAP_MINUTES,
  durationMinutes,
  eventId,
  floatingToDate,
  floatingToInstant,
  instantToFloating,
  isDuplicate,
  optionsToEvents,
  skippedMinuteRanges,
  slotToTimeOption,
  startExistsIn,
} from "./week-calendar-utils";

const d = floatingToDate;

describe("eventId", () => {
  it("is stable and distinct per option identity", () => {
    const slot: DateTimeOption = {
      type: "timeSlot",
      start: "2026-07-21T14:00:00",
      end: "2026-07-21T15:00:00",
    };
    expect(eventId(slot)).toBe(eventId({ ...slot }));
    expect(eventId(slot)).not.toBe(
      eventId({ type: "date", date: "2026-07-21" }),
    );
  });
});

// The picker must not depend on the browser's zone. Each case runs with the
// process in a DST zone and in one without, across both 2026/27 US changes.
const originalTimeZone = process.env.TZ;
afterEach(() => {
  process.env.TZ = originalTimeZone;
});

describe.each([
  ["America/Chicago", 360],
  ["Asia/Kathmandu", -345],
])("with the browser in %s", (browserTimeZone, novemberOffset) => {
  const useBrowserTimeZone = () => {
    process.env.TZ = browserTimeZone;
    expect(new Date(2026, 10, 3).getTimezoneOffset()).toBe(novemberOffset);
  };

  it.each([
    "2026-11-01T10:00:00",
    "2026-11-03T10:00:00",
    "2027-03-14T10:00:00",
  ])("round trips the 10:00 slot on %s unchanged", (start) => {
    useBrowserTimeZone();
    const end = start.replace("T10:", "T11:");
    const [event] = optionsToEvents([{ type: "timeSlot", start, end }]);
    expect(event.start.toISOString()).toBe(`${start}.000Z`);
    expect(slotToTimeOption(event.start, event.end)).toEqual({
      type: "timeSlot",
      start,
      end,
    });
    expect(durationMinutes(event.start, event.end)).toBe(60);
  });

  it("maps a date option to a 24 hour all-day event", () => {
    useBrowserTimeZone();
    const [event] = optionsToEvents([{ type: "date", date: "2026-11-01" }]);
    expect(event.allDay).toBe(true);
    expect(event.start).toEqual(d("2026-11-01T00:00:00"));
    expect(event.end).toEqual(d("2026-11-02T00:00:00"));
  });
});

describe("instantToFloating / floatingToInstant", () => {
  it("puts the viewer's clock on the floating grid and back", () => {
    const instant = new Date("2026-11-03T16:00:00Z");
    const floating = instantToFloating(instant, "America/Chicago");
    expect(floating).toEqual(d("2026-11-03T10:00:00"));
    expect(floatingToInstant(floating, "America/Chicago")).toEqual(instant);
  });
});

describe("startExistsIn", () => {
  const slot = (start: string, end: string) =>
    ({ type: "timeSlot", start, end }) as const;

  it("rejects a slot that starts in a skipped hour of the poll's zone", () => {
    expect(
      startExistsIn(
        slot("2027-03-14T02:00:00", "2027-03-14T03:00:00"),
        "America/Chicago",
      ),
    ).toBe(false);
  });

  it("accepts a slot that runs into the skipped hour", () => {
    expect(
      startExistsIn(
        slot("2027-03-14T01:30:00", "2027-03-14T02:30:00"),
        "America/Chicago",
      ),
    ).toBe(true);
  });

  it("accepts the same start in a poll zone without that change", () => {
    expect(
      startExistsIn(
        slot("2027-03-14T02:00:00", "2027-03-14T03:00:00"),
        "Asia/Kathmandu",
      ),
    ).toBe(true);
  });

  it("accepts a slot in the repeated fall back hour", () => {
    expect(
      startExistsIn(
        slot("2026-11-01T01:00:00", "2026-11-01T02:00:00"),
        "America/Chicago",
      ),
    ).toBe(true);
  });
});

describe("isDuplicate", () => {
  const existing: DateTimeOption[] = [
    {
      type: "timeSlot",
      start: "2026-07-21T14:00:00",
      end: "2026-07-21T15:00:00",
    },
  ];
  it("detects an identical start+end", () => {
    expect(
      isDuplicate(existing, {
        type: "timeSlot",
        start: "2026-07-21T14:00:00",
        end: "2026-07-21T15:00:00",
      }),
    ).toBe(true);
  });
  it("allows a different end", () => {
    expect(
      isDuplicate(existing, {
        type: "timeSlot",
        start: "2026-07-21T14:00:00",
        end: "2026-07-21T16:00:00",
      }),
    ).toBe(false);
  });
});

describe("durationMinutes / cap", () => {
  it("computes minute difference", () => {
    expect(
      durationMinutes(d("2026-07-21T14:00:00"), d("2026-07-21T15:30:00")),
    ).toBe(90);
  });
  it("cap is 24h", () => {
    expect(DURATION_CAP_MINUTES).toBe(1440);
  });
});

describe("skippedMinuteRanges", () => {
  it("finds the hour Chicago skips when it springs forward", () => {
    expect(skippedMinuteRanges("2027-03-14", "America/Chicago")).toEqual([
      [120, 180],
    ]);
  });

  it("finds a half hour change", () => {
    expect(skippedMinuteRanges("2026-10-04", "Australia/Lord_Howe")).toEqual([
      [120, 150],
    ]);
  });

  it("is empty when clocks fall back or don't change", () => {
    expect(skippedMinuteRanges("2026-11-01", "America/Chicago")).toEqual([]);
    expect(skippedMinuteRanges("2027-03-15", "America/Chicago")).toEqual([]);
    expect(skippedMinuteRanges("2027-03-14", "Asia/Kathmandu")).toEqual([]);
  });
});
