// Grid layout replaces the table's display values, which strips implicit
// table semantics in some engines; explicit roles restore them.
// biome-ignore-all lint/a11y/noRedundantRoles: see above
// biome-ignore-all lint/a11y/useSemanticElements: see above

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
import { useHydrated } from "@/lib/datetime/use-hydrated";

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
  // Intl output differs between Node and browsers, so labels wait for hydration.
  const hydrated = useHydrated();
  // Floating polls are stored as UTC wall time; zoned polls follow the viewer.
  const displayZone = timeZone ? (config.timeZone ?? "UTC") : "UTC";

  const states = React.useMemo(() => classifyOptions(options), [options]);
  const grid = React.useMemo(
    () => buildTimeGrid({ options, timeZone: displayZone }),
    [options, displayZone],
  );
  const dateLabels = grid.dates.map((date) =>
    !hydrated
      ? "\u00a0"
      : formatDateTime(date.sampleStart, "weekdayMonthDayShort", {
          timeZone: displayZone,
        }),
  );
  const slotLabels = grid.slots.map((slot) =>
    !hydrated
      ? "\u00a0"
      : formatDateTimeRange(
          slot.sampleStart,
          new Date(slot.sampleStart.getTime() + slot.duration * 60_000),
          "time",
          { timeZone: displayZone },
        ),
  );
  const optionById = React.useMemo(
    () => new Map(options.map((option) => [option.id, option])),
    [options],
  );

  return (
    <div className="relative min-h-0 overflow-auto">
      <table
        role="table"
        aria-label={t("pollResultsTableLabel", { defaultValue: "Results" })}
        className="grid w-max min-w-full"
        style={{
          gridTemplateColumns: `auto repeat(${grid.dates.length}, minmax(6rem, 1fr))`,
        }}
      >
        <thead role="rowgroup" className="contents">
          <tr
            role="row"
            className="sticky top-0 z-20 col-span-full grid grid-cols-subgrid border-b bg-card"
          >
            <th
              scope="col"
              role="columnheader"
              className="sticky left-0 z-10 bg-card"
            >
              <span className="sr-only">
                <Trans i18nKey="pollResultsTime" defaults="Time" />
              </span>
            </th>
            {grid.dates.map((date, index) => (
              <th
                key={date.key}
                scope="col"
                role="columnheader"
                className={cn(
                  "px-2 py-3 text-center font-medium text-xs",
                  "border-l",
                  grid.dateGapBefore.has(index) && "border-dashed",
                )}
              >
                {dateLabels[index]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody role="rowgroup" className="contents">
          {grid.slots.map((slot, rowIndex) => (
            <tr
              role="row"
              key={slot.key}
              className={cn(
                "col-span-full grid grid-cols-subgrid border-b last:border-b-0",
                grid.slotGapBefore.has(rowIndex + 1) && "border-dashed",
              )}
            >
              <th
                scope="row"
                role="rowheader"
                className="sticky left-0 z-10 flex items-center whitespace-nowrap bg-card px-4 font-normal text-muted-foreground text-xs tabular-nums"
              >
                {slotLabels[rowIndex]}
              </th>
              {grid.dates.map((date, index) => {
                const optionId = grid.cells.get(
                  timeGridCellKey(date.key, slot.key),
                );
                const option = optionId ? optionById.get(optionId) : undefined;
                const gapClass = cn(
                  "border-l",
                  grid.dateGapBefore.has(index) && "border-dashed",
                );
                return option ? (
                  <PollResultsCell
                    key={date.key}
                    label={
                      hydrated
                        ? `${dateLabels[index]}, ${slotLabels[rowIndex]}`
                        : undefined
                    }
                    state={states.get(option.id) ?? "normal"}
                    available={getOptionAvailability(option)}
                    total={participantCount}
                    className={gapClass}
                  />
                ) : (
                  <td role="cell" key={date.key} className={gapClass} />
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
