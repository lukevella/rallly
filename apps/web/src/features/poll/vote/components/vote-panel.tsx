"use client";
import * as React from "react";
import { isOptionPastForViewer } from "@/features/poll/utils";
import { VoteEmptyState } from "@/features/poll/vote/components/vote-empty-state";
import { VoteForm } from "@/features/poll/vote/components/vote-form";
import { VoteOutcome } from "@/features/poll/vote/components/vote-outcome";
import { VotePanelFooter } from "@/features/poll/vote/components/vote-panel-footer";
import { VotePanelHeader } from "@/features/poll/vote/components/vote-panel-header";
import { VoteViewCalendar } from "@/features/poll/vote/components/vote-view-calendar";
import { VoteViewList } from "@/features/poll/vote/components/vote-view-list";
import { VoteViewWeek } from "@/features/poll/vote/components/vote-view-week";
import type {
  VotePageView,
  VoteResult,
  VoteViewId,
} from "@/features/poll/vote/types";
import { UserProvider } from "@/features/user/client";
import type { UserDTO } from "@/features/user/schema";
import { useHydrated } from "@/lib/datetime/use-hydrated";
import { getBrowserTimeZone } from "@/lib/utils/date-time-utils";

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

  // Safe to read the clock here: the panel renders only after hydration, so
  // this never runs during a server render.
  const now = new Date();
  const timeZone = getBrowserTimeZone();
  const pastOptionIds = new Set(
    results
      .filter((result) => isOptionPastForViewer(result, now, timeZone))
      .map((result) => result.optionId),
  );
  const isPast = (result: VoteResult) => pastOptionIds.has(result.optionId);
  const pastCount = pastOptionIds.size;
  // Only the displayed options are filtered. The form still holds a vote for
  // every option, so hiding one never drops it from the saved response.
  const visibleResults =
    hidePast && pastCount > 0
      ? results.filter((result) => !isPast(result))
      : results;

  // Every view takes these, so switching is a swap with nothing rewired.
  const viewProps = {
    poll,
    results: visibleResults,
    participantCount,
    response,
    canVote,
  };

  return (
    <UserProvider user={user}>
      <VoteForm
        pollId={poll.id}
        tier={poll.space?.tier}
        requireParticipantEmail={requireParticipantEmail}
        results={results}
        response={response}
        canVote={canVote}
        pastOptionIds={pastOptionIds}
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
              canVote={canVote}
            />
          </div>
        </VoteOutcome>
      </VoteForm>
    </UserProvider>
  );
}
