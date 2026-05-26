"use client";

import { cn } from "@rallly/ui";
import { ActionBar, ActionBarOffset } from "@rallly/ui/action-bar";
import { Badge } from "@rallly/ui/badge";
import { Button } from "@rallly/ui/button";
import { Input } from "@rallly/ui/input";
import { Label } from "@rallly/ui/label";
import { CheckIcon, MapPinIcon, VideoIcon, XIcon } from "lucide-react";
import React from "react";
import TruncatedLinkify from "@/components/poll/truncated-linkify";
import { IfCloudHosted } from "@/contexts/environment";
import { ConferencingLink } from "@/features/conferencing/components/conferencing-link";
import type { Conferencing } from "@/features/conferencing/schema";
import type { Location } from "@/features/location/schema";
import { formatLocationText } from "@/features/location/utils";
import { Trans } from "@/i18n/client";
import type { Attendee } from "./attendee-rows";
import { AttendeeRows } from "./attendee-rows";
import { CreateEventPageAd } from "./create-event-page-ad";
import { EventDateLine } from "./event-header";
import {
  Section,
  SectionGroup,
  SectionItem,
  SectionItemLabel,
  SectionItemValue,
} from "./section";

type Status = "accepted" | "declined";

type EventData = {
  id: string;
  title: string;
  description: string | null;
  location: Location | null;
  conferencing: Conferencing | null;
  start: Date;
  end: Date;
  allDay: boolean;
  displayTimeZone: string | null;
  status: "confirmed" | "canceled" | "unconfirmed";
  hasEnded: boolean;
  organizerName: string | null;
  visibleAttendees: Attendee[];
};

const STATUS_OPTIONS: Record<
  Status,
  {
    icon: typeof CheckIcon;
    label: React.ReactNode;
    rowClass: string;
    iconClass: string;
  }
> = {
  accepted: {
    icon: CheckIcon,
    label: <Trans i18nKey="attendeeStatusGoing" defaults="Going" />,
    rowClass: "bg-green-50 dark:bg-green-950/30",
    iconClass: "text-green-600 dark:text-green-400",
  },
  declined: {
    icon: XIcon,
    label: <Trans i18nKey="rsvpNotGoing" defaults="Not going" />,
    rowClass: "bg-red-50 dark:bg-red-950/30",
    iconClass: "text-red-600 dark:text-red-400",
  },
};

export function EventWizard({ event }: { event: EventData }) {
  const [response, setResponse] = React.useState<Status | null>(null);

  return (
    <>
      <EventHeader event={event} />
      {response === null ? (
        <BrowseStep event={event} onPick={setResponse} />
      ) : (
        <ConfirmStep response={response} onChange={() => setResponse(null)} />
      )}
    </>
  );
}

function EventHeader({ event }: { event: EventData }) {
  return (
    <header className="flex gap-4 px-5 pb-6">
      <div className="w-1 rounded-xs bg-primary" />
      <div className="flex-1">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-balance font-semibold text-2xl text-foreground leading-tight tracking-tight sm:text-xl">
            {event.title}
          </h1>
          <StatusBadge status={event.status} hasEnded={event.hasEnded} />
        </div>
        {event.organizerName ? (
          <p className="mt-1 text-muted-foreground text-sm">
            <Trans
              i18nKey="eventOrganizedBy"
              defaults="Organized by {name}"
              values={{ name: event.organizerName }}
            />
          </p>
        ) : null}
        <EventDateLine
          start={event.start}
          end={event.end}
          allDay={event.allDay}
          timezone={event.displayTimeZone}
        />
      </div>
    </header>
  );
}

function StatusBadge({
  status,
  hasEnded,
}: {
  status: "confirmed" | "canceled" | "unconfirmed";
  hasEnded: boolean;
}) {
  if (status === "canceled") {
    return (
      <Badge variant="destructive">
        <Trans i18nKey="eventStatusCanceled" defaults="Canceled" />
      </Badge>
    );
  }
  if (hasEnded) {
    return (
      <Badge variant="default">
        <Trans i18nKey="eventStatusPast" defaults="Past" />
      </Badge>
    );
  }
  return (
    <Badge variant="green">
      <Trans i18nKey="eventStatusUpcoming" defaults="Upcoming" />
    </Badge>
  );
}

function BrowseStep({
  event,
  onPick,
}: {
  event: EventData;
  onPick: (status: Status) => void;
}) {
  return (
    <>
      <IfCloudHosted>
        <div className="px-3 pb-6">
          <CreateEventPageAd />
        </div>
      </IfCloudHosted>

      <div className="px-3 pb-3">
        <SectionGroup>
          {event.location || event.conferencing ? (
            <Section>
              {event.location ? (
                <SectionItem>
                  <SectionItemLabel>
                    <MapPinIcon />
                    <Trans i18nKey="location" defaults="Location" />
                  </SectionItemLabel>
                  <SectionItemValue className="text-foreground">
                    {formatLocationText(event.location)}
                  </SectionItemValue>
                </SectionItem>
              ) : null}
              {event.conferencing ? (
                <SectionItem>
                  <SectionItemLabel>
                    <VideoIcon />
                    <Trans i18nKey="conferencing" defaults="Conferencing" />
                  </SectionItemLabel>
                  <SectionItemValue className="overflow-hidden">
                    <ConferencingLink conferencing={event.conferencing} />
                  </SectionItemValue>
                </SectionItem>
              ) : null}
            </Section>
          ) : null}

          {event.description ? (
            <Section
              title={<Trans i18nKey="description" defaults="Description" />}
            >
              <SectionItem className="py-3">
                <p className="whitespace-pre-wrap text-pretty text-foreground text-sm leading-relaxed">
                  <TruncatedLinkify>{event.description}</TruncatedLinkify>
                </p>
              </SectionItem>
            </Section>
          ) : null}

          {event.visibleAttendees.length > 0 ? (
            <Section title={<Trans i18nKey="attendees" defaults="Attendees" />}>
              <SectionItem>
                <SectionItemLabel>
                  <Trans i18nKey="invited" defaults="Invited" />
                </SectionItemLabel>
                <SectionItemValue className="tabular-nums">
                  {event.visibleAttendees.length}
                </SectionItemValue>
              </SectionItem>
              <AttendeeRows attendees={event.visibleAttendees} />
            </Section>
          ) : null}
        </SectionGroup>
      </div>

      <ActionBarOffset />
      <ActionBar>
        <Button
          size="lg"
          variant="default"
          className="flex-1"
          onClick={() => onPick("declined")}
        >
          <XIcon />
          <Trans i18nKey="rsvpDecline" defaults="Decline" />
        </Button>
        <Button
          size="lg"
          variant="primary"
          className="flex-1"
          onClick={() => onPick("accepted")}
        >
          <CheckIcon />
          <Trans i18nKey="attendeeStatusGoing" defaults="Going" />
        </Button>
      </ActionBar>
    </>
  );
}

function ConfirmStep({
  response,
  onChange,
}: {
  response: Status;
  onChange: () => void;
}) {
  const option = STATUS_OPTIONS[response];
  const Icon = option.icon;

  return (
    <>
      <div className="px-3 pb-3">
        <SectionGroup>
          <Section>
            <div
              className={cn(
                "flex items-center gap-3 px-4 py-4",
                option.rowClass,
              )}
            >
              <Icon className={cn("size-6 shrink-0", option.iconClass)} />
              <p className="flex-1 font-semibold text-base text-foreground">
                <Trans
                  i18nKey="rsvpResponseHeading"
                  defaults="You're {label}"
                  values={{
                    label: response === "accepted" ? "going" : "declining",
                  }}
                />
              </p>
              <button
                type="button"
                onClick={onChange}
                className="font-medium text-muted-foreground text-sm hover:text-foreground"
              >
                <Trans i18nKey="rsvpChange" defaults="Change" />
              </button>
            </div>
          </Section>

          <Section
            title={<Trans i18nKey="yourDetails" defaults="Your details" />}
          >
            <SectionItem className="block py-4">
              <Label
                htmlFor="rsvp-name"
                className="text-muted-foreground text-xs"
              >
                <Trans i18nKey="name" defaults="Name" />
              </Label>
              <Input
                id="rsvp-name"
                className="mt-1.5"
                large
                placeholder="Your name"
                autoComplete="name"
              />
            </SectionItem>
            <SectionItem className="block py-4">
              <Label
                htmlFor="rsvp-email"
                className="text-muted-foreground text-xs"
              >
                <Trans i18nKey="email" defaults="Email" />
              </Label>
              <Input
                id="rsvp-email"
                className="mt-1.5"
                large
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
              />
            </SectionItem>
          </Section>
        </SectionGroup>
      </div>

      <ActionBarOffset />
      <ActionBar>
        <Button size="lg" variant="primary" className="flex-1">
          <Trans i18nKey="confirmResponse" defaults="Confirm response" />
        </Button>
      </ActionBar>
    </>
  );
}
