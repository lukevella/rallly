"use client";

import dayjs from "dayjs";
import calendar from "dayjs/plugin/calendar";
import localizedFormat from "dayjs/plugin/localizedFormat";
import timezone from "dayjs/plugin/timezone";
import { useTranslation } from "@/i18n/client";
import { useTimezone } from "@/lib/timezone/client/context";

dayjs.extend(calendar);
dayjs.extend(localizedFormat);
dayjs.extend(timezone);

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
