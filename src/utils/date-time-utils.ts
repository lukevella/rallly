import { Option } from "@prisma/client";
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _timeFormat: string, // TODO (Luke Vella) [2022-06-28]: Need to pass timeFormat so that we recalculate the options when timeFormat changes. There is definitely a better way to do this
):
  | { pollType: "date"; options: ParsedDateOption[] }
  | { pollType: "timeSlot"; options: ParsedTimeSlotOption[] } => {
  const pollType = isTimeSlot(options[0].value) ? "timeSlot" : "date";

  if (pollType === "timeSlot") {
    return {
      pollType,
      options: options.map((option) =>
        parseTimeSlotOption(option, timeZone, targetTimeZone),
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
  const date = dayjs(dateString);
  return {
    type: "date",
    optionId: option.id,
    day: date.format("D"),
    dow: date.format("ddd"),
    month: date.format("MMM"),
    year: date.format("YYYY"),
  };
};

const parseTimeSlotOption = (
  option: Option,
  timeZone: string | null,
  targetTimeZone: string,
): ParsedTimeSlotOption => {
  const [start, end] = option.value.split("/");

  const startDate =
    timeZone && targetTimeZone
      ? dayjs(start).tz(timeZone, true).tz(targetTimeZone)
      : dayjs(start);
  const endDate =
    timeZone && targetTimeZone
      ? dayjs(end).tz(timeZone, true).tz(targetTimeZone)
      : dayjs(end);

  return {
    type: "timeSlot",
    optionId: option.id,
    startTime: startDate.format("LT"),
    endTime: endDate.format("LT"),
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
