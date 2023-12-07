"use client";
import { PollStatus } from "@rallly/database";
import { Button } from "@rallly/ui/button";
import { createColumnHelper } from "@tanstack/react-table";
import dayjs from "dayjs";
import { DotIcon, InboxIcon, PlusIcon } from "lucide-react";
import Link from "next/link";

import { PollStatusBadge } from "@/components/poll-status";
import { Skeleton } from "@/components/skeleton";
import { Table } from "@/components/table";
import { Trans } from "@/components/trans";
import { trpc } from "@/utils/trpc/client";

const EmptyState = () => {
  return (
    <div className="py-24">
      <div className="mx-auto max-w-md rounded-md border-2 w-full border-dashed border-gray-300 p-8 text-center">
        <div className="mb-4">
          <InboxIcon className="inline-block h-10 w-10 text-gray-400" />
        </div>
        <h3 className="font-semibold">
          <Trans i18nKey="noPolls" defaults="No polls" />
        </h3>
        <p className="text-muted-foreground">
          <Trans
            i18nKey="noPollsDescription"
            defaults="Get started by creating a new poll."
          />
        </p>
        <div className="mt-6">
          <Button variant="primary" asChild={true}>
            <Link href="/new">
              <PlusIcon className="h-5 w-5" />
              <Trans defaults="New Poll" i18nKey="newPoll" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

function PollsSkeleton() {
  return (
    <div className="mx-auto grid max-w-3xl gap-3 sm:gap-4">
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
  );
}

type Column = {
  id: string;
  status: PollStatus;
  title: string;
  createdAt: Date;
  participants: { name: string }[];
};

const columnHelper = createColumnHelper<Column>();

export function PollsPage() {
  const { data } = trpc.polls.list.useQuery();

  if (!data) return <PollsSkeleton />;

  if (data.length === 0) return <EmptyState />;

  return (
    <div>
      <Table
        layout="auto"
        data={data as Column[]}
        columns={[
          columnHelper.accessor("status", {
            header: () => null,
            cell: ({ row }) => {
              return (
                <div className="text-right">
                  <PollStatusBadge status={row.getValue("status")} />
                </div>
              );
            },
          }),
          columnHelper.display({
            id: "title",
            header: () => null,
            size: 99999,
            cell: ({ row }) => {
              const createdAt = row.original.createdAt;
              return (
                <div className="relative">
                  <h3 className="font-semibold align-middle leading-6 mb-1 text-gray-600 hover:text-gray-900 hover:underline">
                    <Link href={`/poll/${row.original.id}`}>
                      {row.original.title}
                      <span className="absolute inset-0" />
                    </Link>
                  </h3>
                  <div className="flex items-center gap-x-1 text-muted-foreground">
                    <p className="text-sm">
                      <time dateTime={createdAt.toDateString()}>
                        <Trans
                          i18nKey="createdTime"
                          values={{ relativeTime: dayjs(createdAt).fromNow() }}
                        />
                      </time>
                    </p>
                    <DotIcon className="h-4 w-4" />
                    <p className="text-sm whitespace-nowrap">
                      <Trans
                        i18nKey="participantCount"
                        values={{ count: row.original.participants.length }}
                      />
                    </p>
                  </div>
                </div>
              );
            },
          }),
        ]}
      />
    </div>
  );
}
