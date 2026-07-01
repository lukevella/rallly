import type { TimeFormat } from "@rallly/database";
import type { DateInput, DateTimePreset } from "@/lib/localization/format";
import { formatDateTime, formatDateTimeRange } from "@/lib/localization/format";
import { getLocaleDefaults } from "@/lib/localization/locales";
import { toISO } from "./utils";

export type TimeProps = {
  value: DateInput;
  preset?: DateTimePreset;
  locale: string;
  timeFormat?: TimeFormat;
  /** Fixed display zone (an event's zone, or "UTC" for all-day). Omit for the runtime zone. */
  timeZone?: string;
  className?: string;
};

export function Time({
  value,
  preset = "time",
  locale,
  timeFormat,
  timeZone,
  className,
}: TimeProps) {
  return (
    <time dateTime={toISO(value)} className={className}>
      {formatDateTime(value, preset, {
        locale,
        timeFormat: timeFormat ?? getLocaleDefaults(locale).timeFormat,
        timeZone,
      })}
    </time>
  );
}

export type TimeRangeProps = {
  start: DateInput;
  end: DateInput;
  preset?: DateTimePreset;
  locale: string;
  timeFormat?: TimeFormat;
  timeZone?: string;
  className?: string;
};

export function TimeRange({
  start,
  end,
  preset = "time",
  locale,
  timeFormat,
  timeZone,
  className,
}: TimeRangeProps) {
  return (
    <span className={className}>
      {formatDateTimeRange(start, end, preset, {
        locale,
        timeFormat: timeFormat ?? getLocaleDefaults(locale).timeFormat,
        timeZone,
      })}
    </span>
  );
}
