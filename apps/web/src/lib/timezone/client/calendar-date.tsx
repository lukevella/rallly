"use client";

import { useTranslation } from "@/i18n/client";
import { dayjs } from "@/lib/dayjs";
import { useTimezone } from "@/lib/timezone/client/context";

export function CalendarDate({ date }: { date: string }) {
  const { timezone } = useTimezone();

  const { t } = useTranslation();
  return (
    <time dateTime={dayjs(date).toISOString()}>
      {dayjs(date)
        .tz(timezone)
        .calendar(null, {
          sameDay: `[${t("today", { defaultValue: "Today" })}]`,
          nextDay: `[${t("tomorrow", { defaultValue: "Tomorrow" })}]`,
          nextWeek: "dddd",
          lastDay: `[${t("yesterday", { defaultValue: "Yesterday" })}]`,
          lastWeek: `[${t("lastWeek", { defaultValue: "Last Week" })}]`,
          sameElse: "DD MMM YYYY",
        })}
    </time>
  );
}
