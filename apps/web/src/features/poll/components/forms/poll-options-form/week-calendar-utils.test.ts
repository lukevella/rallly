import { describe, expect, it } from "vitest";
import type { DateTimeOption } from "./types";
import {
  DURATION_CAP_MINUTES,
  durationMinutes,
  eventId,
  isDuplicate,
  optionsToEvents,
  slotToTimeOption,
} from "./week-calendar-utils";

const d = (s: string) => new Date(s);

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

describe("optionsToEvents", () => {
  it("maps a timeSlot to a timed event", () => {
    const events = optionsToEvents([
      {
        type: "timeSlot",
        start: "2026-07-21T14:00:00",
        end: "2026-07-21T15:00:00",
      },
    ]);
    expect(events).toHaveLength(1);
    expect(events[0].allDay).toBeFalsy();
    expect(events[0].start).toEqual(d("2026-07-21T14:00:00"));
    expect(events[0].end).toEqual(d("2026-07-21T15:00:00"));
  });

  it("maps a date option to a local, next-day-exclusive all-day event", () => {
    const events = optionsToEvents([{ type: "date", date: "2026-07-21" }]);
    expect(events[0].allDay).toBe(true);
    // Local midnight, not UTC (new Date("2026-07-21") would be UTC midnight).
    expect(events[0].start).toEqual(d("2026-07-21T00:00:00"));
    // Exclusive end at the next local day boundary, never zero-length.
    expect(events[0].end).toEqual(d("2026-07-22T00:00:00"));
  });
});

describe("slotToTimeOption", () => {
  it("round-trips through naive-local strings", () => {
    const opt = slotToTimeOption(
      d("2026-07-21T14:00:00"),
      d("2026-07-21T15:30:00"),
    );
    expect(opt).toEqual({
      type: "timeSlot",
      start: "2026-07-21T14:00:00",
      end: "2026-07-21T15:30:00",
    });
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
