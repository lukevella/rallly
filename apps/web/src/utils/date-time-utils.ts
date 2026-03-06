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

export const getDuration = (startTime: dayjs.Dayjs, endTime: dayjs.Dayjs) => {
  const hours = Math.floor(endTime.diff(startTime, "hours"));
  const minutes = Math.floor(endTime.diff(startTime, "minute") - hours * 60);
  let res = "";
  if (hours) {
    res += `${hours}h`;
  }
  if (hours && minutes) {
    res += " ";
  }
  if (minutes) {
    res += `${minutes}m`;
  }
  return res;
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
