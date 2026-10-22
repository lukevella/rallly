"use client";

import { MapPinIcon } from "lucide-react";
import { OptimizedAvatarImage } from "@/components/optimized-avatar-image";
import { PollConferencingSummary } from "@/features/conferencing/components/poll-conferencing-summary";
import { usePoll } from "@/features/poll/client";
import {
  EventMetaItem,
  EventMetaList,
} from "@/features/poll/components/event-meta";
import TruncatedLinkify from "@/features/poll/components/truncated-linkify";
import { Trans } from "@/i18n/client";
import { Time } from "@/lib/datetime/time";

/**
 * The head of the Overview thread, like a pull request's description: a
 * header saying who created the poll and when, then what it is about. The
 * activity stems from under it, indented and quieter.
 */
export function PollDescriptionCard({
  description,
}: {
  description: React.ReactNode;
}) {
  const poll = usePoll();
  const name = poll.user?.name;
  const hasDetails = Boolean(
    poll.description || poll.location || poll.conferencing,
  );

  return (
    <div className="flex gap-3">
      <div className="shrink-0">
        <OptimizedAvatarImage
          size="lg"
          name={name ?? "?"}
          src={poll.user?.image ?? undefined}
        />
      </div>
      <div className="min-w-0 flex-1 overflow-hidden rounded-xl border border-card-border bg-card">
        <div className="flex flex-wrap items-baseline gap-x-1.5 border-card-border border-b bg-muted/50 px-4 py-2 text-sm">
          {name ? (
            <Trans
              i18nKey="pollDescriptionCardCreatedBy"
              defaults="<b>{name}</b> created this poll"
              values={{ name }}
              components={{ b: <b className="font-medium" /> }}
            />
          ) : (
            <Trans
              i18nKey="pollDescriptionCardCreated"
              defaults="Poll created"
            />
          )}
          <Time
            value={poll.createdAt}
            preset="datetime"
            className="text-muted-foreground text-xs"
          />
        </div>
        <div className="px-4 py-3">
          {hasDetails ? (
            <>
              {description}
              <EventMetaList className="mt-3">
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
            </>
          ) : (
            <p className="text-muted-foreground text-sm italic">
              <Trans
                i18nKey="pollDescriptionCardEmpty"
                defaults="No description provided."
              />
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
