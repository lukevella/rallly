"use client";
import { RadioCards, RadioCardsItem } from "@rallly/ui/radio-pills";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import dayjs from "dayjs";
import { CalendarPlusIcon } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { z } from "zod";

import { GroupPollIcon } from "@/app/[locale]/(admin)/app-card";
import { PendingEvent } from "@/app/[locale]/(admin)/polls/columns";
import {
  EmptyState,
  EmptyStateDescription,
  EmptyStateIcon,
  EmptyStateTitle,
} from "@/app/components/empty-state";
import { PollStatusBadge } from "@/components/poll-status";
import { Spinner } from "@/components/spinner";
import { Trans } from "@/components/trans";
import { trpc } from "@/utils/trpc/client";

function useQueryParam(name: string) {
  const searchParams = useSearchParams();
  return [
    searchParams?.get(name),
    function (value: string) {
      const newParams = new URLSearchParams(searchParams?.toString());
      newParams.set(name, value);
      window.history.pushState(null, "", `?${newParams.toString()}`);
    },
  ] as const;
}

const pollStatusSchema = z
  .enum(["all", "live", "paused", "finalized"])
  .catch("all");

const pollStatusQueryKey = "status";

export function UserPolls() {
  const [pollStatus, setPollStatus] = useQueryParam(pollStatusQueryKey);
  const parsedPollStatus = pollStatusSchema.parse(pollStatus);

  const { data } = trpc.polls.list.useQuery({
    status: parsedPollStatus,
  });

  return (
    <div className="space-y-4">
      <RadioCards value={parsedPollStatus} onValueChange={setPollStatus}>
        <RadioCardsItem value="all">
          <Trans i18nKey="pollsListAll" />
        </RadioCardsItem>
        <RadioCardsItem value="live">
          <Trans i18nKey="pollStatusOpen" />
        </RadioCardsItem>
        <RadioCardsItem value="paused">
          <Trans i18nKey="pollStatusPaused" />
        </RadioCardsItem>
        <RadioCardsItem value="finalized">
          <Trans i18nKey="pollStatusFinalized" />
        </RadioCardsItem>
      </RadioCards>
      {data ? <PollsListView data={data} /> : <Spinner />}
    </div>
  );
}

function PollsListView({ data }: { data: PendingEvent[] }) {
  const table = useReactTable({
    columns: [],
    data,
    getCoreRowModel: getCoreRowModel(),
  });
  if (data?.length === 0) {
    return (
      <EmptyState className="h-96">
        <EmptyStateIcon>
          <CalendarPlusIcon />
        </EmptyStateIcon>
        <EmptyStateTitle>
          <Trans i18nKey="noPolls" />
        </EmptyStateTitle>
        <EmptyStateDescription>
          <Trans i18nKey="noPollsDescription" />
        </EmptyStateDescription>
      </EmptyState>
    );
  }

  return (
    <div className="-mx-3 divide-y overflow-hidden border-y bg-white sm:mx-0 sm:rounded-lg sm:border-x sm:shadow-sm">
      {table.getRowModel().rows.map((row) => (
        <div
          className="relative p-4 focus-within:bg-gray-50"
          key={row.id}
          data-state={row.getIsSelected() && "selected"}
        >
          <Link
            className="absolute inset-0 z-10 flex items-center gap-4"
            href={`/poll/${row.original.id}`}
          />
          <div className="flex gap-x-5">
            <div>
              <GroupPollIcon size="lg" />
            </div>
            <div className="flex min-w-0 grow justify-between gap-4">
              <div className="min-w-0 space-y-0.5">
                <div className="truncate text-base font-semibold">
                  {row.original.title}
                </div>
                <p className="text-muted-foreground whitespace-nowrap text-sm">
                  <Trans
                    i18nKey="createdTime"
                    values={{
                      relativeTime: dayjs(row.original.createdAt).fromNow(),
                    }}
                  />
                </p>
              </div>
              <div>
                <PollStatusBadge status={row.original.status} />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
