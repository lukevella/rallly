import dayjs from "dayjs";

import { supportedTimeZones } from "@/utils/supported-time-zones";

import {
  DateTimeOption,
  TimeOption,
} from "../components/forms/poll-options-form";

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
  const timeZone = dayjs.tz.guess();
  return normalizeTimeZone(timeZone);
}

function getTimeZoneOffset(timeZone: string) {
  try {
    return dayjs().tz(timeZone).utcOffset();
  } catch (e) {
    console.error(`Failed to resolve timezone ${timeZone}`);
    return 0;
  }
}

function isFixedOffsetTimeZone(timeZone: string) {
  return (
    timeZone.toLowerCase().startsWith("etc") ||
    timeZone.toLowerCase().startsWith("gmt") ||
    timeZone.toLowerCase().startsWith("utc")
  );
}

/**
 * Given a timezone, this function returns a normalized timezone
 * that is supported by the application. If the timezone is not
 * recognized, it will return a timezone in the same continent
 * with the same offset.
 * @param timeZone
 * @returns
 */
export function normalizeTimeZone(timeZone: string) {
  let tz = supportedTimeZones.find((tz) => tz === timeZone);

  if (tz) {
    return tz;
  }

  const timeZoneOffset = getTimeZoneOffset(timeZone);

  if (!isFixedOffsetTimeZone(timeZone)) {
    // Find a timezone in the same continent with the same offset
    const [continent] = timeZone.split("/");
    const sameContinentTimeZones = supportedTimeZones.filter((tz) =>
      tz.startsWith(continent),
    );
    tz = sameContinentTimeZones.find((tz) => {
      return dayjs().tz(tz, true).utcOffset() === timeZoneOffset;
    });
  }

  if (!tz) {
    tz = supportedTimeZones.find((tz) => {
      return getTimeZoneOffset(tz) === timeZoneOffset;
    })!; // We assume there has to be a timezone with the same offset
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
