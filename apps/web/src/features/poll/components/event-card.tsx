"use client";
import { Card, CardContent } from "@rallly/ui/card";
import { MapPinIcon, User2Icon } from "lucide-react";
import { RandomGradientBar } from "@/components/random-gradient-bar";
import { usePoll } from "@/features/poll/client";
import {
  EventMetaDescription,
  EventMetaItem,
  EventMetaList,
  EventMetaTitle,
} from "@/features/poll/components/event-meta";
import TruncatedLinkify from "@/features/poll/components/truncated-linkify";
import VoteIcon from "@/features/poll/components/vote-icon";
import { SpaceIcon } from "@/features/space/components/space-icon";
import { Trans } from "@/i18n/client";

function IconDescriptionList({
  children,
  ...props
}: React.HTMLAttributes<HTMLDListElement>) {
  return (
    <dl
      className="flex flex-col gap-x-2 gap-y-1 text-muted-foreground text-xs sm:flex-row"
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
    <div className="flex items-center gap-1">
      <dt>{icon}</dt>
      <dd>{label}</dd>
    </div>
  );
}

export function EventCard() {
  const poll = usePoll();
  return (
    <Card>
      <RandomGradientBar />
      <CardContent>
        {poll.space?.showBranding && poll.space.image ? (
          <div className="mb-2">
            <SpaceIcon
              name={poll.space.name}
              src={poll.space.image}
              size="xl"
            />
            <p className="mt-2 font-medium text-muted-foreground text-sm">
              {poll.space.name}
            </p>
          </div>
        ) : null}
        <div>
          <EventMetaTitle>{poll.title}</EventMetaTitle>
          <EventMetaDescription className="mt-2" content={poll.description} />
        </div>
        <EventMetaList className="mt-4">
          {poll.user ? (
            <EventMetaItem>
              <User2Icon />
              {poll.user.name}
            </EventMetaItem>
          ) : null}
          {poll.location ? (
            <EventMetaItem>
              <MapPinIcon />
              <TruncatedLinkify>{poll.location}</TruncatedLinkify>
            </EventMetaItem>
          ) : null}
        </EventMetaList>
        <h2 className="mt-4 mb-2 font-medium text-sm">
          <Trans i18nKey="responseOptions" defaults="Response Options" />
        </h2>
        <IconDescriptionList aria-label="Response Options">
          <IconDescription
            icon={<VoteIcon type="yes" />}
            label={<Trans i18nKey="yes" defaults="Yes" />}
          />
          <IconDescription
            icon={<VoteIcon type="ifNeedBe" />}
            label={<Trans i18nKey="ifNeedBe" defaults="If need be" />}
          />
          <IconDescription
            icon={<VoteIcon type="no" />}
            label={<Trans i18nKey="no" defaults="No" />}
          />
        </IconDescriptionList>
      </CardContent>
    </Card>
  );
}
