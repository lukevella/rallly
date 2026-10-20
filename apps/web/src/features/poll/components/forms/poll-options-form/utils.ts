import { getCalendarDate } from "@/lib/datetime/utils";
import {
  addMinutesToWallTime,
  instantToWallTime,
  wallTimeExists,
  wallTimeToInstant,
} from "@/lib/datetime/wall-time";
import { dayjs } from "@/lib/dayjs";
import type { DateTimeOption } from "./types";

/** A poll is all-day when every option is a whole-day date. */
export const isAllDay = (options: DateTimeOption[]) =>
  options.length > 0 && options.every((option) => option.type === "date");

/** All options in a poll need to be the same type. */
export const hasMixedOptionTypes = (options: DateTimeOption[]) =>
  options.some((option) => option.type !== options[0]?.type);

export const formatDateWithoutTime = (date: Date): string => {
  return dayjs(date).format("YYYY-MM-DD");
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

const TIME_STEP_MINUTES = 15;
const DAY_MINUTES = 24 * 60;

/**
 * Finds the next future, selectable 15-minute start on `date` in the poll's
 * zone. Returns null when the date is not today or no time remains that day.
 */
export function getNextAvailableTimeSlotStart({
  date,
  now,
  timeZone,
}: {
  date: string;
  now: Date;
  timeZone: string;
}) {
  if (getCalendarDate(now, timeZone) !== date) {
    return null;
  }

  const wallNow = instantToWallTime(now, timeZone);
  const currentMinutes =
    Number(wallNow.slice(11, 13)) * 60 + Number(wallNow.slice(14, 16));
  const firstCandidate =
    Math.floor(currentMinutes / TIME_STEP_MINUTES) * TIME_STEP_MINUTES +
    TIME_STEP_MINUTES;

  for (
    let minutes = firstCandidate;
    minutes < DAY_MINUTES;
    minutes += TIME_STEP_MINUTES
  ) {
    const candidate = addMinutesToWallTime(`${date}T00:00:00`, minutes);
    if (
      wallTimeExists(candidate, timeZone) &&
      wallTimeToInstant(candidate, timeZone).getTime() > now.getTime()
    ) {
      return candidate;
    }
  }
  return null;
}

/**
 * Wall-clock times a time picker offers, in 15 minute steps: the day of
 * `value`, or the 24 hours after `after`. Start times the poll's zone skips
 * when its clocks spring forward are left out; end times may fall in that
 * hour, and `value` itself always stays.
 */
export function getTimeOptions({
  value,
  after,
  timeZone,
}: {
  value: string;
  after?: string;
  timeZone?: string;
}) {
  const options: string[] = [];
  if (after) {
    for (let m = TIME_STEP_MINUTES; m <= DAY_MINUTES; m += TIME_STEP_MINUTES) {
      options.push(addMinutesToWallTime(after, m));
    }
  } else {
    const midnight = `${value.slice(0, 10)}T00:00:00`;
    for (let m = 0; m < DAY_MINUTES; m += TIME_STEP_MINUTES) {
      options.push(addMinutesToWallTime(midnight, m));
    }
  }
  if (after || !timeZone) {
    return options;
  }
  return options.filter(
    (option) => option === value || wallTimeExists(option, timeZone),
  );
}
