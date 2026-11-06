"use client";
import { cn } from "@rallly/ui";
import { Card, CardContent } from "@rallly/ui/card";
import { MapPinIcon, User2Icon } from "lucide-react";
import { RandomGradientBar } from "@/components/random-gradient-bar";
import { PollConferencingSummary } from "@/features/conferencing/components/poll-conferencing-summary";
import { usePoll } from "@/features/poll/client";
import {
  EventMetaItem,
  EventMetaList,
  EventMetaTitle,
} from "@/features/poll/components/event-meta";
import TruncatedLinkify from "@/features/poll/components/truncated-linkify";
import VoteIcon from "@/features/poll/components/vote-icon";
import { Trans } from "@/i18n/client";

function IconDescriptionList({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDListElement>) {
  return (
    <dl
      className={cn(
        "flex flex-wrap items-center gap-4 text-muted-foreground text-sm",
        className,
      )}
      {...props}
    >
      {children}
    </dl>
  );
}

function IconDescription({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <dt>{icon}</dt>
      <dd>{label}</dd>
    </div>
  );
}

/**
 * The event's identity: title, description, organizer and location.
 * `EventCard` frames it as a standalone card with the response legend; the vote page places it in the sidebar of the merged card.
 */
export function EventDetails({
  description,
}: {
  description: React.ReactNode;
}) {
  const poll = usePoll();
  return (
    <>
      <EventMetaTitle className="text-lg">{poll.title}</EventMetaTitle>
      {description}
      <EventMetaList className="mt-3">
        {poll.user ? (
          <EventMetaItem>
            <User2Icon />
            <Trans
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
    </>
  );
}

export function EventCard({ description }: { description: React.ReactNode }) {
  const poll = usePoll();
  return (
    <Card>
      <RandomGradientBar />
      <CardContent className="p-4 sm:p-5">
        <EventDetails description={description} />
        <h2 className="mt-3 mb-1.5 font-medium text-sm">
          <Trans i18nKey="responseOptions" defaults="Response options" />
        </h2>
        <IconDescriptionList aria-label="Response options">
          <IconDescription
            icon={<VoteIcon type="yes" />}
            label={<Trans i18nKey="yes" defaults="Yes" />}
          />
          {poll.allowTentativeVotes ? (
            <IconDescription
              icon={<VoteIcon type="ifNeedBe" />}
              label={<Trans i18nKey="ifNeedBe" defaults="If need be" />}
            />
          ) : null}
          <IconDescription
            icon={<VoteIcon type="no" />}
            label={<Trans i18nKey="no" defaults="No" />}
          />
        </IconDescriptionList>
      </CardContent>
    </Card>
  );
}
