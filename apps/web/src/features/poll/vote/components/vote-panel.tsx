"use client";
import * as React from "react";
import { VoteForm } from "@/features/poll/vote/components/vote-form";
import { VoteOutcome } from "@/features/poll/vote/components/vote-outcome";
import { VotePanelFooter } from "@/features/poll/vote/components/vote-panel-footer";
import { VotePanelHeader } from "@/features/poll/vote/components/vote-panel-header";
import { VoteViewCalendar } from "@/features/poll/vote/components/vote-view-calendar";
import { VoteViewList } from "@/features/poll/vote/components/vote-view-list";
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

  if (!hydrated) {
    return null;
  }

  // A calendar cell is a day, so only all-day polls can offer one; a time
  // poll would have several options on one cell.
  const isTimeSlot = (results[0]?.duration ?? 0) > 0;
  const views: VoteViewId[] = isTimeSlot ? ["list"] : ["list", "calendar"];
  const activeView = views.includes(view) ? view : "list";

  // Every view takes these, so switching is a swap with nothing rewired.
  const viewProps = { poll, results, participantCount, response, canVote };

  return (
    <UserProvider user={user}>
      <VoteForm
        pollId={poll.id}
        requireParticipantEmail={requireParticipantEmail}
        results={results}
        response={response}
        canVote={canVote}
      >
        <VoteOutcome poll={poll}>
          <div className="flex min-h-0 flex-1 flex-col">
            <VotePanelHeader
              poll={poll}
              results={results}
              response={response}
              canVote={canVote}
              views={views}
              view={activeView}
              onViewChange={setView}
            />
            {activeView === "calendar" ? (
              <VoteViewCalendar {...viewProps} />
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
