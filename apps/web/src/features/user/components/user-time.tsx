"use client";

import type { TimeProps, TimeRangeProps } from "@/components/datetime/time";
import { Time, TimeRange } from "@/components/datetime/time";
import { usePreferredTimeFormat } from "@/features/user/hooks/use-preferred-time-format";
import { useLocale } from "@/lib/locale/client";

// Renders a time in the user's locale and preferred time format. Pass `timeZone`
// to anchor to a specific zone (an event's zone, or "UTC"); omit for the runtime zone.
export function UserTime(props: Omit<TimeProps, "locale" | "timeFormat">) {
  const { locale } = useLocale();
  const timeFormat = usePreferredTimeFormat();
  return <Time {...props} locale={locale} timeFormat={timeFormat} />;
}

export function UserTimeRange(
  props: Omit<TimeRangeProps, "locale" | "timeFormat">,
) {
  const { locale } = useLocale();
  const timeFormat = usePreferredTimeFormat();
  return <TimeRange {...props} locale={locale} timeFormat={timeFormat} />;
}
