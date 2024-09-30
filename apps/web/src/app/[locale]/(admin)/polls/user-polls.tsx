"use client";
import { PollStatus } from "@rallly/database";
import { RadioCards, RadioCardsItem } from "@rallly/ui/radio-pills";
import { CalendarPlusIcon } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { z } from "zod";

import {
  EmptyState,
  EmptyStateDescription,
  EmptyStateIcon,
  EmptyStateTitle,
} from "@/app/components/empty-state";
import { GroupPollCard } from "@/components/group-poll-card";
import { Spinner } from "@/components/spinner";
import { Trans } from "@/components/trans";
import { VisibilityTrigger } from "@/components/visibility-trigger";
import { trpc } from "@/utils/trpc/client";

function PollCount({ count }: { count?: number }) {
  return <span className="font-semibold">{count || 0}</span>;
}

function FilteredPolls({ status }: { status: PollStatus }) {
  const { data, fetchNextPage, hasNextPage } = trpc.polls.list.useInfiniteQuery(
    {
      status,
      limit: 30,
    },
    {
      suspense: true,
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      keepPreviousData: true,
    },
  );

  if (!data) {
    return <Spinner />;
  }

  if (data?.pages[0]?.polls.length === 0) {
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
    <div className="space-y-6">
      <ol className="space-y-4">
        {data.pages.map((page, i) => (
          <li key={i}>
            <div className="grid gap-4 md:grid-cols-2">
              {page.polls.map((poll) => (
                <GroupPollCard
                  key={poll.id}
                  title={poll.title}
                  pollId={poll.id}
                  status={poll.status}
                  inviteLink={`${window.location.origin}/invite/${poll.id}`}
                  responseCount={poll.participants.length}
                  dateStart={poll.dateRange.start}
                  dateEnd={poll.dateRange.end}
                />
              ))}
            </div>
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
    trpc.polls.getCountByStatus.useQuery(undefined, {
      suspense: true,
    });

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
