import { wallTimeToInstant } from "@/lib/datetime/wall-time";

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
    ? new Date(value)
    : wallTimeToInstant(value, timeZone ?? "UTC");

export const parseStartTime = (
  startTime: string,
  timeZone: string | undefined,
  duration: number,
): TimeSlot => ({
  startTime: parseDateTimeInTimeZone(startTime, timeZone),
  duration,
});

// Safety bound against unbounded input: the API accepts any two valid dates, so
// without this a range like 1900-9999 would iterate millions of days.
export const MAX_SLOT_GENERATION_DAYS = 366;

const MINUTE_MS = 60_000;
const DAY_MS = 24 * 60 * MINUTE_MS;

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

  // Iterate calendar dates as UTC midnights so no zone can shift them.
  const startDay = Date.parse(generator.startDate.slice(0, 10));
  const endDay = Date.parse(generator.endDate.slice(0, 10));

  const zone = timeZone ?? "UTC";
  const results: Array<TimeSlot> = [];
  let daysVisited = 0;

  for (let cursor = startDay; cursor <= endDay; cursor += DAY_MS) {
    if (daysVisited >= MAX_SLOT_GENERATION_DAYS) {
      break;
    }
    daysVisited++;
    const day = new Date(cursor);
    const date = day.toISOString().slice(0, 10);
    // The cursor's UTC date is the calendar date itself, so its weekday is
    // the same in every zone.
    if (!allowed.has(day.getUTCDay())) {
      continue;
    }
    const windowStart = wallTimeToInstant(
      `${date}T${generator.fromTime}`,
      zone,
    ).getTime();
    const windowEnd = wallTimeToInstant(
      `${date}T${generator.toTime}`,
      zone,
    ).getTime();
    if (!(windowEnd > windowStart)) {
      continue;
    }

    const duration = durationMinutes;
    const interval = generator.interval ?? durationMinutes;
    const totalMinutes = (windowEnd - windowStart) / MINUTE_MS;

    // A non-positive (or NaN) interval would never advance the loop below.
    if (!(duration > 0) || !(interval > 0)) {
      continue;
    }

    for (
      let offset = 0;
      offset + duration <= totalMinutes;
      offset += interval
    ) {
      results.push({
        startTime: new Date(windowStart + offset * MINUTE_MS),
        duration,
      });
    }
  }

  return results;
};
