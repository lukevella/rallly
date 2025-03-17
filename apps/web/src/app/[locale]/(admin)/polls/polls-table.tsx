"use client";

import type { Option, Participant, Poll, Vote } from "@rallly/database";
import { Button } from "@rallly/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@rallly/ui/table";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  CalendarIcon,
  CheckIcon,
  LinkIcon,
  MessageSquareIcon,
  UserIcon,
} from "lucide-react";
import Link from "next/link";
import React from "react";
import useCopyToClipboard from "react-use/lib/useCopyToClipboard";

import { PollStatusBadge } from "@/components/poll-status";
import { Trans } from "@/components/trans";

type PollWithRelations = Poll & {
  participants: Participant[];
  options: Option[];
  votes: Vote[];
};

const columnHelper = createColumnHelper<PollWithRelations>();

function CopyLinkButton({ pollId }: { pollId: string }) {
  const [, copy] = useCopyToClipboard();
  const [didCopy, setDidCopy] = React.useState(false);

  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      disabled={didCopy}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        copy(`${window.location.origin}/invite/${pollId}`);
        setDidCopy(true);
        setTimeout(() => {
          setDidCopy(false);
        }, 1000);
      }}
      className="relative z-20"
    >
      {didCopy ? (
        <>
          <CheckIcon className="mr-2 size-4" />
          <Trans i18nKey="copied" defaults="Copied" />
        </>
      ) : (
        <>
          <LinkIcon className="mr-2 size-4" />
          <Trans i18nKey="copyLink" defaults="Copy Link" />
        </>
      )}
    </Button>
  );
}

export function PollsTable({ polls }: { polls: PollWithRelations[] }) {
  const columns = React.useMemo(
    () => [
      columnHelper.accessor("title", {
        header: () => <Trans i18nKey="title" defaults="Title" />,
        cell: (info) => (
          <Link
            href={`/poll/${info.row.original.id}`}
            className="font-medium hover:underline"
          >
            {info.getValue()}
          </Link>
        ),
      }),
      columnHelper.accessor((row) => row.status, {
        id: "pollStatus",
        header: () => <span>Status</span>,
        cell: (info) => <PollStatusBadge status={info.getValue()} />,
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
      columnHelper.accessor((row) => row.votes, {
        id: "responseCount",
        header: () => <span>Responses</span>,
        cell: (info) => {
          const votes = info.getValue();
          return (
            <div className="flex items-center">
              <MessageSquareIcon className="mr-2 size-4" />
              <span>{votes.length}</span>
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
        cell: (info) => <CopyLinkButton pollId={info.row.original.id} />,
      }),
    ],
    [],
  );

  const table = useReactTable({
    data: polls,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (polls.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-gray-500">
          <Trans i18nKey="noPolls" defaults="You don't have any polls yet" />
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
