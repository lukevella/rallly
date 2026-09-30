import { MapPinIcon, User2Icon } from "lucide-react";
import { Trans } from "react-i18next/TransWithoutContext";
import { PollConferencingSummary } from "@/features/conferencing/components/poll-conferencing-summary";
import type { PollConferencing } from "@/features/conferencing/schema";
import {
  EventMetaDescription,
  EventMetaItem,
  EventMetaList,
  EventMetaTitle,
} from "@/features/poll/components/event-meta";
import TruncatedLinkify from "@/features/poll/components/truncated-linkify";
import { PoweredByLink } from "@/features/poll/vote/components/powered-by-link";
import { SpaceIcon } from "@/features/space/components/space-icon";
import { getTranslation } from "@/i18n/server";
import { VoteLegend } from "./vote-legend";

type SidebarPoll = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  conferencing: PollConferencing | null;
  event: { conferencingUri: string | null } | null;
  allowTentativeVotes: boolean;
  spaceId: string | null;
  user: { name: string } | null;
  space: { name: string; image: string | null; showBranding: boolean } | null;
};

/**
 * The event's identity in the vote page sidebar: branding chip, title,
 * description, organizer, location, video call and the vote legend, with attribution
 * and the theme switcher in a footer beneath them. Rendered on the server;
 * nothing here depends on the viewer's clock.
 */
export async function EventSidebar({
  poll,
  spaceBrandingAllowed,
  instanceBranding,
  hideAttribution,
}: {
  poll: SidebarPoll;
  spaceBrandingAllowed: boolean;
  instanceBranding: { appName: string; logoIcon?: string };
  hideAttribution: boolean;
}) {
  const { t, i18n } = await getTranslation();

  const brand =
    poll.space?.showBranding && poll.space.image
      ? { name: poll.space.name, image: poll.space.image }
      : // Instance branding is enforced: the space chip is suppressed, so
        // the slot carries the instance's logo icon and name instead.
        !spaceBrandingAllowed
        ? {
            name: instanceBranding.appName,
            image: instanceBranding.logoIcon ?? null,
          }
        : null;

  return (
    // The footer sits at the bottom of the sidebar, so the content above it
    // takes the leftover height.
    <div className="flex min-h-full flex-col">
      <div className="flex-1">
        {brand ? (
          <div className="mb-2">
            <SpaceIcon
              name={brand.name}
              src={brand.image ?? undefined}
              size="xl"
            />
            <p className="mt-2 font-medium text-muted-foreground text-sm">
              {brand.name}
            </p>
          </div>
        ) : null}
        <EventMetaTitle>{poll.title}</EventMetaTitle>
        <EventMetaDescription className="mt-4" content={poll.description} />
        <EventMetaList className="mt-4">
          {poll.user ? (
            <EventMetaItem>
              <User2Icon />
              <Trans
                t={t}
                i18n={i18n}
                ns="app"
                i18nKey="organizedBy"
                defaults="Organized by {name}"
                values={{ name: poll.user.name }}
              />
            </EventMetaItem>
          ) : null}
          {poll.location ? (
            <EventMetaItem>
              <MapPinIcon />
              <TruncatedLinkify>{poll.location}</TruncatedLinkify>
            </EventMetaItem>
          ) : null}
          {poll.conferencing ? (
            <EventMetaItem>
              <PollConferencingSummary
                conferencing={poll.conferencing}
                meetingUri={poll.event?.conferencingUri}
              />
            </EventMetaItem>
          ) : null}
        </EventMetaList>
        <div className="mt-4">
          <VoteLegend allowTentativeVotes={poll.allowTentativeVotes} />
        </div>
      </div>
      {/* Attribution can be turned off per instance or per space, and then
          the footer goes with it. The theme switcher lives on the page, not
          in the card. */}
      {hideAttribution ? null : (
        <div className="mt-6 flex justify-center">
          <PoweredByLink pollId={poll.id} spaceId={poll.spaceId} />
        </div>
      )}
    </div>
  );
}
