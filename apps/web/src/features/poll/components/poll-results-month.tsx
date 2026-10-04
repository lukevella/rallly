// Grid layout replaces the table's display values, which strips implicit
// table semantics in some engines; explicit roles restore them.
// biome-ignore-all lint/a11y/noRedundantRoles: see above
// biome-ignore-all lint/a11y/useSemanticElements: see above

"use client";

import { Button } from "@rallly/ui/button";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import * as React from "react";
import { PollResultsCell } from "@/features/poll/components/poll-results-cell";
import type { PollResultOption } from "@/features/poll/types";
import {
  addMonths,
  buildMonthGrid,
  classifyOptions,
  getInitialMonth,
  getMonthRange,
  getOptionAvailability,
  hasHighlightAfter,
  hasHighlightBefore,
  toDateKey,
} from "@/features/poll/utils";
import { Trans, useTranslation } from "@/i18n/client";
import { useDateTime, useDateTimeConfig } from "@/lib/datetime/client";
import { useHydrated } from "@/lib/datetime/use-hydrated";

function HighlightDot() {
  return (
    <span
      aria-hidden="true"
      className="absolute top-1 right-1 size-1.5 rounded-full bg-green-600"
    />
  );
}

export function PollResultsMonth({
  options,
  participantCount,
}: {
  options: PollResultOption[];
  participantCount: number;
}) {
  const { t } = useTranslation();
  const { weekStart } = useDateTimeConfig();
  const { formatDateTime, weekdays } = useDateTime();
  // Intl output differs between Node and browsers, so labels wait for hydration.
  const hydrated = useHydrated();

  const states = React.useMemo(() => classifyOptions(options), [options]);
  const optionByDate = React.useMemo(
    () =>
      new Map(options.map((option) => [toDateKey(option.startTime), option])),
    [options],
  );
  const range = React.useMemo(() => getMonthRange(options), [options]);
  const [monthKey, setMonthKey] = React.useState(() =>
    getInitialMonth({ options, states }),
  );

  const weeks = buildMonthGrid({ monthKey, weekStart });
  const orderedWeekdays = [...weekdays()].sort(
    (a, b) => ((a.day - weekStart + 7) % 7) - ((b.day - weekStart + 7) % 7),
  );
  const highlightBefore = hasHighlightBefore({ monthKey, options, states });
  const highlightAfter = hasHighlightAfter({ monthKey, options, states });

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center gap-2 px-3 pt-3 pb-2">
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          disabled={monthKey <= range.first}
          onClick={() => setMonthKey(addMonths(monthKey, -1))}
        >
          <ChevronLeftIcon className="size-4" />
          {highlightBefore ? <HighlightDot /> : null}
          <span className="sr-only">
            <Trans
              i18nKey="previousMonth"
              defaults="Go to the previous month"
            />
            {highlightBefore ? (
              <>
                {", "}
                <Trans
                  i18nKey="pollResultsHasPopularDates"
                  defaults="has popular dates"
                />
              </>
            ) : null}
          </span>
        </Button>
        <h3
          className="min-w-36 text-center font-medium text-sm"
          aria-live="polite"
        >
          {!hydrated
            ? "\u00a0"
            : formatDateTime(
                new Date(`${monthKey}-01T00:00:00Z`),
                "monthYear",
                {
                  timeZone: "UTC",
                },
              )}
        </h3>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          disabled={monthKey >= range.last}
          onClick={() => setMonthKey(addMonths(monthKey, 1))}
        >
          <ChevronRightIcon className="size-4" />
          {highlightAfter ? <HighlightDot /> : null}
          <span className="sr-only">
            <Trans i18nKey="nextMonth" defaults="Go to the next month" />
            {highlightAfter ? (
              <>
                {", "}
                <Trans
                  i18nKey="pollResultsHasPopularDates"
                  defaults="has popular dates"
                />
              </>
            ) : null}
          </span>
        </Button>
      </div>
      <div className="relative min-h-0 flex-1 overflow-auto px-2 pb-2">
        <table
          role="table"
          aria-label={t("pollResultsTableLabel", { defaultValue: "Results" })}
          className="grid grid-cols-7"
        >
          <thead role="rowgroup" className="contents">
            <tr
              role="row"
              className="sticky top-0 z-10 col-span-full grid grid-cols-subgrid border-b bg-card"
            >
              {orderedWeekdays.map((weekday) => (
                <th
                  key={weekday.day}
                  scope="col"
                  role="columnheader"
                  className="py-2 text-center font-medium text-muted-foreground text-xs"
                >
                  <span aria-hidden="true">
                    {hydrated ? weekday.short : "\u00a0"}
                  </span>
                  <span className="sr-only">
                    {hydrated ? weekday.label : "\u00a0"}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody role="rowgroup" className="contents">
            {weeks.map((week) => (
              <tr
                role="row"
                key={week.find(Boolean)?.dateKey}
                className="col-span-full grid grid-cols-subgrid"
              >
                {week.map((day, index) => {
                  if (!day) {
                    // biome-ignore lint/suspicious/noArrayIndexKey: blanks have no identity
                    return <td role="cell" key={index} />;
                  }
                  const option = optionByDate.get(day.dateKey);
                  if (!option) {
                    return (
                      <td
                        role="cell"
                        key={day.dateKey}
                        className="flex aspect-square items-start justify-center p-2 text-muted-foreground/50 text-xs"
                      >
                        {day.day}
                      </td>
                    );
                  }
                  return (
                    <PollResultsCell
                      key={day.dateKey}
                      day={day.day}
                      label={
                        !hydrated
                          ? undefined
                          : formatDateTime(
                              new Date(`${day.dateKey}T00:00:00Z`),
                              "dateFull",
                              { timeZone: "UTC" },
                            )
                      }
                      state={states.get(option.id) ?? "normal"}
                      available={getOptionAvailability(option)}
                      total={participantCount}
                      className="aspect-square"
                    />
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
