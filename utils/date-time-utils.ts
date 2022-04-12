import { format, isSameDay } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import spacetime from "spacetime";

import {
  DateTimeOption,
  TimeOption,
} from "../components/forms/poll-options-form";

export const getBrowserTimeZone = () =>
  Intl.DateTimeFormat().resolvedOptions().timeZone;

export const encodeDateOption = (option: DateTimeOption) => {
  return option.type === "timeSlot"
    ? `${option.start}/${option.end}`
    : option.date;
};

type ParsedDateTimeOpton = { day: string; dow: string; month: string } & (
  | {
      type: "timeSlot";
      startTime: string;
      endTime: string;
    }
  | {
      type: "date";
    }
);

export const decodeDateOption = (
  option: string,
  timeZone: string | null,
  targetTimeZone: string,
): ParsedDateTimeOpton => {
  const isTimeRange = option.indexOf("/") !== -1;
  // option can either be an ISO date (ex. 2000-01-01)
  // or a time range (ex. 2000-01-01T08:00:00/2000-01-01T09:00:00)
  if (isTimeRange) {
    const [start, end] = option.split("/");

    if (timeZone && targetTimeZone) {
      const startDate = spacetime(start, timeZone).toNativeDate();
      const endDate = spacetime(end, timeZone).toNativeDate();
      return {
        type: "timeSlot",
        startTime: formatInTimeZone(startDate, targetTimeZone, "hh:mm a"),
        endTime: formatInTimeZone(endDate, targetTimeZone, "hh:mm a"),
        day: formatInTimeZone(startDate, targetTimeZone, "dd"),
        dow: formatInTimeZone(startDate, targetTimeZone, "E"),
        month: formatInTimeZone(startDate, targetTimeZone, "MMM"),
      };
    } else {
      const date = new Date(start);
      return {
        type: "timeSlot",
        startTime: format(date, "hh:mm a"),
        endTime: format(new Date(end), "hh:mm a"),
        day: format(date, "dd"),
        dow: format(date, "E"),
        month: format(date, "MMM"),
      };
    }
  }

  // we add the time because otherwise Date will assume UTC time which might change the day for some time zones
  const date = new Date(option + "T00:00:00");
  return {
    type: "date",
    day: format(date, "dd"),
    dow: format(date, "E"),
    month: format(date, "MMM"),
  };
};

export const removeAllOptionsForDay = (
  options: DateTimeOption[],
  date: Date,
) => {
  return options.filter((option) => {
    const optionDate = spacetime(
      option.type === "date" ? option.date : option.start,
    ).toNativeDate();
    return !isSameDay(date, optionDate);
  });
};

export const getDateProps = (date: Date) => {
  return {
    day: format(date, "dd"),
    dow: format(date, "E"),
    month: format(date, "MMM"),
  };
};

export const expectTimeOption = (d: DateTimeOption): TimeOption => {
  if (d.type === "date") {
    throw new Error("Expected timeSlot but got date instead");
  }
  return d;
};
