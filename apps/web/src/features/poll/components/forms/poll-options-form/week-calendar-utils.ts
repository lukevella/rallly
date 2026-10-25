import type { CalendarEvent } from "@rallly/ui/event-calendar";
import {
  instantToWallTime,
  wallTimeExists,
  wallTimeToInstant,
} from "@/lib/datetime/wall-time";
import type { DateTimeOption, TimeOption } from "./types";

export const DURATION_CAP_MINUTES = 60 * 24;

/**
 * Option strings are floating wall-clock times with no zone of their own; the
 * poll's zone is applied once, on save. The picker lays them out in UTC, which
 * has no DST, and reads and writes every string as if it were UTC, so the row
 * that says 10:00 is always the string 10:00 whatever the browser's zone.
 */
export const FLOATING_TIME_ZONE = "UTC";

export const floatingToDate = (wallTime: string) => new Date(`${wallTime}Z`);

export const dateToFloating = (date: Date) => date.toISOString().slice(0, 19);

/** The instant `date` expressed on the floating grid as clocks read it in `timeZone`. */
export const instantToFloating = (date: Date, timeZone: string) =>
  floatingToDate(instantToWallTime(date, timeZone));

/** The instant clocks in `timeZone` read the floating `date`. */
export const floatingToInstant = (date: Date, timeZone: string) =>
  wallTimeToInstant(dateToFloating(date), timeZone);

/** Whether both ends of the slot are times clocks in `timeZone` actually read. */
export const slotExistsIn = (option: TimeOption, timeZone: string) =>
  wallTimeExists(option.start, timeZone) &&
  wallTimeExists(option.end, timeZone);

export function eventId(option: DateTimeOption): string {
  return option.type === "date"
    ? `date:${option.date}`
    : `slot:${option.start}_${option.end}`;
}

export function optionsToEvents(options: DateTimeOption[]): CalendarEvent[] {
  return options.map((option) => {
    if (option.type === "date") {
      // An exclusive end at the next floating midnight, never zero-length.
      const start = floatingToDate(`${option.date}T00:00:00`);
      return {
        id: eventId(option),
        title: "",
        start,
        end: new Date(start.getTime() + DURATION_CAP_MINUTES * 60_000),
        allDay: true,
      };
    }
    return {
      id: eventId(option),
      title: "",
      start: floatingToDate(option.start),
      end: floatingToDate(option.end),
    };
  });
}

export function slotToTimeOption(start: Date, end: Date): TimeOption {
  return {
    type: "timeSlot",
    start: dateToFloating(start),
    end: dateToFloating(end),
  };
}

export function isDuplicate(
  options: DateTimeOption[],
  candidate: TimeOption,
): boolean {
  return options.some(
    (option) =>
      option.type === "timeSlot" &&
      option.start === candidate.start &&
      option.end === candidate.end,
  );
}

export function durationMinutes(start: Date, end: Date): number {
  return Math.round((end.getTime() - start.getTime()) / 60_000);
}
