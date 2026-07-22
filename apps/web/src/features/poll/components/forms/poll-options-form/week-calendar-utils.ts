import type { CalendarEvent } from "@rallly/ui/event-calendar";
import { dayjs } from "@/lib/dayjs";
import type { DateTimeOption, TimeOption } from "./types";
import { formatDateWithoutTz } from "./utils";

export const DURATION_CAP_MINUTES = 60 * 24;

export function eventId(option: DateTimeOption): string {
  return option.type === "date"
    ? `date:${option.date}`
    : `slot:${option.start}_${option.end}`;
}

export function optionsToEvents(options: DateTimeOption[]): CalendarEvent[] {
  return options.map((option) => {
    if (option.type === "date") {
      // Parse the date-only value as LOCAL midnight (new Date("YYYY-MM-DD")
      // would parse as UTC), and give the all-day event an exclusive end at the
      // next local day boundary rather than a zero-length span.
      const start = dayjs(option.date).startOf("day");
      return {
        id: eventId(option),
        title: "",
        start: start.toDate(),
        end: start.add(1, "day").toDate(),
        allDay: true,
      };
    }
    return {
      id: eventId(option),
      title: "",
      start: new Date(option.start),
      end: new Date(option.end),
    };
  });
}

export function slotToTimeOption(start: Date, end: Date): TimeOption {
  return {
    type: "timeSlot",
    start: formatDateWithoutTz(start),
    end: formatDateWithoutTz(end),
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
  return dayjs(end).diff(start, "minutes");
}
