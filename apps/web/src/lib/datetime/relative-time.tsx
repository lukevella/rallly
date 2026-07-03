"use client";

import { useDateTimeConfig } from "@/lib/datetime/client";
import type { DateInput } from "@/lib/datetime/format";
import { formatRelativeTime } from "@/lib/datetime/format";
import { toISO } from "./utils";

export type RelativeTimeProps = {
  value: DateInput;
  /** Override the viewer's locale. */
  locale?: string;
  className?: string;
};

export function RelativeTime({ value, locale, className }: RelativeTimeProps) {
  const config = useDateTimeConfig();
  return (
    <time dateTime={toISO(value)} className={className}>
      {formatRelativeTime(value, locale ?? config.locale)}
    </time>
  );
}
