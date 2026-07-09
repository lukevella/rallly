"use client";

import { useDateTimeConfig } from "@/lib/datetime/client";
import { formatRelativeTime } from "@/lib/datetime/format";
import type { DateInput } from "@/lib/datetime/types";
import { useHydrated } from "@/lib/datetime/use-hydrated";
import { toISO } from "./utils";

export type RelativeTimeProps = {
  value: DateInput;
  /** Override the viewer's locale. */
  locale?: string;
  className?: string;
};

export function RelativeTime({ value, locale, className }: RelativeTimeProps) {
  const hydrated = useHydrated();
  const config = useDateTimeConfig();
  return (
    <time dateTime={toISO(value)} className={className}>
      {hydrated ? formatRelativeTime(value, locale ?? config.locale) : " "}
    </time>
  );
}
