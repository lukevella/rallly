"use client";
import { PollStatus } from "@rallly/database";
import { cn } from "@rallly/ui";
import { Badge } from "@rallly/ui/badge";
import { Button } from "@rallly/ui/button";
import { Icon } from "@rallly/ui/icon";
import { RadioCards, RadioCardsItem } from "@rallly/ui/radio-pills";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
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
import { VisibilityTrigger } from "@/components/visibility-trigger";
import { trpc } from "@/utils/trpc/client";

function PollCount({ count }: { count?: number }) {
  return <span className="font-semibold">{count || 0}</span>;
}

function FilteredPolls({ status }: { status: PollStatus }) {
  const { data, fetchNextPage, hasNextPage } =
    trpc.polls.infiniteList.useInfiniteQuery(
      {
        status,
        limit: 30,
      },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
        keepPreviousData: true,
      },
    );

  if (!data) {
    return <Spinner />;
  }

  return (
    <div className="space-y-6">
      <ol className="space-y-4">
        {data.pages.map((page, i) => (
          <li key={i}>
            <PollsListView data={page.polls} />
          </li>
        ))}
      </ol>
      {hasNextPage ? (
        <VisibilityTrigger onVisible={fetchNextPage} className="mt-6">
          <Spinner />
        </VisibilityTrigger>
      ) : null}
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

  return (
    <Button
      type="button"
      disabled={didCopy}
      onClick={(e) => {
        e.stopPropagation();
        copy(`${window.location.origin}/invite/${pollId}`);
        setDidCopy(true);
        setTimeout(() => {
          setDidCopy(false);
        }, 1000);
      }}
      className="relative z-20 w-full"
    >
      {didCopy ? (
        <>
          <CheckIcon className="size-4" />

          <Trans i18nKey="copied" defaults="Copied" />
        </>
      ) : (
        <>
          <LinkIcon className="size-4" />
          <Trans i18nKey="copyLink" defaults="Copy Link" />
        </>
      )}
    </Button>
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
    <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
      {table.getRowModel().rows.map((row) => (
        <div
          className={cn(
            "group relative space-y-4 overflow-hidden rounded-lg border bg-white p-4 focus-within:bg-gray-50",
          )}
          key={row.id}
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <GroupPollIcon size="xs" />
              <h2 className="truncate text-base font-medium group-hover:underline">
                <Link
                  href={`/poll/${row.original.id}`}
                  className="absolute inset-0 z-10"
                />
                {row.original.title}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <Badge size="lg">
                <PollStatusBadge status={row.original.status} />
              </Badge>
              <Badge size="lg">
                <ParticipantCount count={row.original.participants.length} />
              </Badge>
            </div>
          </div>
          <div className="flex items-end justify-between">
            <CopyLinkButton pollId={row.original.id} />
          </div>
        </div>
      ))}
    </div>
  );
}
