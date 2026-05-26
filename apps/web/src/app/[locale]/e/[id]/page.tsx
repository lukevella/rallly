import { prisma } from "@rallly/database";
import { buttonVariants } from "@rallly/ui";
import { absoluteUrl } from "@rallly/utils/absolute-url";
import { ArrowLeftIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache, Suspense } from "react";
import { getCurrentUser } from "@/auth/data";
import { BrandingStyle } from "@/features/branding/branding-style";
import { isScheduledEventEnabled } from "@/features/scheduled-event/constants";
import { createScheduledEventDTO } from "@/features/scheduled-event/data";
import { SpaceIcon } from "@/features/space/components/space-icon";
import { Trans } from "@/i18n/client";
import { EventWizard } from "./event-wizard";

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

        <EventWizard
          event={{
            id: event.id,
            title: event.title,
            description: event.description,
            location: event.location,
            conferencing: event.conferencing,
            start: event.start,
            end: event.end,
            allDay: event.allDay,
            displayTimeZone: event.displayTimeZone,
            status: event.status,
            hasEnded,
            organizerName: event.user?.name ?? null,
            visibleAttendees,
          }}
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
