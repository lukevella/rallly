import dayjs from "dayjs";

export interface DateGroup {
  /**
   * Date key in YYYY-MM-DD format
   */
  date: string;
  /**
   * Display formatted date (e.g., "Tuesday, December 2")
   */
  displayDate: string;
  /**
   * All time slot options for this date
   */
  options: TimeSlotOption[];
}

export interface TimeSlotOption {
  optionId: string;
  startTime: Date;
  endTime: Date;
  duration: number;
}

/**
 * Groups poll options by date for row-per-date layout
 * @param options - Array of poll options with id, startTime, and duration
 * @returns Array of DateGroup objects sorted by date
 */
export function groupOptionsByDate(
  options: Array<{ id: string; startTime: Date; duration: number }>,
): DateGroup[] {
  const groups = new Map<string, DateGroup>();

  for (const option of options) {
    const dateKey = dayjs(option.startTime).format("YYYY-MM-DD");

    let group = groups.get(dateKey);
    if (!group) {
      group = {
        date: dateKey,
        displayDate: dayjs(option.startTime).format("dddd, LL"),
        options: [],
      };
      groups.set(dateKey, group);
    }

    group.options.push({
      optionId: option.id,
      startTime: option.startTime,
      endTime: new Date(option.startTime.getTime() + option.duration * 60000),
      duration: option.duration,
    });
  }

  return Array.from(groups.values()).sort((a, b) =>
    a.date.localeCompare(b.date),
  );
}
