"use client";
import { Card } from "@rallly/ui/card";
import { RandomGradientBar } from "@/components/random-gradient-bar";
import { Spinner } from "@/components/spinner";
import { EventDetails } from "@/features/poll/components/event-card";
import { PollFooter } from "@/features/poll/components/poll-footer";
import { PollOutcome } from "@/features/poll/components/poll-outcome";
import { VoteOptions } from "@/features/poll/components/vote-options";
import { VotingInterface } from "@/features/poll/components/voting/voting-interface";
import { VotingForm } from "@/features/poll/components/voting-form";
import { CreatorBanner } from "@/features/poll/invite/components/creator-banner";
import { FloatingComments } from "@/features/poll/invite/components/floating-comments";
import { useHydrated } from "@/lib/datetime/use-hydrated";

/**
 * Participant view as one card centered on a page that never scrolls: the
 * event details sit in a sidebar beside the voting list on large screens
 * and stack above it below that, and the card's body is the scroll area.
 * The list renders Intl output for the option dates in the viewer's zone, which the
 * server cannot know, so the page waits for hydration behind the same
 * spinner the route streams while its data loads.
 */
export function VotePage({
  footerLinks,
}: {
  footerLinks: { label: string; href: string }[];
}) {
  const hydrated = useHydrated();

  if (!hydrated) {
    return <VotePageLoading />;
  }

  return (
    <div className="page-bg-gray-100 flex h-dvh flex-col items-center justify-center gap-3 overflow-hidden p-3 lg:p-6 dark:bg-gray-900">
      <main
        id="main-content"
        tabIndex={-1}
        className="flex min-h-0 w-full max-w-4xl flex-1 flex-col gap-3 lg:flex-initial"
      >
        <CreatorBanner />
        {/* The page never scrolls: the card takes the viewport on small
            screens and a fixed height on large ones (shrinking, footer
            included, when the viewport is shorter). The voting panel is a
            flex column whose options table is the only scroll area; its
            header and footer are pushed into place by the layout. */}
        <Card className="flex min-h-0 flex-1 flex-col lg:h-[44rem] lg:flex-initial">
          <RandomGradientBar />
          <div className="flex min-h-0 flex-1 flex-col lg:grid lg:grid-cols-[20rem_1fr] lg:grid-rows-[minmax(0,1fr)]">
            <aside className="shrink-0 border-b p-4 lg:min-h-0 lg:overflow-y-auto lg:border-b-0">
              <EventDetails />
              <div className="mt-4">
                <VoteOptions />
              </div>
            </aside>
            {/* VotingForm renders its (empty) form element beside its
                children, so the grid cell wraps it rather than the reverse. */}
            <section className="flex min-h-0 flex-1 flex-col lg:border-l">
              <VotingForm>
                <PollOutcome>
                  <VotingInterface />
                </PollOutcome>
                <FloatingComments liftAtAllWidths />
              </VotingForm>
            </section>
          </div>
        </Card>
      </main>
      <div className="shrink-0">
        <PollFooter footerLinks={footerLinks} />
      </div>
    </div>
  );
}

export function VotePageLoading() {
  return (
    <div className="flex h-screen items-center justify-center">
      <Spinner />
    </div>
  );
}
