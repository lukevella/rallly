import { Option, TimeFormat } from "@rallly/database";
import dayjs from "dayjs";

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
  date: Date;
  optionId: string;
  day: string;
  dow: string;
  month: string;
  year: string;
}

export interface ParsedTimeSlotOption {
  type: "timeSlot";
  optionId: string;
  date: Date;
  day: string;
  dow: string;
  month: string;
  startTime: string;
  endTime: string;
  duration: string;
  year: string;
}

export type ParsedDateTimeOpton = ParsedDateOption | ParsedTimeSlotOption;

const isTimeSlot = (value: string) => value.indexOf("/") !== -1;

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

export const decodeOptions = (
  options: Option[],
  timeZone: string | null,
  targetTimeZone: string,
  timeFormat: TimeFormat, // TODO (Luke Vella) [2022-06-28]: Need to pass timeFormat so that we recalculate the options when timeFormat changes. There is definitely a better way to do this
):
  | { pollType: "date"; options: ParsedDateOption[] }
  | { pollType: "timeSlot"; options: ParsedTimeSlotOption[] } => {
  const pollType = options.some(({ duration }) => duration > 0)
    ? "timeSlot"
    : "date";

  if (pollType === "timeSlot") {
    return {
      pollType,
      options: options.map((option) =>
        parseTimeSlotOption(option, timeZone, targetTimeZone, timeFormat),
      ),
    };
  } else {
    return {
      pollType,
      options: options.map((option) => parseDateOption(option)),
    };
  }
};

export const parseDateOption = (option: Option): ParsedDateOption => {
  const date = dayjs(option.start).utc();
  return {
    type: "date",
    date: date.toDate(),
    optionId: option.id,
    day: date.format("D"),
    dow: date.format("ddd"),
    month: date.format("MMM"),
    year: date.format("YYYY"),
  };
};

export const parseTimeSlotOption = (
  option: Option,
  timeZone: string | null,
  targetTimeZone: string,
  timeFormat: TimeFormat,
): ParsedTimeSlotOption => {
  const adjustTimeZone = (date: Date | dayjs.Dayjs) => {
    return timeZone && targetTimeZone
      ? dayjs(date).utc().tz(timeZone, true).tz(targetTimeZone)
      : dayjs(date).utc();
  };
  const startDate = adjustTimeZone(option.start);

  const endDate = adjustTimeZone(
    dayjs(option.start).add(option.duration, "minute"),
  );

  return {
    type: "timeSlot",
    optionId: option.id,
    date: startDate.toDate(),

    startTime: startDate.format(timeFormat === "hours12" ? "h:mm A" : "HH:mm"),
    endTime: endDate.format(timeFormat === "hours12" ? "h:mm A" : "HH:mm"),
    day: startDate.format("D"),
    dow: startDate.format("ddd"),
    month: startDate.format("MMM"),
    duration: getDuration(startDate, endDate),
    year: startDate.format("YYYY"),
  };
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

export const parseValue = (value: string): DateTimeOption => {
  if (isTimeSlot(value)) {
    const [start, end] = value.split("/");
    return {
      type: "timeSlot",
      start,
      end,
    };
  } else {
    return {
      type: "date",
      date: value,
    };
  }
};
