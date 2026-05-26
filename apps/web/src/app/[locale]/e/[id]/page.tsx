import { prisma } from "@rallly/database";
import { buttonVariants } from "@rallly/ui";
import {
  ActionBar,
  ActionBarOffset,
  ActionBarSpacer,
} from "@rallly/ui/action-bar";
import { Badge } from "@rallly/ui/badge";
import { Button } from "@rallly/ui/button";
import { absoluteUrl } from "@rallly/utils/absolute-url";
import { ArrowLeftIcon, MapPinIcon, VideoIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache, Suspense } from "react";
import { getCurrentUser } from "@/auth/data";
import { AddToCalendarButton } from "@/components/add-to-calendar-button";
import TruncatedLinkify from "@/components/poll/truncated-linkify";
import { BrandingStyle } from "@/features/branding/branding-style";
import { ConferencingLink } from "@/features/conferencing/components/conferencing-link";
import { formatLocationText } from "@/features/location/utils";
import { isScheduledEventEnabled } from "@/features/scheduled-event/constants";
import { createScheduledEventDTO } from "@/features/scheduled-event/data";
import { SpaceIcon } from "@/features/space/components/space-icon";
import { Trans } from "@/i18n/client";
import { AttendeeRows } from "./attendee-rows";
import { EventDateLine } from "./event-header";
import {
  Section,
  SectionGroup,
  SectionItem,
  SectionItemLabel,
  SectionItemValue,
} from "./section";

const getScheduledEvent = cache(async (id: string) => {
  const event = await prisma.scheduledEvent.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      description: true,
      location: true,
      conferencing: true,
      start: true,
      end: true,
      allDay: true,
      timeZone: true,
      status: true,
      deletedAt: true,
      hideAttendees: true,
      user: {
        select: {
          name: true,
        },
      },
      space: {
        select: {
          name: true,
          image: true,
          showBranding: true,
          primaryColor: true,
        },
      },
      invites: {
        select: {
          id: true,
          inviteeName: true,
          status: true,
          user: {
            select: {
              image: true,
            },
          },
        },
      },
    },
  });

  if (!event || event.deletedAt) {
    notFound();
  }

  return {
    ...event,
    ...createScheduledEventDTO(event),
  };
});

async function EventsBackLink() {
  const user = await getCurrentUser();
  if (!user) {
    return null;
  }
  return (
    <Link
      href="/events"
      className={buttonVariants({ variant: "ghost", size: "sm" })}
    >
      <ArrowLeftIcon data-icon="inline-start" />
      <Trans i18nKey="events" defaults="Events" />
    </Link>
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

export default async function EventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!isScheduledEventEnabled) {
    notFound();
  }
  const { id } = await params;
  const event = await getScheduledEvent(id);

  const isBranded = event.space.showBranding && !!event.space.image;
  const brandingColor =
    event.space.showBranding && event.space.primaryColor
      ? event.space.primaryColor
      : null;
  const hasEnded = event.end < new Date();
  const visibleAttendees = event.hideAttendees
    ? []
    : event.invites.filter((i) => i.status !== "pending");

  return (
    <div className="page-bg-gray-50 flex min-h-dvh flex-col antialiased dark:bg-gray-900">
      {brandingColor ? <BrandingStyle primaryColor={brandingColor} /> : null}

      <div className="flex items-center gap-4 p-3 sm:pb-6">
        <Suspense fallback={null}>
          <EventsBackLink />
        </Suspense>
      </div>

      <div className="mx-auto w-full max-w-xl flex-1">
        {isBranded ? (
          <div className="flex items-center gap-2 p-3 py-4">
            <SpaceIcon
              name={event.space.name}
              src={event.space.image ?? undefined}
              size="md"
            />
            <p className="font-medium text-muted-foreground text-sm">
              {event.space.name}
            </p>
          </div>
        ) : null}
        <header className="flex gap-4 px-5 pb-6">
          <div className="w-1 rounded-xs bg-primary" />
          <div className="flex-1">
            <div className="flex items-start justify-between gap-3">
              <h1 className="text-balance font-semibold text-2xl text-foreground leading-tight tracking-tight sm:text-xl">
                {event.title}
              </h1>
              <StatusBadge status={event.status} hasEnded={hasEnded} />
            </div>
            {event.user?.name ? (
              <p className="mt-1 text-muted-foreground text-sm">
                <Trans
                  i18nKey="eventOrganizedBy"
                  defaults="Organized by {name}"
                  values={{ name: event.user.name }}
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

            {visibleAttendees.length > 0 ? (
              <Section
                title={<Trans i18nKey="attendees" defaults="Attendees" />}
              >
                <SectionItem>
                  <SectionItemLabel>
                    <Trans i18nKey="invited" defaults="Invited" />
                  </SectionItemLabel>
                  <SectionItemValue className="tabular-nums">
                    {visibleAttendees.length}
                  </SectionItemValue>
                </SectionItem>
                <AttendeeRows
                  attendees={visibleAttendees.map((invite) => ({
                    id: invite.id,
                    name: invite.inviteeName,
                    image: invite.user?.image ?? undefined,
                    status: invite.status,
                  }))}
                />
              </Section>
            ) : null}
          </SectionGroup>
          <ActionBarOffset />
        </div>
      </div>

      <ActionBar>
        <AddToCalendarButton eventId={event.id} size="lg" />
        <ActionBarSpacer />
        <Button size="lg">Decline</Button>
        <Button variant="primary" size="lg">
          Accept
        </Button>
      </ActionBar>
    </div>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const event = await getScheduledEvent(id);

  return {
    title: event.title,
    metadataBase: new URL(absoluteUrl()),
  };
}
