"use client";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import dayjs from "dayjs";
import { CalendarPlusIcon } from "lucide-react";
import Link from "next/link";

import { GroupPollIcon } from "@/app/[locale]/(admin)/app-card";
import { PendingEvent } from "@/app/[locale]/(admin)/pages/columns";
import {
  EmptyState,
  EmptyStateDescription,
  EmptyStateIcon,
  EmptyStateTitle,
} from "@/app/components/empty-state";
import { Spinner } from "@/components/spinner";
import { trpc } from "@/utils/trpc/client";

function PendingEventsTableContainer({ data }: { data: PendingEvent[] }) {
  const table = useReactTable({
    columns: [],
    data,
    getCoreRowModel: getCoreRowModel(),
  });
  if (!data) {
    return <Spinner />;
  }
  if (data?.length === 0) {
    return (
      <EmptyState className="h-96">
        <EmptyStateIcon>
          <CalendarPlusIcon />
        </EmptyStateIcon>
        <EmptyStateTitle>No pending events</EmptyStateTitle>
        <EmptyStateDescription>
          You do not have any events pending
        </EmptyStateDescription>
      </EmptyState>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {table.getRowModel().rows.map((row) => (
        <div
          className="group relative flex justify-between gap-4 rounded-lg border bg-white p-4 shadow-sm focus-within:border-gray-300 focus-within:bg-gray-200  focus-within:shadow-none"
          key={row.id}
          data-state={row.getIsSelected() && "selected"}
        >
          <Link
            className="absolute inset-0 z-10 flex min-w-0 items-center gap-4 hover:underline"
            href={`/poll/${row.original.id}`}
          />
          <div className="flex min-w-0 flex-col justify-between gap-4">
            <GroupPollIcon size="sm" />
            <div>
              <div className="text-base font-semibold">
                {row.original.title}
              </div>
              <p className="text-muted-foreground whitespace-nowrap text-sm">
                <time dateTime={row.original.createdAt.toDateString()}>
                  {dayjs(row.original.createdAt).fromNow()}
                </time>
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function PendingEventsTable() {
  const { data } = trpc.polls.list.useQuery();

  if (!data) {
    return null;
  }

  return <PendingEventsTableContainer data={data} />;
}
