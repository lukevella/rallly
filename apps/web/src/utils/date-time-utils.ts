import { dayjs } from "@/lib/dayjs";

import type {
  DateTimeOption,
  TimeOption,
} from "../components/forms/poll-options-form";

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
  duration: string;
  year: string;
}

export type ParsedDateTimeOpton = ParsedDateOption | ParsedTimeSlotOption;

type DurationFormatCtor = new (
  locale: string | undefined,
  options: { style: "narrow" },
) => { format(duration: { hours?: number; minutes?: number }): string };

export const formatDuration = (minutes: number, locale?: string) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const DurationFormat = (Intl as { DurationFormat?: DurationFormatCtor })
    .DurationFormat;
  if (DurationFormat) {
    return new DurationFormat(locale, { style: "narrow" }).format({
      hours,
      minutes: mins,
    });
  }
  if (hours && mins) {
    return `${hours}h ${mins}m`;
  }
  if (hours) {
    return `${hours}h`;
  }
  return `${mins}m`;
};

export const getDuration = (startTime: dayjs.Dayjs, endTime: dayjs.Dayjs) => {
  return formatDuration(endTime.diff(startTime, "minute"));
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

export const getDateProps = (date: Date) => {
  const d = dayjs(date);
  return {
    day: d.format("D"),
    dow: d.format("ddd"),
    month: d.format("MMM"),
  };
};

export const expectTimeOption = (d: DateTimeOption): TimeOption => {
  if (d.type === "date") {
    throw new Error("Expected timeSlot but got date instead");
  }
  return d;
};
