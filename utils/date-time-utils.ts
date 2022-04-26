import { Option } from "@prisma/client";
import {
  differenceInHours,
  differenceInMinutes,
  format,
  formatDuration,
  isSameDay,
  Locale,
} from "date-fns";
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

export interface ParsedDateOption {
  type: "date";
  optionId: string;
  day: string;
  dow: string;
  month: string;
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
}

export type ParsedDateTimeOpton = ParsedDateOption | ParsedTimeSlotOption;

const isTimeSlot = (value: string) => value.indexOf("/") !== -1;

const getDuration = (startTime: Date, endTime: Date) => {
  const hours = Math.floor(differenceInHours(endTime, startTime));
  const minutes = Math.floor(
    differenceInMinutes(endTime, startTime) - hours * 60,
  );
  return formatDuration({ hours, minutes });
};

export const decodeOptions = (
  options: Option[],
  timeZone: string | null,
  targetTimeZone: string,
  locale: Locale,
):
  | { pollType: "date"; options: ParsedDateOption[] }
  | { pollType: "timeSlot"; options: ParsedTimeSlotOption[] } => {
  const pollType = isTimeSlot(options[0].value) ? "timeSlot" : "date";

  if (pollType === "timeSlot") {
    return {
      pollType,
      options: options.map((option) =>
        parseTimeSlotOption(option, timeZone, targetTimeZone, locale),
      ),
    };
  } else {
    return {
      pollType,
      options: options.map((option) => parseDateOption(option)),
    };
  }
};

const parseDateOption = (option: Option): ParsedDateOption => {
  const dateString =
    option.value.indexOf("T") === -1
      ? // we add the time because otherwise Date will assume UTC time which might change the day for some time zones
        option.value + "T00:00:00"
      : option.value;
  const date = new Date(dateString);
  return {
    type: "date",
    optionId: option.id,
    day: format(date, "d"),
    dow: format(date, "E"),
    month: format(date, "MMM"),
  };
};

const parseTimeSlotOption = (
  option: Option,
  timeZone: string | null,
  targetTimeZone: string,
  locale: Locale,
): ParsedTimeSlotOption => {
  const localeFormatInTimezone = (
    date: Date,
    timezone: string,
    formatString: string,
  ) => {
    return formatInTimeZone(date, timezone, formatString, {
      locale,
    });
  };

  const [start, end] = option.value.split("/");
  if (timeZone && targetTimeZone) {
    const startDate = spacetime(start, timeZone).toNativeDate();
    const endDate = spacetime(end, timeZone).toNativeDate();
    return {
      type: "timeSlot",
      optionId: option.id,
      startTime: localeFormatInTimezone(startDate, targetTimeZone, "p"),
      endTime: localeFormatInTimezone(endDate, targetTimeZone, "p"),
      day: localeFormatInTimezone(startDate, targetTimeZone, "d"),
      dow: localeFormatInTimezone(startDate, targetTimeZone, "E"),
      month: localeFormatInTimezone(startDate, targetTimeZone, "MMM"),
      duration: getDuration(startDate, endDate),
    };
  } else {
    const startDate = new Date(start);
    const endDate = new Date(end);
    return {
      type: "timeSlot",
      optionId: option.id,
      startTime: format(startDate, "p"),
      endTime: format(endDate, "p"),
      day: format(startDate, "d"),
      dow: format(startDate, "E"),
      month: format(startDate, "MMM"),
      duration: getDuration(startDate, endDate),
    };
  }
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
    day: format(date, "d"),
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
