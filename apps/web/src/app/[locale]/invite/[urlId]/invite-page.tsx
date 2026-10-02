"use client";
import { Spinner } from "@/components/spinner";
import { EventCard } from "@/features/poll/components/event-card";
import { PollFooter } from "@/features/poll/components/poll-footer";
import { ResponsiveResults } from "@/features/poll/components/responsive-results";
import { VotingForm } from "@/features/poll/components/voting-form";
import { CreatorBanner } from "@/features/poll/invite/components/creator-banner";
import { FloatingComments } from "@/features/poll/invite/components/floating-comments";
import { useHydrated } from "@/lib/datetime/use-hydrated";

/**
 * The voting grid depends on two things the server cannot know: the
 * viewer's zone and Intl output for the option dates, and the viewport
 * breakpoint that picks the desktop or mobile layout. Rather than render the
 * rest of the page around a placeholder and let the grid shift it, the
 * whole page waits for hydration behind the same spinner the route streams
 * while its data loads, so there is one loader from first byte to
 * interactive. The page's server props are already in the tree by then, so
 * nothing else is fetched.
 */
export function InvitePage({
  footerLinks,
}: {
  footerLinks: { label: string; href: string }[];
}) {
  const hydrated = useHydrated();

  if (!hydrated) {
    return <InvitePageLoading />;
  }

  return (
    <div className="page-bg-gray-100 relative h-dvh overflow-auto p-3 lg:p-6 dark:bg-gray-900">
      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto w-full max-w-4xl space-y-3"
      >
        <CreatorBanner />
        <EventCard />
        <VotingForm>
          <ResponsiveResults />
          <FloatingComments />
        </VotingForm>
        <PollFooter footerLinks={footerLinks} />
        <div className="h-24 lg:hidden" />
      </main>
    </div>
  );
}

export function InvitePageLoading() {
  return (
    <div className="flex h-screen items-center justify-center">
      <Spinner />
    </div>
  );
}
