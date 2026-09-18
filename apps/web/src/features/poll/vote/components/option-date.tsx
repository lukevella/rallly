"use client";
import { useDateTimeConfig } from "@/lib/datetime/client";
import { formatWeekdayAndDate } from "@/lib/datetime/format";
import type { DateInput } from "@/lib/datetime/types";
import { useHydrated } from "@/lib/datetime/use-hydrated";
import { toISODate } from "@/lib/datetime/utils";

/**
 * A date option's label with the weekday in its own column, so weekdays
 * line up down the list. The locale decides which column comes first:
 * Hungarian and Chinese write the weekday after the date.
 */
export function OptionDate({ value }: { value: DateInput }) {
  const hydrated = useHydrated();
  const { locale } = useDateTimeConfig();

  // Intl output isn't stable across engines, so it can't be rendered on the
  // server; hold the row's height until hydration.
  if (!hydrated) {
    return <time dateTime={toISODate(value)}> </time>;
  }

  // All-day dates are stored as UTC wall time and read back in UTC. The
  // weekday is abbreviated: the date beside it carries the detail, and a
  // full name would not fit a narrow screen.
  const { weekday, date, weekdayFirst } = formatWeekdayAndDate(value, {
    locale,
    timeZone: "UTC",
    short: true,
  });

  return (
    <time
      dateTime={toISODate(value)}
      className="flex items-baseline gap-x-3 sm:grid sm:grid-cols-subgrid sm:gap-x-6 sm:[grid-column:span_2]"
    >
      {weekdayFirst ? (
        <>
          <span className="text-muted-foreground">{weekday}</span>
          <span>{date}</span>
        </>
      ) : (
        <>
          <span>{date}</span>
          <span className="text-muted-foreground">{weekday}</span>
        </>
      )}
    </time>
  );
}
