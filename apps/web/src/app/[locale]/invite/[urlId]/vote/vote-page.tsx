import { Card } from "@rallly/ui/card";
import { RandomGradientBar } from "@/components/random-gradient-bar";
import { Spinner } from "@/components/spinner";
import { EventSidebar } from "@/features/poll/invite/components/event-sidebar";
import { CreatorBanner } from "@/features/poll/vote/components/creator-banner";
import { VotePageFooter } from "@/features/poll/vote/components/vote-page-footer";
import { VotePanel } from "@/features/poll/vote/components/vote-panel";
import type { VotePageView } from "@/features/poll/vote/types";
import type { UserDTO } from "@/features/user/schema";

/**
 * Participant view as one card centered on a page that never scrolls: the
 * event details sit in a sidebar beside the voting panel on large screens
 * and stack above it below that.
 *
 * Everything but the panel renders on the server.
 */
export function VotePage({
  view,
  footerLinks,
  spaceId,
  hideAttribution,
  isCreator,
  requireParticipantEmail,
  user,
  spaceBrandingAllowed,
  instanceBranding,
}: {
  view: VotePageView;
  footerLinks: { label: string; href: string }[];
  spaceId: string | null;
  hideAttribution: boolean;
  isCreator: boolean;
  requireParticipantEmail: boolean;
  user: UserDTO | null;
  spaceBrandingAllowed: boolean;
  instanceBranding: { appName: string; logoIcon?: string };
}) {
  return (
    <div className="page-bg-gray-100 flex h-dvh flex-col items-center justify-center gap-3 overflow-hidden p-3 lg:p-6 dark:bg-gray-900">
      <main
        id="main-content"
        tabIndex={-1}
        className="flex min-h-0 w-full max-w-4xl flex-1 flex-col gap-3 lg:flex-initial"
      >
        {isCreator ? <CreatorBanner pollId={view.poll.id} /> : null}
        {/* The page never scrolls: the card takes the viewport on small
            screens and a fixed height on large ones (shrinking, footer
            included, when the viewport is shorter). The voting panel is a
            flex column whose results table is the only scroll area. */}
        <Card className="flex min-h-0 flex-1 flex-col lg:h-176 lg:flex-initial">
          <RandomGradientBar />
          <div className="flex min-h-0 flex-1 flex-col lg:grid lg:grid-cols-[16rem_1fr] lg:grid-rows-[minmax(0,1fr)]">
            <aside className="shrink-0 border-b p-4 lg:min-h-0 lg:overflow-y-auto lg:border-b-0">
              <EventSidebar
                poll={view.poll}
                spaceBrandingAllowed={spaceBrandingAllowed}
                instanceBranding={instanceBranding}
              />
            </aside>
            <section className="flex min-h-0 flex-1 flex-col lg:border-l">
              <VotePanel
                {...view}
                requireParticipantEmail={requireParticipantEmail}
                user={user}
              />
            </section>
          </div>
        </Card>
      </main>
      <div className="shrink-0">
        <VotePageFooter
          pollId={view.poll.id}
          spaceId={spaceId}
          hideAttribution={hideAttribution}
          footerLinks={footerLinks}
        />
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
