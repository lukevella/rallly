"use client";
import { PollStatus } from "@rallly/database";
import { RadioCards, RadioCardsItem } from "@rallly/ui/radio-pills";
import { GridIcon, ListIcon } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { z } from "zod";

import { PollsGridView } from "@/app/[locale]/(admin)/polls/grid-view";
import { PollsListView } from "@/app/[locale]/(admin)/polls/list-view";
import { PollStatusFilter } from "@/app/[locale]/(admin)/polls/poll-status-filter";
import { Spinner } from "@/components/spinner";
import { VisibilityTrigger } from "@/components/visibility-trigger";
import { trpc } from "@/utils/trpc/client";

type PollListView = "grid" | "list";

function FilteredPolls({
  status = "live",
  view = "list",
}: {
  status?: PollStatus;
  view?: PollListView;
}) {
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

  const Component = view === "list" ? PollsListView : PollsGridView;

  return (
    <ol className="space-y-4">
      {data.pages.map((page, i) => (
        <li key={i}>
          <Component data={page.polls} />
        </li>
      ))}
      {hasNextPage ? (
        <VisibilityTrigger onVisible={fetchNextPage}>
          <Spinner />
        </VisibilityTrigger>
      ) : null}
    </ol>
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
const pollViewScheme = z.enum(["list", "grid"]).catch("list");
const pollStatusQueryKey = "status";

export function UserPolls() {
  const [pollStatus, setPollStatus] = useQueryParam(pollStatusQueryKey);
  const parsedPollStatus = pollStatusSchema.parse(pollStatus);
  const [view, setView] = useQueryParam("view");
  const parsedView = pollViewScheme.parse(view);

  return (
    <div className="space-y-4">
      <div className="flex justify-between gap-4">
        <PollStatusFilter
          status={parsedPollStatus}
          onStatusChange={setPollStatus}
        />
        <RadioCards value={view ?? "list"} onValueChange={setView}>
          <RadioCardsItem value="list">
            <ListIcon className="size-4" />
          </RadioCardsItem>
          <RadioCardsItem value="grid">
            <GridIcon className="size-4" />
          </RadioCardsItem>
        </RadioCards>
      </div>
      <FilteredPolls status={parsedPollStatus} view={parsedView} />
    </div>
  );
}
