"use client";

import { StatCardDetail } from "@/components/stat-card";
import { Trans } from "@/i18n/client";
import { useDateTimeConfig } from "@/lib/datetime/client";
import { formatRelativeDays } from "@/lib/datetime/format";
import type { DateInput } from "@/lib/datetime/types";
import { useHydrated } from "@/lib/datetime/use-hydrated";
import {
  calendarDateToUTCMidnight,
  getCalendarDate,
} from "@/lib/datetime/utils";

const DAY_MS = 24 * 60 * 60 * 1000;

// Intl.RelativeTimeFormat returns "tomorrow"; the badge starts a phrase, so
// match the capitalized "Today".
function capitalize(text: string, locale: string) {
  return text.charAt(0).toLocaleUpperCase(locale) + text.slice(1);
}

// Calendar days, not elapsed time, so an event tomorrow morning reads
// "tomorrow" rather than "in 14 hours". All-day and floating events are
// stored as UTC wall time; fixed instants fall on the viewer's day.
export function NextEventDetail({
  start,
  allDay,
  timeZone,
}: {
  start: DateInput;
  allDay: boolean;
  timeZone: string | null;
}) {
  const hydrated = useHydrated();
  const config = useDateTimeConfig();
  const viewerTimeZone = config.timeZone;

  if (!hydrated || !viewerTimeZone) {
    return null;
  }

  const eventDay = getCalendarDate(
    new Date(start),
    allDay || timeZone === null ? "UTC" : viewerTimeZone,
  );
  const today = getCalendarDate(new Date(), viewerTimeZone);
  const days = Math.round(
    (calendarDateToUTCMidnight(eventDay).getTime() -
      calendarDateToUTCMidnight(today).getTime()) /
      DAY_MS,
  );

  return (
    <StatCardDetail>
      <span className="sr-only">
        <Trans i18nKey="homeNextEvent" defaults="Next event" />{" "}
      </span>
      {days <= 0 ? (
        <Trans i18nKey="today" defaults="Today" />
      ) : (
        capitalize(formatRelativeDays(days, config.locale), config.locale)
      )}
    </StatCardDetail>
  );
}
