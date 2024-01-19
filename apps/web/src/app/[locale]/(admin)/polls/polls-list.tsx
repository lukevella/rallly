"use client";
import { PollStatus } from "@rallly/database";
import { Button } from "@rallly/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@rallly/ui/tooltip";
import { createColumnHelper, PaginationState } from "@tanstack/react-table";
import dayjs from "dayjs";
import { ArrowRightIcon, InboxIcon, PlusIcon, UsersIcon } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React from "react";

import { PollStatusBadge } from "@/components/poll-status";
import { Table } from "@/components/table";
import { Trans } from "@/components/trans";
import { useDayjs } from "@/utils/dayjs";
import { trpc } from "@/utils/trpc/client";

import Loader from "./loading";

const EmptyState = () => {
  return (
    <div className="py-24">
      <div className="mx-auto w-full max-w-md rounded-md border-2 border-dashed border-gray-300 p-8 text-center">
        <div className="mb-4">
          <InboxIcon className="inline-block size-10 text-gray-400" />
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
              <PlusIcon className="size-5" />
              <Trans defaults="New Poll" i18nKey="newPoll" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

type Column = {
  id: string;
  status: PollStatus;
  title: string;
  createdAt: Date;
  participants: { name: string }[];
  timeZone: string | null;
  event: {
    start: Date;
    duration: number;
  } | null;
};

const columnHelper = createColumnHelper<Column>();

export function PollsList() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const pagination = React.useMemo<PaginationState>(
    () => ({
      pageIndex: (Number(searchParams?.get("page")) || 1) - 1,
      pageSize: Number(searchParams?.get("pageSize")) || 10,
    }),
    [searchParams],
  );

  const { data } = trpc.polls.paginatedList.useQuery({ pagination });
  const { adjustTimeZone } = useDayjs();
  const columns = React.useMemo(
    () => [
      columnHelper.display({
        id: "title",
        header: () => null,
        size: 5000,
        cell: ({ row }) => {
          return (
            <Link className="group block" href={`/poll/${row.original.id}`}>
              <div className="mb-1 flex min-w-0 items-center gap-x-2">
                <h3 className="truncate font-semibold text-gray-600 group-hover:text-gray-900">
                  {row.original.title}
                </h3>
                <ArrowRightIcon className="size-4 opacity-0 transition-all group-hover:opacity-100 group-focus:translate-x-2" />
              </div>
              {row.original.event ? (
                <p className="text-muted-foreground text-sm">
                  {row.original.event.duration === 0
                    ? adjustTimeZone(
                        row.original.event.start,
                        !row.original.timeZone,
                      ).format("LL")
                    : `${adjustTimeZone(
                        row.original.event.start,
                        !row.original.timeZone,
                      ).format("LL LT")} - ${adjustTimeZone(
                        dayjs(row.original.event.start).add(
                          row.original.event.duration,
                          "minutes",
                        ),
                        !row.original.timeZone,
                      ).format("LT")}`}
                </p>
              ) : (
                <p className="text-sm text-gray-400">
                  <Trans i18nKey="pending" defaults="Pending" />
                </p>
              )}
            </Link>
          );
        },
      }),
      columnHelper.accessor("status", {
        header: () => null,
        size: 200,
        cell: ({ row }) => {
          return (
            <div>
              <PollStatusBadge status={row.getValue("status")} />
            </div>
          );
        },
      }),
      columnHelper.accessor("createdAt", {
        header: () => null,
        size: 1000,
        cell: ({ row }) => {
          const { createdAt } = row.original;
          return (
            <p className="text-muted-foreground whitespace-nowrap text-sm">
              <time dateTime={createdAt.toDateString()}>
                <Trans
                  i18nKey="createdTime"
                  values={{ relativeTime: dayjs(createdAt).fromNow() }}
                />
              </time>
            </p>
          );
        },
      }),
      columnHelper.accessor("participants", {
        header: () => null,
        cell: ({ row }) => {
          return (
            <Tooltip delayDuration={100}>
              <TooltipTrigger className="text-muted-foreground flex items-center gap-x-2">
                <UsersIcon className="size-4" />
                <span className="text-sm">
                  {row.original.participants.length}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                {row.original.participants.length > 0 ? (
                  <>
                    {row.original.participants
                      .slice(0, 10)
                      .map((participant, i) => (
                        <p key={i}>{participant.name}</p>
                      ))}
                    {row.original.participants.length > 10 ? (
                      <p>
                        <Trans
                          i18nKey="xMore"
                          defaults="{count} more"
                          values={{
                            count: row.original.participants.length - 5,
                          }}
                        />
                      </p>
                    ) : null}
                  </>
                ) : (
                  <Trans i18nKey="noParticipants" defaults="No participants" />
                )}
              </TooltipContent>
            </Tooltip>
          );
        },
      }),
    ],
    [adjustTimeZone],
  );

  if (!data) {
    // return a table using <Skeleton /> components
    return <Loader />;
  }

  if (data.total === 0) return <EmptyState />;

  return (
    <Table
      layout="auto"
      paginationState={pagination}
      data={data.rows as Column[]}
      pageCount={Math.ceil(data.total / pagination.pageSize)}
      onPaginationChange={(updater) => {
        const newPagination =
          typeof updater === "function" ? updater(pagination) : updater;

        const current = new URLSearchParams(searchParams ?? undefined);
        current.set("page", String(newPagination.pageIndex + 1));
        // current.set("pageSize", String(newPagination.pageSize));
        router.push(`${pathname}?${current.toString()}`);
      }}
      columns={columns}
    />
  );
}
