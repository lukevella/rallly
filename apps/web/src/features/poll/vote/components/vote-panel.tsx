"use client";
import { VoteForm } from "@/features/poll/vote/components/vote-form";
import { VoteOutcome } from "@/features/poll/vote/components/vote-outcome";
import { VotePanelFooter } from "@/features/poll/vote/components/vote-panel-footer";
import { VotePanelHeader } from "@/features/poll/vote/components/vote-panel-header";
import { VoteResults } from "@/features/poll/vote/components/vote-results";
import type { VotePageView } from "@/features/poll/vote/types";
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

  if (!hydrated) {
    return null;
  }

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
            />
            <VoteResults
              poll={poll}
              results={results}
              response={response}
              canVote={canVote}
            />
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
