"use client";

import type { VoteType } from "@rallly/database";
import { cn } from "@rallly/ui";
import { Button } from "@rallly/ui/button";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import * as React from "react";

import { Trans, useTranslation } from "@/i18n/client";
import { dayjs } from "@/lib/dayjs";

import { useOptionVote } from "../use-option-vote";
import VoteIcon from "../vote-icon";
import { useVotingForm } from "../voting-form";
import { AvailabilityCount, getHeatOpacity } from "./availability";
import { DayDetail } from "./option-detail";
import type { CalendarOption } from "./use-poll-calendar";
import { usePollCalendar } from "./use-poll-calendar";

export function WeekView() {
  const { t } = useTranslation();
  const data = usePollCalendar();
  const { optionsByDay, highScore } = data;

  const votingForm = useVotingForm();
  const isEditing = votingForm.watch("mode") !== "view";

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
            <div
              key={dayKey}
              className={cn(
                "flex min-h-32 flex-col rounded-lg border transition-colors",
                isWeekend && "bg-muted/30",
                selectedDay === dayKey &&
                  "border-emerald-500 ring-1 ring-emerald-500",
              )}
            >
              <button
                type="button"
                className="w-full"
                onClick={() => setSelectedDay(dayKey)}
              >
                {header}
              </button>
              <div className="flex grow flex-col gap-1.5 p-1.5">
                {options.map((option) =>
                  isEditing ? (
                    <EditableOptionCard key={option.optionId} option={option} />
                  ) : (
                    <OptionCard
                      key={option.optionId}
                      option={option}
                      highScore={highScore}
                      onSelect={() => setSelectedDay(dayKey)}
                    />
                  ),
                )}
              </div>
            </div>
          );
        })}
      </div>
      {!isEditing && selectedDay && optionsByDay[selectedDay] ? (
        <div className="mt-4 border-t pt-4">
          <DayDetail dayKey={selectedDay} options={optionsByDay[selectedDay]} />
        </div>
      ) : null}
    </div>
  );
}

function OptionTime({ option }: { option: CalendarOption }) {
  return option.duration > 0 ? (
    <span>{option.start.format("LT")}</span>
  ) : (
    <Trans i18nKey="allDay" defaults="All day" />
  );
}

function OptionCard({
  option,
  highScore,
  onSelect,
}: {
  option: CalendarOption;
  highScore: number;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="relative overflow-hidden rounded-md border bg-card p-2 text-left ring-offset-background focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-1 bg-emerald-500 dark:bg-emerald-400"
        style={{ opacity: getHeatOpacity(option.available, highScore) }}
      />
      <div className="pl-1.5">
        <div className="font-medium text-xs">
          <OptionTime option={option} />
        </div>
        <AvailabilityCount
          available={option.available}
          ifNeedBe={option.ifNeedBe}
          className="mt-1 text-emerald-700 dark:text-emerald-300"
        />
      </div>
    </button>
  );
}

const voteCardClass: Record<"yes" | "ifNeedBe" | "no" | "pending", string> = {
  yes: "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
  ifNeedBe:
    "border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
  no: "border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-300",
  pending: "border-dashed bg-card text-muted-foreground hover:border-primary",
};

function EditableOptionCard({ option }: { option: CalendarOption }) {
  const { vote, cycle } = useOptionVote(option.optionId);
  const style: VoteType | "pending" = vote ?? "pending";

  return (
    <button
      type="button"
      data-testid="poll-option"
      onClick={(e) => {
        e.stopPropagation();
        cycle();
      }}
      className={cn(
        "flex items-center justify-between gap-2 rounded-md border p-2 text-left font-medium text-xs ring-offset-background transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        voteCardClass[style],
      )}
    >
      <OptionTime option={option} />
      <VoteIcon type={vote} />
    </button>
  );
}
