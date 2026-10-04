import { Skeleton } from "@rallly/ui/skeleton";
import { Suspense } from "react";
import { PollResultsGrid } from "@/features/poll/components/poll-results-grid";
import { PollResultsList } from "@/features/poll/components/poll-results-list";
import { PollResultsMonth } from "@/features/poll/components/poll-results-month";
import { PollResultsTabs } from "@/features/poll/components/poll-results-tabs";
import { loadPoll, loadPollResults } from "@/features/poll/loaders";
import { Trans } from "@/i18n/client";

async function Results({
  params,
  searchParams,
}: {
  params: Promise<{ pollId: string }>;
  searchParams: Promise<{ view?: string }>;
}) {
  const [{ pollId }, { view: viewParam }] = await Promise.all([
    params,
    searchParams,
  ]);
  const view = viewParam === "list" ? "list" : "grid";
  const [poll, results] = await Promise.all([
    loadPoll(pollId),
    loadPollResults(pollId),
  ]);

  return (
    <PollResultsTabs
      defaultView={view}
      aside={
        results.participantCount === 0 ? (
          <p className="text-muted-foreground text-sm">
            <Trans i18nKey="pollOverviewNoVotes" defaults="No votes yet" />
          </p>
        ) : null
      }
      grid={
        results.kind === "date" ? (
          <PollResultsMonth
            options={results.options}
            participantCount={results.participantCount}
          />
        ) : (
          <PollResultsGrid
            options={results.options}
            participantCount={results.participantCount}
            timeZone={poll.timeZone}
          />
        )
      }
      list={
        <PollResultsList
          kind={results.kind}
          options={results.options}
          participantCount={results.participantCount}
          timeZone={poll.timeZone}
        />
      }
    />
  );
}

export default function Page({
  params,
  searchParams,
}: {
  params: Promise<{ pollId: string }>;
  searchParams: Promise<{ view?: string }>;
}) {
  return (
    <Suspense fallback={<Skeleton className="m-6 h-96" />}>
      <Results params={params} searchParams={searchParams} />
    </Suspense>
  );
}
