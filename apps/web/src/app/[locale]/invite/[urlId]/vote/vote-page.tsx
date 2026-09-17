"use client";
import { Card } from "@rallly/ui/card";
import { RandomGradientBar } from "@/components/random-gradient-bar";
import { Spinner } from "@/components/spinner";
import { EventDetails } from "@/features/poll/components/event-card";
import { PollFooter } from "@/features/poll/components/poll-footer";
import { PollOutcome } from "@/features/poll/components/poll-outcome";
import { VotingForm } from "@/features/poll/components/voting-form";
import { VotingList } from "@/features/poll/components/voting-list";
import { CreatorBanner } from "@/features/poll/invite/components/creator-banner";
import { FloatingComments } from "@/features/poll/invite/components/floating-comments";
import { useHydrated } from "@/lib/datetime/use-hydrated";

/**
 * Participant view as one card: the event details sit in a sidebar beside
 * the voting list on large screens and stack above it below that. The list
 * renders Intl output for the option dates in the viewer's zone, which the
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
    <div className="page-bg-gray-100 relative h-dvh overflow-auto p-3 lg:p-6 dark:bg-gray-900">
      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto w-full max-w-4xl space-y-3"
      >
        <CreatorBanner />
        {/* Sticky sidebar and the list's sticky footer both need the card
            to stay out of their way as a scroll ancestor. */}
        <Card className="overflow-visible">
          <RandomGradientBar />
          <div className="lg:grid lg:grid-cols-[20rem_1fr]">
            {/* The divider belongs to the list column: the sidebar is
                self-start so it can stick, which leaves it shorter than the
                row whenever the list is taller. */}
            <aside className="border-b p-4 lg:sticky lg:top-0 lg:self-start lg:border-b-0">
              <EventDetails />
            </aside>
            {/* VotingForm renders its (empty) form element beside its
                children, so the grid cell wraps it rather than the reverse. */}
            <section className="min-w-0 lg:border-l">
              <VotingForm>
                <PollOutcome>
                  <VotingList />
                </PollOutcome>
                <FloatingComments liftAtAllWidths />
              </VotingForm>
            </section>
          </div>
        </Card>
        <PollFooter footerLinks={footerLinks} />
        <div className="h-24 lg:hidden" />
      </main>
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
