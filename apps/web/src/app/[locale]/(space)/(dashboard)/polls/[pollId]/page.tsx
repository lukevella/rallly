import { Card } from "@rallly/ui/card";
import { Skeleton } from "@rallly/ui/skeleton";
import { Suspense } from "react";
import { PollDatesList } from "@/features/poll/components/poll-dates-list";
import { PollResultsGrid } from "@/features/poll/components/poll-results-grid";
import { PollResultsMonth } from "@/features/poll/components/poll-results-month";
import { PollResultsViewSwitch } from "@/features/poll/components/poll-results-view-switch";
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
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center justify-between gap-4 px-4 py-3 md:px-6">
        <PollResultsViewSwitch pollId={pollId} view={view} />
        {results.participantCount === 0 ? (
          <p className="text-muted-foreground text-sm">
            <Trans i18nKey="pollOverviewNoVotes" defaults="No votes yet" />
          </p>
        ) : null}
      </div>
      <div className="min-h-0 flex-1">
        {view === "list" ? (
          <div className="h-full overflow-y-auto">
            <PollDatesList
              kind={results.kind}
              options={results.options}
              participantCount={results.participantCount}
              timeZone={poll.timeZone}
            />
          </div>
        ) : (
          <div className="h-full px-4 pb-4 md:px-6 md:pb-6">
            <Card className="h-full">
              {results.kind === "date" ? (
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
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
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
