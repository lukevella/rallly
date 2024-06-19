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

function PollCount({ count }: { count?: number }) {
  return <span className="font-semibold">{count || 0}</span>;
}

function FilteredPolls({ status }: { status: PollStatus }) {
  const { data, isFetching } = trpc.polls.list.useQuery(
    {
      status,
    },
    {
      keepPreviousData: true,
    },
  );

  if (!data) {
    return <Spinner />;
  }

  return (
    <div
      className={cn({
        "animate-pulse": isFetching,
      })}
    >
      <PollsListView data={data} />
    </div>
  );
}

function PollStatusMenu({
  status,
  onStatusChange,
}: {
  status?: PollStatus;
  onStatusChange?: (status: PollStatus) => void;
}) {
  const { data: countByStatus, isFetching } =
    trpc.polls.getCountByStatus.useQuery();

  if (!countByStatus) {
    return null;
  }

  return (
    <RadioCards value={status} onValueChange={onStatusChange}>
      <RadioCardsItem className="flex items-center gap-2.5" value="live">
        <Trans i18nKey="pollStatusOpen" />
        <PollCount count={countByStatus.live} />
      </RadioCardsItem>
      <RadioCardsItem className="flex items-center gap-2.5" value="paused">
        <Trans i18nKey="pollStatusPaused" />
        <PollCount count={countByStatus.paused} />
      </RadioCardsItem>
      <RadioCardsItem className="flex items-center gap-2.5" value="finalized">
        <Trans i18nKey="pollStatusFinalized" />
        <PollCount count={countByStatus.finalized} />
      </RadioCardsItem>
      {isFetching && <Spinner />}
    </RadioCards>
  );
}

function useQueryParam(name: string) {
  const searchParams = useSearchParams();
  return [
    searchParams?.get(name),
    function (value: string) {
      const newParams = new URLSearchParams(searchParams?.toString());
      newParams.set(name, value);
      window.history.replaceState(null, "", `?${newParams.toString()}`);
    },
  ] as const;
}

const pollStatusSchema = z.enum(["live", "paused", "finalized"]).catch("live");

const pollStatusQueryKey = "status";

export function UserPolls() {
  const [pollStatus, setPollStatus] = useQueryParam(pollStatusQueryKey);
  const parsedPollStatus = pollStatusSchema.parse(pollStatus);

  return (
    <div className="space-y-4">
      <PollStatusMenu
        status={parsedPollStatus}
        onStatusChange={setPollStatus}
      />
      <FilteredPolls status={parsedPollStatus} />
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

function PollsListView({
  data,
}: {
  data: {
    id: string;
    status: PollStatus;
    title: string;
    createdAt: Date;
    userId: string;
    participants: {
      id: string;
      name: string;
    }[];
  }[];
}) {
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
    <div className="grid gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
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
