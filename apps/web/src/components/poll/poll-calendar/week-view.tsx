"use client";

import { cn } from "@rallly/ui";
import { Button } from "@rallly/ui/button";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import * as React from "react";

import { Trans, useTranslation } from "@/i18n/client";
import { dayjs } from "@/lib/dayjs";

import { AvailabilityCount, getHeatOpacity } from "./availability";
import { DayDetail } from "./option-detail";
import type { CalendarOption } from "./use-poll-calendar";
import { usePollCalendar } from "./use-poll-calendar";

export function WeekView() {
  const { t } = useTranslation();
  const data = usePollCalendar();
  const { optionsByDay, highScore } = data;

  const [anchor, setAnchor] = React.useState(
    () => data.firstOptionDate ?? new Date(),
  );
  const [selectedDay, setSelectedDay] = React.useState<string | null>(
    () => data.dayKeys[0] ?? null,
  );

  const weekStart = dayjs(anchor).startOf("week");
  const weekEnd = weekStart.add(6, "day");
  const days = Array.from({ length: 7 }, (_, i) => weekStart.add(i, "day"));

  const label =
    weekStart.month() === weekEnd.month()
      ? `${weekStart.format("MMM D")} – ${weekEnd.format("D, YYYY")}`
      : `${weekStart.format("MMM D")} – ${weekEnd.format("MMM D, YYYY")}`;

  return (
    <div className="p-3 sm:p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <Button
          size="icon"
          title={t("previousMonth")}
          onClick={() => setAnchor(weekStart.subtract(1, "week").toDate())}
        >
          <ChevronLeftIcon />
        </Button>
        <div className="grow text-center font-semibold tracking-tight">
          {label}
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setAnchor(new Date())}>{t("today")}</Button>
          <Button
            size="icon"
            title={t("nextMonth")}
            onClick={() => setAnchor(weekStart.add(1, "week").toDate())}
          >
            <ChevronRightIcon />
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-7">
        {days.map((day) => {
          const dayKey = day.format("YYYY-MM-DD");
          const options = optionsByDay[dayKey];
          const isToday = day.isSame(new Date(), "day");
          const isWeekend = day.day() === 0 || day.day() === 6;

          const header = (
            <div
              className={cn(
                "border-b px-2 py-1.5 text-center",
                isToday && "text-rose-500",
              )}
            >
              <div className="font-medium text-muted-foreground text-xs uppercase">
                {day.format("ddd")}
              </div>
              <div className="font-semibold text-sm">{day.format("D")}</div>
            </div>
          );

          if (!options) {
            return (
              <div
                key={dayKey}
                className={cn(
                  "flex min-h-32 flex-col rounded-lg border",
                  isWeekend && "bg-muted/30",
                )}
              >
                {header}
              </div>
            );
          }

          return (
            <button
              type="button"
              key={dayKey}
              onClick={() => setSelectedDay(dayKey)}
              className={cn(
                "flex min-h-32 flex-col rounded-lg border text-left transition-colors hover:border-emerald-500/40",
                isWeekend && "bg-muted/30",
                selectedDay === dayKey &&
                  "border-emerald-500 ring-1 ring-emerald-500",
              )}
            >
              {header}
              <div className="flex grow flex-col gap-1.5 p-1.5">
                {options.map((option) => (
                  <OptionCard
                    key={option.optionId}
                    option={option}
                    highScore={highScore}
                  />
                ))}
              </div>
            </button>
          );
        })}
      </div>
      {selectedDay && optionsByDay[selectedDay] ? (
        <div className="mt-4 border-t pt-4">
          <DayDetail dayKey={selectedDay} options={optionsByDay[selectedDay]} />
        </div>
      ) : null}
    </div>
  );
}

function OptionCard({
  option,
  highScore,
}: {
  option: CalendarOption;
  highScore: number;
}) {
  return (
    <div className="relative overflow-hidden rounded-md border bg-card p-2">
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-1 bg-emerald-500 dark:bg-emerald-400"
        style={{ opacity: getHeatOpacity(option.available, highScore) }}
      />
      <div className="pl-1.5">
        <div className="font-medium text-xs">
          {option.duration > 0 ? (
            option.start.format("LT")
          ) : (
            <Trans i18nKey="allDay" defaults="All day" />
          )}
        </div>
        <AvailabilityCount
          available={option.available}
          ifNeedBe={option.ifNeedBe}
          className="mt-1 text-emerald-700 dark:text-emerald-300"
        />
      </div>
    </div>
  );
}
