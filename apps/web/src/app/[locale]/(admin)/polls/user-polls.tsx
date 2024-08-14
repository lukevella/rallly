"use client";
import { PollStatus } from "@rallly/database";
import { CalendarPlusIcon } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Trans } from "react-i18next";
import { z } from "zod";

import { ListView } from "@/app/[locale]/(admin)/polls/grid-view";
import { StatusFilter } from "@/app/[locale]/(admin)/polls/status-filter";
import {
  EmptyState,
  EmptyStateDescription,
  EmptyStateIcon,
  EmptyStateTitle,
} from "@/app/components/empty-state";
import { Spinner } from "@/components/spinner";
import { VisibilityTrigger } from "@/components/visibility-trigger";
import { trpc } from "@/utils/trpc/client";

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
            <ListView
              data={page.polls}
              empty={
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
              }
            />
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
      <StatusFilter status={parsedPollStatus} onStatusChange={setPollStatus} />
      <FilteredPolls status={parsedPollStatus} />
    </div>
  );
}
