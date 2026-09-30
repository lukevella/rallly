import { Card } from "@rallly/ui/card";
import { Spinner } from "@/components/spinner";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { EventSidebar } from "@/features/poll/invite/components/event-sidebar";
import { ManagePollButton } from "@/features/poll/vote/components/manage-poll-button";
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
  hideAttribution,
  canManage,
  requireParticipantEmail,
  user,
  spaceBrandingAllowed,
  instanceBranding,
}: {
  view: VotePageView;
  footerLinks: { label: string; href: string }[];
  hideAttribution: boolean;
  /** Owner, or a member of the poll's space when that space is shared. */
  canManage: boolean;
  requireParticipantEmail: boolean;
  user: UserDTO | null;
  spaceBrandingAllowed: boolean;
  instanceBranding: { appName: string; logoIcon?: string };
}) {
  return (
    // Below lg the page itself scrolls and the card gives up its frame,
    // so a phone spends every pixel on the options. From lg up the card is
    // a fixed size centred in a page that never scrolls.
    <div className="page-bg-gray-100 flex min-h-dvh flex-col lg:h-dvh lg:min-h-0 lg:items-center lg:justify-center lg:gap-3 lg:overflow-hidden lg:p-6 dark:bg-gray-900">
      <main
        id="main-content"
        tabIndex={-1}
        className="flex w-full flex-1 flex-col lg:min-h-0 lg:max-w-5xl lg:flex-initial lg:gap-3"
      >
        {/* In the flow rather than pinned to the page corner, which lands
            on the card whenever the gutter beside it is narrower than
            these controls. */}
        <div className="flex items-center justify-end gap-2 p-3 lg:p-0">
          <ThemeSwitcher />
          {canManage ? <ManagePollButton pollId={view.poll.id} /> : null}
        </div>
        {/* max-lg:overflow-visible: the card clips its rounded corners, which
            would also stop the panel footer sticking to the viewport while
            the page scrolls. There are no corners to clip at that width. */}
        <Card className="flex flex-1 flex-col max-lg:overflow-visible max-lg:rounded-none max-lg:border-x-0 max-lg:border-t-0 max-lg:shadow-none lg:h-176 lg:min-h-0 lg:flex-initial">
          <div className="flex flex-1 flex-col lg:grid lg:min-h-0 lg:grid-cols-[20rem_1fr] lg:grid-rows-[minmax(0,1fr)]">
            <aside className="shrink-0 border-b p-4 lg:min-h-0 lg:overflow-y-auto lg:border-b-0">
              <EventSidebar
                poll={view.poll}
                spaceBrandingAllowed={spaceBrandingAllowed}
                instanceBranding={instanceBranding}
                hideAttribution={hideAttribution}
              />
            </aside>
            <section className="flex flex-1 flex-col lg:min-h-0 lg:border-l">
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
        <VotePageFooter footerLinks={footerLinks} />
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
