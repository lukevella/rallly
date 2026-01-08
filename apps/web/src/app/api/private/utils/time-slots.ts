import dayjs from "dayjs";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isSameOrBefore);

export type SlotGeneratorInput = {
  startDate: string;
  endDate: string;
  daysOfWeek: Array<"mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun">;
  fromTime: string;
  toTime: string;
  interval?: number;
};

export type TimeSlot = {
  startTime: Date;
  duration: number;
};

export const dedupeTimeSlots = (slots: Array<TimeSlot>) => {
  const unique = new Map<string, TimeSlot>();
  for (const slot of slots) {
    unique.set(`${slot.startTime.getTime()}:${slot.duration}`, slot);
  }
  return Array.from(unique.values());
};

const hasTzOffset = (value: string) =>
  /[zZ]$|[+-]\d{2}:\d{2}$|[+-]\d{4}$/.test(value);

const parseDateTimeInTimeZone = (value: string, timeZone?: string) =>
  hasTzOffset(value)
    ? dayjs(value)
    : timeZone
      ? dayjs(value).tz(timeZone, true)
      : dayjs(value).utc(true);

const parseLocalDateTimeInTimeZone = (
  date: string,
  time: string,
  timeZone: string | undefined,
) =>
  timeZone
    ? dayjs(`${date}T${time}`).tz(timeZone, true)
    : dayjs(`${date}T${time}`).utc(true);

export const parseStartTime = (
  startTime: string,
  timeZone: string | undefined,
  duration: number,
): TimeSlot => ({
  startTime: parseDateTimeInTimeZone(startTime, timeZone).toDate(),
  duration,
});

export const generateTimeSlots = (
  generator: SlotGeneratorInput,
  timeZone: string | undefined,
  durationMinutes: number,
): Array<TimeSlot> => {
  const dayMap: Record<SlotGeneratorInput["daysOfWeek"][number], number> = {
    sun: 0,
    mon: 1,
    tue: 2,
    wed: 3,
    thu: 4,
    fri: 5,
    sat: 6,
  };

  const allowed = new Set(generator.daysOfWeek.map((d) => dayMap[d]));

  const startDay = timeZone
    ? dayjs(generator.startDate).tz(timeZone, true).startOf("day")
    : dayjs(generator.startDate).utc(true).startOf("day");
  const endDay = timeZone
    ? dayjs(generator.endDate).tz(timeZone, true).startOf("day")
    : dayjs(generator.endDate).utc(true).startOf("day");

  const from = parseLocalDateTimeInTimeZone(
    generator.startDate,
    generator.fromTime,
    timeZone,
  );
  const to = parseLocalDateTimeInTimeZone(
    generator.startDate,
    generator.toTime,
    timeZone,
  );
  if (!to.isAfter(from)) {
    return [];
  }

  const results: Array<TimeSlot> = [];

  for (
    let cursor = startDay;
    cursor.isSameOrBefore(endDay, "day");
    cursor = cursor.add(1, "day")
  ) {
    if (!allowed.has(cursor.day())) {
      continue;
    }

    const date = cursor.format("YYYY-MM-DD");
    const windowStart = parseLocalDateTimeInTimeZone(
      date,
      generator.fromTime,
      timeZone,
    );
    const windowEnd = parseLocalDateTimeInTimeZone(
      date,
      generator.toTime,
      timeZone,
    );
    if (!windowEnd.isAfter(windowStart)) {
      continue;
    }

    const duration = durationMinutes;
    const interval = generator.interval ?? durationMinutes;
    const totalMinutes = windowEnd.diff(windowStart, "minute");

    for (
      let offset = 0;
      offset + duration <= totalMinutes;
      offset += interval
    ) {
      const t = windowStart.add(offset, "minute");
      results.push({
        startTime: t.toDate(),
        duration,
      });
    }
  }

  return dedupeTimeSlots(results);
};
