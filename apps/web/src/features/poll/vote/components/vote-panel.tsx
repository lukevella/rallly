"use client";
import * as React from "react";
import { usePastOptions } from "@/features/poll/client";
import { AllOptionsPastNotice } from "@/features/poll/components/past-option-vote";
import { VoteEmptyState } from "@/features/poll/vote/components/vote-empty-state";
import { VoteForm } from "@/features/poll/vote/components/vote-form";
import { VoteOutcome } from "@/features/poll/vote/components/vote-outcome";
import { VotePanelFooter } from "@/features/poll/vote/components/vote-panel-footer";
import { VotePanelHeader } from "@/features/poll/vote/components/vote-panel-header";
import { VoteViewCalendar } from "@/features/poll/vote/components/vote-view-calendar";
import { VoteViewList } from "@/features/poll/vote/components/vote-view-list";
import { VoteViewWeek } from "@/features/poll/vote/components/vote-view-week";
import type { VotePageView, VoteViewId } from "@/features/poll/vote/types";
import { UserProvider } from "@/features/user/client";
import type { UserDTO } from "@/features/user/schema";
import { useHydrated } from "@/lib/datetime/use-hydrated";

/**
 * The voting panel: a header, the results table as the scroll area, and a
 * footer. Client only, and it renders nothing until hydration: option times
 * are formatted in the viewer's zone, which the server cannot know, so
 * server rendering them would show a time the browser then corrects.
 */
export function VotePanel({
  poll,
  results,
  participantCount,
  response,
  canVote,
  requireParticipantEmail,
  user,
}: VotePageView & {
  requireParticipantEmail: boolean;
  /** Signing in as a guest happens here, so the viewer is client state. */
  user: UserDTO | null;
}) {
  const hydrated = useHydrated();
  const [view, setView] = React.useState<VoteViewId>("list");
  const [hidePast, setHidePast] = React.useState(false);
  const options = React.useMemo(
    () => results.map((result) => ({ ...result, id: result.optionId })),
    [results],
  );
  const pastOptionIds = usePastOptions(options, poll.timeZone);

  if (!hydrated) {
    return null;
  }

  // A month cell is a day, so only all-day polls can offer a calendar; a
  // time poll would have several options on one cell and gets the week
  // view instead, which has room to stack them.
  const isTimeSlot = (results[0]?.duration ?? 0) > 0;
  const views: VoteViewId[] = isTimeSlot
    ? ["list", "week"]
    : ["list", "calendar"];
  const activeView = views.includes(view) ? view : "list";

  const pastCount = pastOptionIds.size;
  const allOptionsPast = results.length > 0 && pastCount === results.length;
  // Only the displayed options are filtered. The form still holds a vote for
  // every option, so hiding one never drops it from the saved response.
  const visibleResults =
    hidePast && pastCount > 0
      ? results.filter((result) => !pastOptionIds.has(result.optionId))
      : results;

  // Every view takes these, so switching is a swap with nothing rewired.
  const viewProps = {
    poll,
    results: visibleResults,
    participantCount,
    response,
    canVote,
    pastOptionIds,
  };

  return (
    <UserProvider user={user}>
      <VoteForm
        pollId={poll.id}
        tier={poll.space?.tier}
        requireParticipantEmail={requireParticipantEmail}
        results={results}
        response={response}
        canVote={canVote && !allOptionsPast}
      >
        <VoteOutcome poll={poll}>
          <div className="flex min-h-0 flex-1 flex-col">
            <VotePanelHeader
              poll={poll}
              results={results}
              views={views}
              view={activeView}
              onViewChange={setView}
              pastCount={pastCount}
              hidePast={hidePast}
              onHidePastChange={setHidePast}
            />
            {canVote && allOptionsPast ? (
              <div className="px-4 pb-2">
                <AllOptionsPastNotice />
              </div>
            ) : null}
            {visibleResults.length === 0 ? (
              <VoteEmptyState
                isTimeSlot={isTimeSlot}
                hiddenByFilter={results.length > 0}
                onShowAll={() => setHidePast(false)}
              />
            ) : activeView === "calendar" ? (
              <VoteViewCalendar {...viewProps} />
            ) : activeView === "week" ? (
              <VoteViewWeek {...viewProps} />
            ) : (
              <VoteViewList {...viewProps} />
            )}
            <VotePanelFooter
              poll={poll}
              results={results}
              response={response}
              canVote={canVote && (response !== null || !allOptionsPast)}
            />
          </div>
        </VoteOutcome>
      </VoteForm>
    </UserProvider>
  );
}
