import { prisma } from "@rallly/database";
import { buttonVariants } from "@rallly/ui";
import { Badge } from "@rallly/ui/badge";
import { Icon } from "@rallly/ui/icon";
import { absoluteUrl } from "@rallly/utils/absolute-url";
import { ArrowLeftIcon, MapPinIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache, Suspense } from "react";
import { getCurrentUser } from "@/auth/data";
import { AddToCalendarButton } from "@/components/add-to-calendar-button";
import {
  EventMetaDescription,
  EventMetaItem,
  EventMetaList,
  EventMetaTitle,
} from "@/components/event-meta";
import { PollFooter } from "@/components/poll/poll-footer";
import { RandomGradientBar } from "@/components/random-gradient-bar";
import { BrandingStyle } from "@/features/branding/branding-style";
import { isScheduledEventEnabled } from "@/features/scheduled-event/constants";
import { SpaceIcon } from "@/features/space/components/space-icon";
import { Trans } from "@/i18n/client";
import { EventDateTime } from "./event-date-time";

const getScheduledEvent = cache(async (id: string) => {
  const event = await prisma.scheduledEvent.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      description: true,
      location: true,
      start: true,
      end: true,
      allDay: true,
      timeZone: true,
      status: true,
      deletedAt: true,
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
    },
  });

  if (!event || event.deletedAt) {
    notFound();
  }

  return event;
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
      <Icon>
        <ArrowLeftIcon />
      </Icon>
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

  return (
    <div className="page-bg-gray-100 relative flex min-h-dvh flex-col overflow-auto sm:dark:bg-gray-900">
      {brandingColor ? <BrandingStyle primaryColor={brandingColor} /> : null}
      <div className="p-3">
        <Suspense fallback={null}>
          <EventsBackLink />
        </Suspense>
      </div>
      <div className="flex-1 px-2 md:flex md:items-center md:justify-center">
        <div className="w-full max-w-md gap-4 overflow-hidden rounded-2xl border bg-card">
          <RandomGradientBar />
          <div className="relative p-4">
            <div className="absolute top-3 right-3">
              <StatusBadge status={event.status} hasEnded={hasEnded} />
            </div>
            <div>
              {isBranded ? (
                <div className="mb-4">
                  <SpaceIcon
                    name={event.space.name}
                    src={event.space.image ?? undefined}
                    size="xl"
                  />
                  <p className="mt-2 font-medium text-muted-foreground text-sm">
                    {event.space.name}
                  </p>
                </div>
              ) : null}
              <EventMetaTitle className="pr-24">{event.title}</EventMetaTitle>
              {event.user?.name ? (
                <p className="mt-1 text-muted-foreground text-sm">
                  <Trans
                    i18nKey="eventHostedBy"
                    defaults="Hosted by {name}"
                    values={{ name: event.user.name }}
                  />
                </p>
              ) : null}
              {event.description ? (
                <EventMetaDescription className="mt-4">
                  {event.description}
                </EventMetaDescription>
              ) : null}
              <EventMetaList className="mt-6">
                <EventDateTime
                  start={event.start}
                  end={event.end}
                  allDay={event.allDay}
                  timezone={event.timeZone || "UTC"}
                />
                {event.location ? (
                  <EventMetaItem>
                    <MapPinIcon />
                    {event.location}
                  </EventMetaItem>
                ) : null}
              </EventMetaList>
              <div className="mt-6">
                <AddToCalendarButton eventId={event.id} />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-auto py-6">
        <PollFooter />
      </div>
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
