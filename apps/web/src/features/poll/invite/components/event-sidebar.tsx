import { MapPinIcon, User2Icon } from "lucide-react";
import { Trans } from "react-i18next/TransWithoutContext";
import {
  EventMetaDescription,
  EventMetaItem,
  EventMetaList,
  EventMetaTitle,
} from "@/features/poll/components/event-meta";
import TruncatedLinkify from "@/features/poll/components/truncated-linkify";
import { SpaceIcon } from "@/features/space/components/space-icon";
import { getTranslation } from "@/i18n/server";
import { VoteLegend } from "./vote-legend";

type SidebarPoll = {
  title: string;
  description: string | null;
  location: string | null;
  allowTentativeVotes: boolean;
  user: { name: string } | null;
  space: { name: string; image: string | null; showBranding: boolean } | null;
};

/**
 * The event's identity in the vote page sidebar: branding chip, title,
 * description, organizer, location and the vote legend. Rendered on the
 * server; nothing here depends on the viewer's clock.
 */
export async function EventSidebar({
  poll,
  spaceBrandingAllowed,
  instanceBranding,
}: {
  poll: SidebarPoll;
  spaceBrandingAllowed: boolean;
  instanceBranding: { appName: string; logoIcon?: string };
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
    <>
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
      </EventMetaList>
      <div className="mt-4">
        <VoteLegend allowTentativeVotes={poll.allowTentativeVotes} />
      </div>
    </>
  );
}
