"use client";

import { useDateTimeConfig } from "@/lib/datetime/client";
import type { DateInput, DatePreset } from "@/lib/datetime/format";
import { formatDate } from "@/lib/datetime/format";
import { toISODate } from "./utils";

export type CalendarDateProps = {
  value: DateInput;
  preset?: DatePreset;
  className?: string;
};

/** A zone-less calendar date (all-day events, stored as UTC midnight). */
export function CalendarDate({
  value,
  preset = "dateLong",
  className,
}: CalendarDateProps) {
  const { locale } = useDateTimeConfig();
  return (
    <time dateTime={toISODate(value)} className={className}>
      {formatDate(value, { preset, locale })}
    </time>
  );
}
