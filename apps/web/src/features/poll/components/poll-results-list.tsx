"use client";

import { cn } from "@rallly/ui";
import * as React from "react";
import { PollResultsCell } from "@/features/poll/components/poll-results-cell";
import type { PollResultOption } from "@/features/poll/types";
import {
  classifyOptions,
  getOptionAvailability,
  groupOptionsByDate,
} from "@/features/poll/utils";
import { Trans, useTranslation } from "@/i18n/client";
import { useDateTime, useDateTimeConfig } from "@/lib/datetime/client";
import { useHydrated } from "@/lib/datetime/use-hydrated";

export function PollResultsList({
  kind,
  options,
  participantCount,
  timeZone,
}: {
  kind: "date" | "time";
  options: PollResultOption[];
  participantCount: number;
  timeZone: string | null;
}) {
  const { t } = useTranslation();
  const config = useDateTimeConfig();
  const { formatDateTime, formatDateTimeRange } = useDateTime();
  // Intl output differs between Node and browsers, so labels wait for hydration.
  const hydrated = useHydrated();
  // All-day and floating options are stored as UTC wall time; zoned polls
  // follow the viewer, matching the grid.
  const displayZone =
    kind === "time" && timeZone ? (config.timeZone ?? "UTC") : "UTC";

  const states = React.useMemo(() => classifyOptions(options), [options]);
  const groups = React.useMemo(
    () => groupOptionsByDate({ options, timeZone: displayZone }),
    [options, displayZone],
  );

  return (
    <div className="relative min-h-0 overflow-auto">
      <table
        aria-label={t("pollResultsTableLabel", { defaultValue: "Results" })}
        className="w-full border-collapse"
      >
        <thead>
          <tr>
            <th
              scope="col"
              className="sticky top-0 z-10 border-b bg-card px-4 py-3 text-left font-medium text-xs"
            >
              <Trans i18nKey="pollResultsDate" defaults="Date" />
            </th>
            {kind === "time" ? (
              <th
                scope="col"
                className="sticky top-0 z-10 border-b bg-card px-4 py-3 text-left font-medium text-xs"
              >
                <Trans i18nKey="pollResultsTime" defaults="Time" />
              </th>
            ) : null}
            <th
              scope="col"
              className="sticky top-0 z-10 w-28 border-b border-l bg-card px-4 py-3 text-center font-medium text-xs"
            >
              <Trans
                i18nKey="pollResultsAvailability"
                defaults="Availability"
              />
            </th>
          </tr>
        </thead>
        {groups.map((group) => {
          const dateLabel = hydrated
            ? formatDateTime(
                group.options[0]?.startTime ?? new Date(0),
                "weekdayMonthDayShort",
                { timeZone: displayZone },
              )
            : "\u00a0";
          return (
            <tbody key={group.dateKey} className="border-b last:border-b-0">
              {group.options.map((option, index) => {
                const timeLabel =
                  kind === "time"
                    ? hydrated
                      ? formatDateTimeRange(
                          option.startTime,
                          new Date(
                            option.startTime.getTime() +
                              option.duration * 60_000,
                          ),
                          "time",
                          { timeZone: displayZone },
                        )
                      : "\u00a0"
                    : undefined;
                return (
                  <tr key={option.id} className={cn(index > 0 && "border-t")}>
                    {index === 0 ? (
                      <th
                        scope="rowgroup"
                        rowSpan={group.options.length}
                        className={cn(
                          "whitespace-nowrap px-4 text-left align-top font-medium text-xs",
                          kind === "time" && "border-r",
                        )}
                      >
                        {/* Matches a result row's height so the date lines up with its first time */}
                        <div className="flex h-14 items-center">
                          {dateLabel}
                        </div>
                      </th>
                    ) : null}
                    {timeLabel !== undefined ? (
                      <td className="whitespace-nowrap px-4 text-muted-foreground text-xs tabular-nums">
                        {timeLabel}
                      </td>
                    ) : null}
                    <PollResultsCell
                      label={
                        hydrated
                          ? [dateLabel, timeLabel].filter(Boolean).join(", ")
                          : undefined
                      }
                      state={states.get(option.id) ?? "normal"}
                      available={getOptionAvailability(option)}
                      total={participantCount}
                      className="w-28 border-l"
                    />
                  </tr>
                );
              })}
            </tbody>
          );
        })}
      </table>
    </div>
  );
}
