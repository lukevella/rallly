import type {
  DateTimeOption,
  TimeOption,
} from "@/features/poll/components/forms/poll-options-form/types";
import { dayjs } from "@/lib/dayjs";

export function getBrowserTimeZone() {
  return dayjs.tz.guess();
}

export const encodeDateOption = (option: DateTimeOption) => {
  return option.type === "timeSlot"
    ? `${option.start}/${option.end}`
    : option.date;
};

export interface ParsedDateOption {
  type: "date";
  optionId: string;
  day: string;
  dow: string;
  month: string;
  year: string;
}

export interface ParsedTimeSlotOption {
  type: "timeSlot";
  optionId: string;
  day: string;
  dow: string;
  month: string;
  startTime: string;
  endTime: string;
  /** Speech-friendly times (minutes dropped when zero) for screen readers. */
  speechStartTime: string;
  speechEndTime: string;
  duration: string;
  year: string;
}

export type ParsedDateTimeOpton = ParsedDateOption | ParsedTimeSlotOption;

/**
 * Screen-reader label for a vote control and its change announcement. Drops
 * the year (usually inferable from context) and uses speech-friendly times
 * ("1 PM" rather than the literal "1:00 PM", which reads as "one zero zero P
 * M").
 */
export const getOptionAnnouncementLabel = (option: ParsedDateTimeOpton) => {
  const date = `${option.dow} ${option.day} ${option.month}`;
  return option.type === "timeSlot"
    ? `${date}, ${option.speechStartTime} – ${option.speechEndTime}`
    : date;
};

export const removeAllOptionsForDay = (
  options: DateTimeOption[],
  date: Date,
) => {
  return options.filter((option) => {
    return !dayjs(date).isSame(
      option.type === "date" ? option.date : option.start,
      "day",
    );
  });
};

export const expectTimeOption = (d: DateTimeOption): TimeOption => {
  if (d.type === "date") {
    throw new Error("Expected timeSlot but got date instead");
  }
  return d;
};
