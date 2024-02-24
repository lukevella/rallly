import { TimeFormat } from "@rallly/database";
import dayjs from "dayjs";
import soft from "timezone-soft";

import { supportedTimeZones } from "@/utils/supported-time-zones";

import {
  DateTimeOption,
  TimeOption,
} from "../components/forms/poll-options-form";

type Option = { id: string; start: Date; duration: number };

export function parseIanaTimezone(timezone: string): {
  region: string;
  city: string;
} {
  const firstSlash = timezone.indexOf("/");
  const region = timezone.substring(0, firstSlash);
  const city = timezone.substring(firstSlash + 1).replaceAll("_", " ");

  return { region, city };
}

export function getBrowserTimeZone() {
  const res = soft(Intl.DateTimeFormat().resolvedOptions().timeZone)[0];
  return resolveGeographicTimeZone(res.iana);
}

export function resolveGeographicTimeZone(timezone: string) {
  const tz = supportedTimeZones.find((tz) => tz === timezone);

  if (!tz) {
    // find nearest timezone with the same offset
    const offset = dayjs().tz(timezone).utcOffset();
    return supportedTimeZones.find((tz) => {
      return dayjs().tz(tz, true).utcOffset() === offset;
    })!;
  }

  return tz;
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
  const adjustTimeZone = (date: string) => {
    if (!timeZone) {
      return dayjs(date);
    }

    return dayjs.tz(date, timeZone).tz(targetTimeZone);
  };

  const start = dayjs(option.start).utc().format("YYYY-MM-DD HH:mm");

  const startDate = adjustTimeZone(start);

  const endDate = adjustTimeZone(
    dayjs(start).add(option.duration, "minute").format("YYYY-MM-DD HH:mm"),
  );

  return {
    type: "timeSlot",
    optionId: option.id,
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
