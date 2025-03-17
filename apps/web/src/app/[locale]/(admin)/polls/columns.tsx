"use client";

import type { Poll } from "@rallly/database";
import { Checkbox } from "@rallly/ui/checkbox";
import { type Row, createColumnHelper } from "@tanstack/react-table";
import dayjs from "dayjs";
import { CalendarIcon, UserIcon } from "lucide-react";
import Link from "next/link";
import React from "react";

import { PollStatusIcon } from "@/components/poll-status-icon";
import { Trans } from "@/components/trans";

import { PollActions } from "./poll-actions";

// Define a simplified poll type that matches what we're returning from the server
export type SimplifiedPoll = {
  id: string;
  title: string;
  status: Poll["status"];
  createdAt: Date;
  participants: { id: string }[];
  options: { id: string; startTime: Date }[];
};

const columnHelper = createColumnHelper<SimplifiedPoll>();

export function useColumns() {
  return React.useMemo(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllRowsSelected() ||
              (table.getIsSomeRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) => table.toggleAllRowsSelected(!!value)}
            aria-label="Select all"
          />
        ),
        cell: ({ row }: { row: Row<SimplifiedPoll> }) => {
          const isSelected = row.getIsSelected();
          return (
            <div
              className={`transition-opacity duration-150 ${isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
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
      },
      columnHelper.accessor("title", {
        header: () => <Trans i18nKey="title" defaults="Title" />,
        cell: (info) => (
          <div className="flex items-center gap-2">
            <PollStatusIcon status={info.row.original.status} />
            <Link
              href={`/poll/${info.row.original.id}`}
              className="font-medium hover:underline"
            >
              {info.getValue()}
            </Link>
          </div>
        ),
      }),
      columnHelper.accessor((row) => row.participants, {
        id: "participantCount",
        header: () => <Trans i18nKey="participants" defaults="Participants" />,
        cell: (info) => {
          const participants = info.getValue();
          return (
            <div className="flex items-center">
              <UserIcon className="mr-2 size-4" />
              <span>{participants.length}</span>
            </div>
          );
        },
      }),
      columnHelper.accessor((row) => row.options, {
        id: "dateRange",
        header: () => <span>Date Range</span>,
        cell: (info) => {
          const options = info.getValue();
          // Filter out options without startTime
          const optionsWithDates = options.filter((option) => option.startTime);

          if (optionsWithDates.length === 0) {
            return <span className="text-gray-500">No dates</span>;
          }

          // Sort options by startTime
          const sortedOptions = [...optionsWithDates].sort((a, b) => {
            if (!a.startTime || !b.startTime) return 0;
            return dayjs(a.startTime).unix() - dayjs(b.startTime).unix();
          });

          const firstDate = dayjs(sortedOptions[0].startTime);
          const lastDate = dayjs(
            sortedOptions[sortedOptions.length - 1].startTime,
          );

          // If dates are in the same month and year, show a simplified range
          const isSameMonthAndYear =
            firstDate.month() === lastDate.month() &&
            firstDate.year() === lastDate.year();

          return (
            <div className="flex items-center">
              <CalendarIcon className="mr-2 size-4 text-gray-500" />
              <span>
                {isSameMonthAndYear ? (
                  <>
                    {firstDate.format("MMM D")} - {lastDate.format("D")}
                  </>
                ) : (
                  <>
                    {firstDate.format("MMM D")} - {lastDate.format("MMM D")}
                  </>
                )}
              </span>
            </div>
          );
        },
      }),
      columnHelper.accessor((row) => row.options, {
        id: "optionCount",
        header: () => <span>Options</span>,
        cell: (info) => {
          const options = info.getValue();
          return (
            <div className="flex items-center">
              <CalendarIcon className="mr-2 size-4" />
              <span>{options.length}</span>
            </div>
          );
        },
      }),
      columnHelper.accessor("createdAt", {
        id: "createdDate",
        header: () => <span>Created</span>,
        cell: (info) => {
          const date = dayjs(info.getValue());
          return date.format("MMM D, YYYY");
        },
      }),
      columnHelper.display({
        id: "actionButtons",
        header: () => <span>Actions</span>,
        cell: (info) => <PollActions poll={info.row.original} />,
      }),
    ],
    [], // Empty dependency array since columns definition doesn't depend on any props or state
  );
}
