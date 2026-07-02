"use client";

import { cn } from "@rallly/ui";
import { Button } from "@rallly/ui/button";
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import * as React from "react";

import {
  EmptyState,
  EmptyStateDescription,
  EmptyStateIcon,
  EmptyStateTitle,
} from "@/components/empty-state";
import { useHeadlessDatePicker } from "@/components/headless-date-picker";
import { Trans, useTranslation } from "@/i18n/client";
import { dayjs } from "@/lib/dayjs";

import {
  AvailabilityCount,
  getHeatOpacity,
  VoteBreakdown,
} from "./availability";
import type { CalendarOption } from "./use-poll-calendar";
import { getDayBestOption, usePollCalendar } from "./use-poll-calendar";

export function MonthView() {
  const { t } = useTranslation();
  const data = usePollCalendar();
  const { optionsByDay, highScore, participantCount } = data;

  const [navigationDate, setNavigationDate] = React.useState(
    () => data.firstOptionDate ?? new Date(),
  );
  const [selectedDay, setSelectedDay] = React.useState<string | null>(
    () => data.dayKeys[0] ?? null,
  );

  const datepicker = useHeadlessDatePicker({
    selection: data.selectionDates,
    date: navigationDate,
    onNavigationChange: setNavigationDate,
  });

  const selectedOptions = selectedDay ? optionsByDay[selectedDay] : undefined;

  return (
    <div className="md:flex">
      <div className="shrink-0 border-b p-3 sm:p-4 md:w-[360px] md:border-r md:border-b-0">
        <div className="mb-3 flex items-center justify-center gap-4">
          <Button
            size="icon"
            title={t("previousMonth")}
            onClick={datepicker.prev}
          >
            <ChevronLeftIcon />
          </Button>
          <div className="grow text-center font-semibold tracking-tight">
            {datepicker.label}
          </div>
          <Button size="icon" title={t("nextMonth")} onClick={datepicker.next}>
            <ChevronRightIcon />
          </Button>
        </div>
        <div className="grid grid-cols-7">
          {datepicker.daysOfWeek.map((dayOfWeek) => (
            <div
              key={dayOfWeek}
              className="flex items-center justify-center pb-2 font-medium text-muted-foreground text-sm"
            >
              {dayOfWeek.substring(0, 2)}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 overflow-hidden rounded-lg border shadow-xs">
          {datepicker.days.map((day, i) => {
            const dayKey = dayjs(day.date).format("YYYY-MM-DD");
            const options = optionsByDay[dayKey];
            const best = options ? getDayBestOption(options) : undefined;
            const isSelected = selectedDay === dayKey;

            return (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: fixed grid layout
                key={i}
                className={cn("relative h-16", {
                  "border-r": (i + 1) % 7 !== 0,
                  "border-b": i < datepicker.days.length - 7,
                })}
              >
                {best ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDay(dayKey);
                      if (day.outOfMonth) {
                        if (i < 7) {
                          datepicker.prev();
                        } else {
                          datepicker.next();
                        }
                      }
                    }}
                    className={cn(
                      "group relative flex h-full w-full flex-col items-center justify-center gap-0.5 rounded-none focus:z-10 focus:outline-hidden",
                      { "opacity-60": day.outOfMonth },
                    )}
                  >
                    <span
                      aria-hidden
                      className="absolute inset-1 rounded-md bg-emerald-500 dark:bg-emerald-400"
                      style={{
                        opacity:
                          getHeatOpacity(best.available, highScore) * 0.35,
                      }}
                    />
                    <span
                      aria-hidden
                      className={cn(
                        "absolute inset-1 rounded-md border-2",
                        isSelected
                          ? "border-emerald-500"
                          : "border-transparent group-hover:border-emerald-500/40",
                      )}
                    />
                    <span
                      className={cn(
                        "z-10 font-semibold text-sm",
                        day.today && "text-rose-500",
                      )}
                    >
                      {day.day}
                    </span>
                    <AvailabilityCount
                      available={best.available}
                      ifNeedBe={best.ifNeedBe}
                      showIcon={false}
                      className="z-10 text-emerald-700 dark:text-emerald-300"
                    />
                  </button>
                ) : (
                  <div
                    className={cn(
                      "flex h-full w-full items-start justify-center px-2 py-1.5 text-sm",
                      day.isPast
                        ? "text-muted-foreground/60"
                        : "text-muted-foreground",
                      day.outOfMonth && "opacity-50",
                    )}
                  >
                    <span className={cn(day.today && "text-rose-500")}>
                      {day.day}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <Button className="mt-3 w-full" onClick={datepicker.today}>
          {t("today")}
        </Button>
      </div>
      <div className="min-w-0 grow p-3 sm:p-4">
        {selectedDay && selectedOptions ? (
          <DayDetails
            dayKey={selectedDay}
            options={selectedOptions}
            participantCount={participantCount}
          />
        ) : (
          <div className="flex h-full items-center justify-center py-12">
            <EmptyState>
              <EmptyStateIcon>
                <CalendarIcon />
              </EmptyStateIcon>
              <EmptyStateTitle>
                <Trans
                  i18nKey="pollCalendarSelectDateTitle"
                  defaults="No date selected"
                />
              </EmptyStateTitle>
              <EmptyStateDescription>
                <Trans
                  i18nKey="pollCalendarSelectDateDescription"
                  defaults="Click a highlighted date to see who's available"
                />
              </EmptyStateDescription>
            </EmptyState>
          </div>
        )}
      </div>
    </div>
  );
}

function DayDetails({
  dayKey,
  options,
  participantCount,
}: {
  dayKey: string;
  options: CalendarOption[];
  participantCount: number;
}) {
  const date = dayjs(`${dayKey}T12:00:00`);
  return (
    <div>
      <h3 className="mb-3 font-semibold text-sm">{date.format("dddd, LL")}</h3>
      <ul className="space-y-2">
        {options.map((option) => (
          <li
            key={option.optionId}
            className="flex items-center justify-between gap-3 rounded-lg border p-3"
          >
            <div className="min-w-0">
              <div className="font-medium text-sm">
                {option.duration > 0 ? (
                  `${option.start.format("LT")} – ${option.end.format("LT")}`
                ) : (
                  <Trans i18nKey="allDay" defaults="All day" />
                )}
              </div>
              <div className="mt-1">
                <VoteBreakdown
                  yes={option.yes}
                  ifNeedBe={option.ifNeedBe}
                  no={option.no}
                />
              </div>
            </div>
            <div className="shrink-0 text-right">
              <AvailabilityCount
                available={option.available}
                ifNeedBe={option.ifNeedBe}
                className="text-emerald-700 dark:text-emerald-300"
              />
              <div className="text-muted-foreground text-xs">
                <Trans
                  i18nKey="pollCalendarAvailableOfTotal"
                  defaults="of {total}"
                  values={{ total: participantCount }}
                />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
