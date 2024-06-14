"use client";
import { PollStatus } from "@rallly/database";
import { cn } from "@rallly/ui";
import { Icon } from "@rallly/ui/icon";
import { RadioCards, RadioCardsItem } from "@rallly/ui/radio-pills";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import dayjs from "dayjs";
import { CalendarPlusIcon, CheckIcon, LinkIcon, UserIcon } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import React from "react";
import useCopyToClipboard from "react-use/lib/useCopyToClipboard";
import { z } from "zod";

import { GroupPollIcon } from "@/app/[locale]/(admin)/app-card";
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

type PendingEvent = {
  id: string;
  status: PollStatus;
  title: string;
  createdAt: Date;
  userId: string;
  participants: {
    id: string;
    name: string;
  }[];
};

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

  const { data, isFetching } = trpc.polls.list.useQuery(
    {
      status: parsedPollStatus,
    },
    {
      keepPreviousData: true,
    },
  );

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
      <div
        className={cn({
          "opacity-50 transition-opacity delay-100": isFetching,
        })}
      >
        {data ? <PollsListView data={data} /> : <Spinner />}
      </div>
    </div>
  );
}

function CopyLinkButton({ pollId }: { pollId: string }) {
  const [, copy] = useCopyToClipboard();
  const [didCopy, setDidCopy] = React.useState(false);

  if (didCopy) {
    return (
      <div className="inline-flex items-center gap-x-1.5 text-sm font-medium text-green-600">
        <CheckIcon className="size-4" />
        <Trans i18nKey="copied" />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        copy(`${window.location.origin}/invite/${pollId}`);
        setDidCopy(true);
        setTimeout(() => {
          setDidCopy(false);
        }, 1000);
      }}
      className="text-foreground inline-flex items-center gap-x-1.5 text-sm hover:underline"
    >
      <LinkIcon className="size-4" />

      <Trans i18nKey="copyLink" defaults="Copy Link" />
    </button>
  );
}

function ParticipantCount({ count }: { count: number }) {
  return (
    <div className="inline-flex items-center gap-x-1 text-sm font-medium">
      <Icon>
        <UserIcon />
      </Icon>
      <span>{count}</span>
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
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {table.getRowModel().rows.map((row) => (
        <div
          className={cn("overflow-hidden rounded-lg border bg-white p-1")}
          key={row.id}
        >
          <div className="relative space-y-4 p-3 focus-within:bg-gray-100">
            <div className="flex items-start justify-between">
              <GroupPollIcon size="sm" />
              <PollStatusBadge status={row.original.status} />
            </div>
            <div className="space-y-2">
              <h2 className="truncate text-base font-medium">
                <Link
                  href={`/poll/${row.original.id}`}
                  className="absolute inset-0 z-10"
                />
                {row.original.title}
              </h2>
              <ParticipantCount count={row.original.participants.length} />
            </div>
          </div>
          <div className="flex items-end justify-between p-3">
            <CopyLinkButton pollId={row.original.id} />
            <p className="text-muted-foreground whitespace-nowrap text-sm">
              <Trans
                i18nKey="createdTime"
                values={{
                  relativeTime: dayjs(row.original.createdAt).fromNow(),
                }}
              />
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
