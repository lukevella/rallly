import type { CalendarPreset, DateInput } from "@/lib/datetime/format";
import { formatCalendarDate } from "@/lib/datetime/format";
import { toISODate } from "./utils";

// No `timeZone` prop by design: a calendar date has no zone, so it must not be
// converted or it would drift a day.
export type DateValueProps = {
  value: DateInput;
  preset?: CalendarPreset;
  locale: string;
  className?: string;
};

export function DateValue({
  value,
  preset = "date",
  locale,
  className,
}: DateValueProps) {
  return (
    <time dateTime={toISODate(value)} className={className}>
      {formatCalendarDate(value, preset, locale)}
    </time>
  );
}
