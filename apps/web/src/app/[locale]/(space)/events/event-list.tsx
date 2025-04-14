"use client";

import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import dayjs from "dayjs";

import { Trans } from "@/components/trans";
import { generateGradient } from "@/utils/color-hash";
import { useDayjs } from "@/utils/dayjs";

import type { ScheduledEvent } from "./types";

export function EventList({ data }: { data: ScheduledEvent[] }) {
  const table = useReactTable({
    data,
    columns: [],
    getCoreRowModel: getCoreRowModel(),
  });

  const { adjustTimeZone } = useDayjs();
  return (
    <div className="rounded-lg border">
      <ul className="divide-y divide-gray-100">
        {table.getRowModel().rows.map((row) => {
          const start = adjustTimeZone(
            row.original.start,
            !row.original.timeZone,
          );

          const end = adjustTimeZone(
            dayjs(row.original.start).add(row.original.duration, "minutes"),
            !row.original.timeZone,
          );
          return (
            <li key={row.id} className="p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:gap-8">
                <div className="flex shrink-0 justify-between gap-1 sm:w-24 sm:flex-col sm:text-right">
                  <time dateTime={start.toISOString()} className="text-sm">
                    {start.format("ddd, D MMM")}
                  </time>
                  <time
                    dateTime={start.toISOString()}
                    className="text-muted-foreground text-sm"
                  >
                    {start.format("YYYY")}
                  </time>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-x-2">
                    <span
                      className="h-4 w-1 shrink-0 rounded-full"
                      style={{
                        background: generateGradient(row.original.id),
                      }}
                    ></span>
                    <h2 className="truncate text-sm font-medium">
                      {row.original.title}
                    </h2>
                  </div>
                  <p className="text-muted-foreground mt-1 text-sm">
                    {row.original.duration === 0 ? (
                      <Trans i18nKey="allDay" />
                    ) : (
                      <span>{`${start.format("LT")} - ${end.format("LT")}`}</span>
                    )}
                  </p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
