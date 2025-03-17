"use client";

import type { Poll } from "@rallly/database";
import { Checkbox } from "@rallly/ui/checkbox";
import { type Row, createColumnHelper } from "@tanstack/react-table";
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
  options: { id: string }[];
  votes: { id: string }[];
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
        cell: ({ row }: { row: Row<SimplifiedPoll> }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        ),
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
          const date = new Date(info.getValue());
          return new Intl.DateTimeFormat("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }).format(date);
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
