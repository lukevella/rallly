"use client";
import { Card, CardContent } from "@rallly/ui/card";
import { MapPinIcon, User2Icon } from "lucide-react";
import {
  EventMetaDescription,
  EventMetaItem,
  EventMetaList,
  EventMetaTitle,
} from "@/components/event-meta";
import TruncatedLinkify from "@/components/poll/truncated-linkify";
import VoteIcon from "@/components/poll/vote-icon";
import { RandomGradientBar } from "@/components/random-gradient-bar";
import { usePoll } from "@/contexts/poll";
import { SpaceIcon } from "@/features/space/components/space-icon";
import { Trans } from "@/i18n/client";

function IconDescriptionList({
  children,
  ...props
}: React.HTMLAttributes<HTMLDListElement>) {
  return (
    <dl
      className="flex flex-col gap-x-2 gap-y-1 text-muted-foreground text-xs"
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
      <CardContent className="flex flex-col gap-x-8 gap-y-4 md:flex-row">
        <div className="flex-1">
          {poll.space?.showBranding && poll.space.image ? (
            <div className="mb-2">
              <SpaceIcon
                name={poll.space.name}
                src={poll.space.image}
                size="lg"
              />
              <p className="mt-2 font-medium text-muted-foreground text-sm">
                {poll.space.name}
              </p>
            </div>
          ) : null}
          <div className="flex items-start justify-between gap-2">
            <EventMetaTitle>{poll.title}</EventMetaTitle>
          </div>
          {poll.description ? (
            <EventMetaDescription>{poll.description}</EventMetaDescription>
          ) : null}
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
        </div>
        <div className="w-full md:w-1/3">
          <h2 className="mb-2 font-medium text-sm">
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
        </div>
      </CardContent>
    </Card>
  );
}
