"use client";

import { cn } from "@rallly/ui";
import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import React from "react";
import { DataList } from "@/components/data-list";
import { EventTimeRange } from "@/features/scheduled-event/components/event-date-time";
import { Trans } from "@/i18n/client";
import { CalendarDate } from "@/lib/datetime/calendar-date";
import { useDateTimeConfig } from "@/lib/datetime/client";
import {
  calendarDateToUTCMidnight,
  getCalendarDate,
} from "@/lib/datetime/utils";
import { getBrowserTimeZone } from "@/lib/utils/date-time-utils";

type OptionRow = {
  id: string;
  startTime: Date;
  duration: number;
};

/**
 * A poll's options as a list: grouped by day for a time poll, one row per
 * day for a date poll. `renderValue` fills the trailing column.
 */
export function PollOptionsList<TRow extends OptionRow>({
  kind,
  options,
  timeZone,
  renderValue,
  className,
}: {
  kind: "date" | "time";
  options: TRow[];
  timeZone: string | null;
  renderValue: (option: TRow) => React.ReactNode;
  className?: string;
}) {
  const viewerTimeZone = useDateTimeConfig().timeZone ?? getBrowserTimeZone();

  // All-day and floating options are stored as UTC wall time, so their day
  // is read in UTC; fixed times fall on the viewer's day.
  const dayKey = React.useCallback(
    (option: TRow) =>
      getCalendarDate(
        option.startTime,
        option.duration === 0 || timeZone === null ? "UTC" : viewerTimeZone,
      ),
    [timeZone, viewerTimeZone],
  );

  const columns = React.useMemo(() => {
    const columnHelper = createColumnHelper<TRow>();
    return [
      columnHelper.display({
        id: "option",
        header: () => (
          <Trans i18nKey="pollOptionsListOption" defaults="Option" />
        ),
        meta: { className: "text-sm" },
        cell: ({ row }) =>
          kind === "date" ? (
            <span className="flex min-w-0 gap-2">
              <CalendarDate
                value={row.original.startTime}
                preset="weekday"
                className="font-medium"
              />
              <CalendarDate
                value={row.original.startTime}
                preset="dateLong"
                className="truncate text-muted-foreground"
              />
            </span>
          ) : (
            <EventTimeRange
              start={row.original.startTime}
              end={
                new Date(
                  row.original.startTime.getTime() +
                    row.original.duration * 60_000,
                )
              }
              allDay={row.original.duration === 0}
              timeZone={timeZone}
              className="truncate"
            />
          ),
      }),
      columnHelper.display({
        id: "value",
        header: () => <Trans i18nKey="pollOptionsListValue" defaults="Value" />,
        meta: { className: "justify-end" },
        cell: ({ row }) => renderValue(row.original),
      }),
    ];
  }, [kind, renderValue, timeZone]);

  const table = useReactTable({
    data: options,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (option) => option.id,
  });

  return (
    <DataList
      table={table}
      // A date poll has one option per day, so a day header would repeat
      // the row it heads.
      getGroup={
        kind === "date"
          ? undefined
          : (option) => {
              const key = dayKey(option);
              return {
                id: key,
                label: (
                  <>
                    <CalendarDate
                      value={calendarDateToUTCMidnight(key)}
                      preset="weekday"
                      className="font-medium text-foreground"
                    />
                    <CalendarDate
                      value={calendarDateToUTCMidnight(key)}
                      preset="dateLong"
                      className="text-muted-foreground"
                    />
                  </>
                ),
              };
            }
      }
      className={cn("grid-cols-[minmax(0,1fr)_auto]", className)}
    />
  );
}
