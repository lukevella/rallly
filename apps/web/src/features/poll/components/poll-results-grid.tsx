"use client";

import { cn } from "@rallly/ui";
import * as React from "react";
import { PollResultsCell } from "@/features/poll/components/poll-results-cell";
import type { PollResultOption } from "@/features/poll/types";
import {
  buildTimeGrid,
  classifyOptions,
  getOptionAvailability,
  timeGridCellKey,
} from "@/features/poll/utils";
import { Trans, useTranslation } from "@/i18n/client";
import { useDateTime, useDateTimeConfig } from "@/lib/datetime/client";

export function PollResultsGrid({
  options,
  participantCount,
  timeZone,
}: {
  options: PollResultOption[];
  participantCount: number;
  timeZone: string | null;
}) {
  const { t } = useTranslation();
  const config = useDateTimeConfig();
  const { formatDateTime, formatDateTimeRange } = useDateTime();
  // Floating polls are stored as UTC wall time; zoned polls follow the viewer.
  const displayZone = timeZone ? (config.timeZone ?? "UTC") : "UTC";

  const states = React.useMemo(() => classifyOptions(options), [options]);
  const grid = React.useMemo(
    () => buildTimeGrid({ options, timeZone: displayZone }),
    [options, displayZone],
  );
  const optionById = React.useMemo(
    () => new Map(options.map((option) => [option.id, option])),
    [options],
  );

  return (
    <div className="h-full overflow-auto">
      <table
        aria-label={t("pollResultsTableLabel", { defaultValue: "Results" })}
        className="grid w-max min-w-full"
        style={{
          gridTemplateColumns: `auto repeat(${grid.dates.length}, minmax(6rem, 1fr))`,
        }}
      >
        <thead className="contents">
          <tr className="sticky top-0 z-20 col-span-full grid grid-cols-subgrid border-b bg-background">
            <div className="sticky left-0 z-10 bg-background">
              <span className="sr-only">
                <Trans i18nKey="pollResultsTime" defaults="Time" />
              </span>
            </div>
            {grid.dates.map((date, index) => (
              <th
                key={date.key}
                scope="col"
                className={cn(
                  "px-2 py-3 text-center font-medium text-sm",
                  grid.dateGapBefore.has(index) && "border-l border-dashed",
                )}
              >
                {formatDateTime(date.sampleStart, "weekdayMonthDayShort", {
                  timeZone: displayZone,
                })}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="contents">
          {grid.slots.map((slot, rowIndex) => (
            <tr
              key={slot.key}
              className={cn(
                "col-span-full grid grid-cols-subgrid",
                grid.slotGapBefore.has(rowIndex) &&
                  "mt-3 border-t border-dashed pt-3",
              )}
            >
              <th
                scope="row"
                className="sticky left-0 z-10 flex items-center whitespace-nowrap bg-background px-4 text-muted-foreground text-sm tabular-nums"
              >
                {formatDateTimeRange(
                  slot.sampleStart,
                  new Date(slot.sampleStart.getTime() + slot.duration * 60_000),
                  "time",
                  { timeZone: displayZone },
                )}
              </th>
              {grid.dates.map((date, index) => {
                const optionId = grid.cells.get(
                  timeGridCellKey(date.key, slot.key),
                );
                const option = optionId ? optionById.get(optionId) : undefined;
                const gapClass =
                  grid.dateGapBefore.has(index) && "border-l border-dashed";
                return option ? (
                  <PollResultsCell
                    key={date.key}
                    state={states.get(option.id) ?? "normal"}
                    available={getOptionAvailability(option)}
                    total={participantCount}
                    className={cn(gapClass)}
                  />
                ) : (
                  <td key={date.key} className={cn(gapClass)} />
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
