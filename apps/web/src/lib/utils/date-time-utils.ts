import type {
  DateTimeOption,
  TimeOption,
} from "@/features/poll/components/forms/poll-options-form/types";
import { normalizeTimeZone } from "@/lib/datetime/utils";

/**
 * The device's zone, or undefined when the engine reports one Intl itself
 * rejects (some devices report "Etc/Unknown").
 */
export function detectBrowserTimeZone() {
  return normalizeTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone);
}

/** The device's zone, falling back to UTC when it can't be detected. */
export function getBrowserTimeZone() {
  return detectBrowserTimeZone() ?? "UTC";
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
  duration: string;
  year: string;
}

export type ParsedDateTimeOpton = ParsedDateOption | ParsedTimeSlotOption;

export const getOptionDateTimeLabel = (option: ParsedDateTimeOpton) => {
  const date = `${option.dow} ${option.day} ${option.month} ${option.year}`;
  return option.type === "timeSlot"
    ? `${date}, ${option.startTime} – ${option.endTime}`
    : date;
};

export const expectTimeOption = (d: DateTimeOption): TimeOption => {
  if (d.type === "date") {
    throw new Error("Expected timeSlot but got date instead");
  }
  return d;
};
