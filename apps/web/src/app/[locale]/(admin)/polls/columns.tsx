"use client";

import type { PollStatus } from "@rallly/database";
import { cn } from "@rallly/ui";
import { Checkbox } from "@rallly/ui/checkbox";
import { createColumnHelper } from "@tanstack/react-table";
import dayjs from "dayjs";
import Link from "next/link";
import React from "react";

import { ParticipantAvatarBar } from "@/components/participant-avatar-bar";
import { ScheduledEventDisplay } from "@/components/poll/scheduled-event-display";
import { PollStatusIcon } from "@/components/poll-status-icon";
import { Trans } from "@/components/trans";

import { PollActions } from "./poll-actions";

// Define a simplified poll type that matches what we're returning from the server
export type PollRow = {
  id: string;
  title: string;
  status: PollStatus;
  createdAt: Date;
  updatedAt: Date;
  participants: {
    id: string;
    name: string;
    image?: string;
  }[];
  event?: {
    start: Date;
    duration: number;
  };
  dateOptions: {
    first: Date;
    last: Date;
    count: number;
    duration: number | number[];
  };
};

export type ColumnId =
  | "select"
  | "title"
  | "dateRange"
  | "participants"
  | "createdDate"
  | "actionButtons";

const columnHelper = createColumnHelper<PollRow>();

export function useColumns(visibleColumns?: ColumnId[]) {
  return React.useMemo(() => {
    const allColumns = [
      columnHelper.display({
        id: "select",
        header: ({ table }) => {
          const isAllSelected = table.getIsAllRowsSelected();
          const isSomeSelected = table.getIsSomeRowsSelected();

          return (
            <div
              className={cn(
                "flex size-8 items-center justify-center duration-150",
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
        cell: (info) => {
          const row = info.row;
          const isSelected = row.getIsSelected();
          // Access the table instance from the cell info context
          const table = info.table;
          // Check if any row is selected in the table
          const hasSelectedRows =
            table.getIsSomeRowsSelected() || table.getIsAllRowsSelected();

          return (
            <div
              className={cn(
                "relative flex items-center justify-center duration-150",
              )}
            >
              <Checkbox
                checked={isSelected}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label="Select row"
                className={cn("duration-150", {
                  "opacity-100": isSelected || hasSelectedRows,
                  "opacity-0 group-hover:opacity-100":
                    !isSelected && !hasSelectedRows,
                })}
              />
            </div>
          );
        },
        enableSorting: false,
        enableHiding: false,
        maxSize: 40,
      }),
      columnHelper.accessor("title", {
        id: "title",
        header: () => <Trans i18nKey="title" defaults="Title" />,
        cell: (info) => (
          <div className="flex min-w-0 items-center gap-2 overflow-hidden text-sm">
            <PollStatusIcon status={info.row.original.status} />
            <Link
              href={`/poll/${info.row.original.id}`}
              className="truncate font-medium hover:underline"
              title={info.getValue()}
            >
              {info.getValue()}
            </Link>
          </div>
        ),
        size: 1000,
      }),
      columnHelper.accessor((row) => row.dateOptions, {
        id: "dateRange",
        header: () => <Trans i18nKey="when" defaults="When" />,
        cell: (info) => {
          const dateOptions = info.getValue();
          const event = info.row.original.event;
          return (
            <div className="whitespace-nowrap">
              <ScheduledEventDisplay event={event} dateOptions={dateOptions} />
            </div>
          );
        },
        size: 250,
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
        header: () => <Trans i18nKey="created" defaults="Created" />,
        cell: (info) => (
          <span className="text-muted-foreground whitespace-nowrap">
            {dayjs(info.getValue()).fromNow()}
          </span>
        ),
        size: 150,
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
