import { buttonVariants } from "@rallly/ui";
import { absoluteUrl } from "@rallly/utils/absolute-url";
import { ArrowLeftIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache, Suspense } from "react";
import { getCurrentUser } from "@/auth/data";
import { BrandingStyle } from "@/features/branding/branding-style";
import { formatLocationText } from "@/features/location/utils";
import { isScheduledEventEnabled } from "@/features/scheduled-event/constants";
import {
  createScheduledEventDTO,
  getCachedPublicScheduledEvent,
} from "@/features/scheduled-event/data";
import { SpaceIcon } from "@/features/space/components/space-icon";
import { Trans } from "@/i18n/client";
import {
  EventDate,
  EventHeader,
  EventStatus,
  EventSubtitle,
  EventTitle,
} from "./event-header";
import { EventWizard } from "./event-wizard";

const getScheduledEvent = cache(async (id: string) => {
  const event = await getCachedPublicScheduledEvent(id);

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

function SpaceBranding({ name, image }: { name: string; image?: string }) {
  return (
    <div className="mb-4 flex flex-col gap-2 px-4">
      <SpaceIcon name={name} src={image} size="lg" />
      <p className="font-medium text-muted-foreground text-sm">{name}</p>
    </div>
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
    : event.invites
        .filter((i) => i.status !== "pending")
        .map((invite) => ({
          id: invite.id,
          name: invite.inviteeName,
          image: invite.user?.image ?? undefined,
          status: invite.status,
        }));

  return (
    <div className="min- flex h-dvh flex-col antialiased dark:bg-gray-900">
      {brandingColor ? <BrandingStyle primaryColor={brandingColor} /> : null}

      <div className="pointer-events-none fixed inset-x-0 top-0 z-40 bg-linear-to-b from-25% from-white to-transparent dark:from-gray-900">
        <div className="pointer-events-auto flex items-center gap-4 px-3 pt-[max(--spacing(3),env(safe-area-inset-top))] pb-12">
          <Suspense fallback={null}>
            <EventsBackLink />
          </Suspense>
        </div>
      </div>

      <div className="mx-auto mt-12 w-full max-w-xl flex-1 py-4 sm:py-8">
        {isBranded ? (
          <SpaceBranding
            name={event.space.name}
            image={event.space.image ?? undefined}
          />
        ) : null}

        <EventHeader>
          <EventTitle>{event.title}</EventTitle>
          <EventSubtitle>
            <Trans
              i18nKey="eventOrganizedBy"
              defaults="Organized by {name}"
              values={{ name: event.user.name }}
            />
          </EventSubtitle>
          <div className="flex items-center justify-between gap-3">
            <EventDate
              start={event.start}
              end={event.end}
              allDay={event.allDay}
              timezone={event.displayTimeZone}
            />
            <EventStatus status={event.status} hasEnded={hasEnded} />
          </div>
        </EventHeader>

        <EventWizard
          eventId={event.id}
          description={event.description}
          locationText={
            event.location ? formatLocationText(event.location) : null
          }
          conferencing={event.conferencing}
          attendees={visibleAttendees}
        />
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
