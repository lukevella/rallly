"use client";

import type { Poll } from "@rallly/database";
import { cn } from "@rallly/ui";
import { Checkbox } from "@rallly/ui/checkbox";
import {
  type Row,
  type Table,
  createColumnHelper,
} from "@tanstack/react-table";
import dayjs from "dayjs";
import { CalendarIcon } from "lucide-react";
import Link from "next/link";
import React from "react";

import { ParticipantAvatarBar } from "@/components/participant-avatar-bar";
import { PollStatusIcon } from "@/components/poll-status-icon";
import { Trans } from "@/components/trans";
import { DateDisplay } from "@/features/timezone";

import { PollActions } from "./poll-actions";

// Define a simplified poll type that matches what we're returning from the server
export type SimplifiedPoll = {
  id: string;
  title: string;
  status: Poll["status"];
  createdAt: Date;
  participants: {
    id: string;
    name: string;
    image?: string;
  }[];
  event?: {
    start: Date;
  };
  dateOptions: {
    first: Date;
    last: Date;
    count: number;
  };
};

export type ColumnId =
  | "select"
  | "title"
  | "dateRange"
  | "participants"
  | "createdDate"
  | "actionButtons";

const columnHelper = createColumnHelper<SimplifiedPoll>();

export function useColumns(visibleColumns?: ColumnId[]) {
  return React.useMemo(() => {
    const allColumns = [
      {
        id: "select",
        header: ({ table }: { table: Table<SimplifiedPoll> }) => {
          const isAllSelected = table.getIsAllRowsSelected();
          const isSomeSelected = table.getIsSomeRowsSelected();
          return (
            <div
              className={cn(
                "flex h-full min-w-[48px] max-w-[48px] items-center pl-1 transition-opacity duration-150",
                {
                  ["opacity-100"]: isAllSelected || isSomeSelected,
                  ["opacity-0 hover:opacity-100"]:
                    !isAllSelected && !isSomeSelected,
                },
              )}
            >
              <Checkbox
                checked={
                  isAllSelected
                    ? true
                    : isSomeSelected
                      ? "indeterminate"
                      : false
                }
                onCheckedChange={(value) =>
                  table.toggleAllRowsSelected(!!value)
                }
                aria-label="Select all"
              />
            </div>
          );
        },
        cell: ({ row }: { row: Row<SimplifiedPoll> }) => {
          const isSelected = row.getIsSelected();
          return (
            <div
              className={cn(
                "flex h-full min-w-[48px] max-w-[48px] items-center pl-1 transition-opacity duration-150",
                {
                  ["opacity-100"]: isSelected,
                  ["opacity-0 hover:opacity-100"]: !isSelected,
                },
              )}
            >
              <Checkbox
                checked={isSelected}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label="Select row"
              />
            </div>
          );
        },
        enableSorting: false,
        enableHiding: false,
        size: 48,
      },
      columnHelper.accessor("title", {
        id: "title",
        header: () => <Trans i18nKey="title" defaults="Title" />,
        cell: (info) => (
          <div className="flex items-center gap-2">
            <PollStatusIcon status={info.row.original.status} />
            <Link
              href={`/poll/${info.row.original.id}`}
              className="max-w-full truncate font-medium hover:underline"
              title={info.getValue()}
            >
              {info.getValue()}
            </Link>
          </div>
        ),
        size: 500,
      }),
      columnHelper.accessor((row) => row.dateOptions, {
        id: "dateRange",
        header: () => <Trans i18nKey="dates" defaults="Dates" />,
        cell: (info) => {
          const dateOptions = info.getValue();
          const event = info.row.original.event;

          // If event is scheduled, show it with a green icon
          if (event) {
            return (
              <div className="flex items-center gap-2">
                <CalendarIcon className="size-4 shrink-0 text-emerald-500" />
                <span>
                  <DateDisplay
                    date={dayjs(event.start)}
                    format="MMM D, YYYY h:mm A"
                  />
                  <span className="ml-2 text-emerald-600">
                    <Trans i18nKey="event" defaults="Scheduled" />
                  </span>
                </span>
              </div>
            );
          }

          if (!dateOptions.first || !dateOptions.last) {
            return (
              <span className="text-gray-500">
                <Trans i18nKey="event" defaults="No dates" />
              </span>
            );
          }

          const firstDate = dayjs(dateOptions.first);
          const lastDate = dayjs(dateOptions.last);
          const isSameDay = firstDate.isSame(lastDate, "day");
          const isSameMonthAndYear =
            firstDate.month() === lastDate.month() &&
            firstDate.year() === lastDate.year();

          return (
            <div className="flex items-center gap-2">
              <CalendarIcon className="size-4 shrink-0 text-gray-500" />
              <span className="flex items-center gap-2">
                <span>
                  {isSameDay ? (
                    <DateDisplay date={firstDate} format="MMM D, YYYY" />
                  ) : isSameMonthAndYear ? (
                    <>
                      <DateDisplay date={firstDate} format="MMM D" /> -{" "}
                      <DateDisplay date={lastDate} format="D, YYYY" />
                    </>
                  ) : (
                    <>
                      <DateDisplay date={firstDate} format="MMM D" /> -{" "}
                      <DateDisplay date={lastDate} format="MMM D, YYYY" />
                    </>
                  )}
                </span>
              </span>
            </div>
          );
        },
        size: 300,
      }),
      columnHelper.accessor((row) => row.participants, {
        id: "participants",
        header: () => <Trans i18nKey="participants" defaults="Participants" />,
        cell: (info) => {
          const participants = info.getValue();
          return <ParticipantAvatarBar participants={participants} max={5} />;
        },
        size: 200,
      }),
      columnHelper.accessor("createdAt", {
        id: "createdDate",
        header: () => <Trans i18nKey="title" defaults="Created" />,
        cell: (info) => dayjs(info.getValue()).fromNow(),
        size: 140,
      }),
      columnHelper.accessor("id", {
        id: "actionButtons",
        header: () => null,
        cell: (info) => <PollActions pollId={info.getValue()} />,
        size: 48,
      }),
    ];

    if (!visibleColumns) {
      return allColumns;
    }

    return allColumns.filter((column) =>
      visibleColumns.includes(column.id as ColumnId),
    );
  }, [visibleColumns]);
}
