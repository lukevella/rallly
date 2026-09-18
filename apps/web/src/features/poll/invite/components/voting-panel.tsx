"use client";
import { PollOutcome } from "@/features/poll/components/poll-outcome";
import { VotingInterface } from "@/features/poll/components/voting/voting-interface";
import { VotingForm } from "@/features/poll/components/voting-form";
import { FloatingComments } from "@/features/poll/invite/components/floating-comments";
import { useHydrated } from "@/lib/datetime/use-hydrated";

/**
 * The voting panel, client only. Option dates are formatted in the viewer's
 * zone, which the server cannot know, so nothing renders until hydration
 * rather than showing a time the browser would then correct.
 */
export function VotingPanel() {
  const hydrated = useHydrated();

  if (!hydrated) {
    return null;
  }

  return (
    // VotingForm renders its (empty) form element beside its children, so
    // the column wraps it rather than the reverse.
    <VotingForm>
      <PollOutcome>
        <VotingInterface />
      </PollOutcome>
      <FloatingComments liftAtAllWidths />
    </VotingForm>
  );
}
