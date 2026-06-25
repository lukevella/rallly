import { buttonVariants } from "@rallly/ui";
import { AvatarGroup, AvatarGroupCount } from "@rallly/ui/avatar";
import { absoluteUrl } from "@rallly/utils/absolute-url";
import { MapPinIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { SpaceBranding } from "@/app/[locale]/e/[id]/components/space-branding";
import { UserDropdown } from "@/app/[locale]/e/[id]/components/user-dropdown";
import LogoMarkGray from "@/assets/logo-mark-gray.svg";
import { OptimizedAvatarImage } from "@/components/optimized-avatar-image";
import TruncatedLinkify from "@/components/poll/truncated-linkify";
import { SessionRefresher } from "@/components/session-refresher";
import { BrandingStyle } from "@/features/branding/branding-style";
import { formatLocationText } from "@/features/location/utils";
import { isScheduledEventEnabled } from "@/features/scheduled-event/constants";
import {
  createScheduledEventDTO,
  getEventAcceptedCount,
  getEventAttendeePreview,
  getPublicScheduledEvent,
} from "@/features/scheduled-event/data";
import { getSpaceBranding } from "@/features/space/data";
import { getUserProfile } from "@/features/user/data";
import { getTranslation } from "@/i18n/server";
import { getSession } from "@/lib/auth";
import { dayjs } from "@/lib/dayjs";
import {
  CalendarCard,
  CalendarCardDay,
  CalendarCardMonth,
} from "./components/calendar-card";
import {
  EventDetail,
  EventDetailContent,
  EventDetailDescription,
  EventDetailIcon,
  EventDetailTitle,
} from "./components/event-detail";
import {
  EventHeader,
  EventSubtitle,
  EventTitle,
} from "./components/event-header";
import { EventSection, EventSectionTitle } from "./components/event-section";
import { RSVPArea } from "./components/rsvp-area";
import {
  RsvpCard,
  RsvpCardContent,
  RsvpCardTitle,
} from "./components/rsvp-card";

const ATTENDEE_PREVIEW_LIMIT = 5;

const getScheduledEvent = cache(async (id: string) => {
  const event = await getPublicScheduledEvent(id);

  if (!event || event.deletedAt) {
    notFound();
  }

  return {
    ...event,
    ...createScheduledEventDTO(event),
  };
});

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
  const [branding, host, acceptedCount, visibleAttendees] = await Promise.all([
    getSpaceBranding(event.spaceId),
    getUserProfile(event.userId),
    getEventAcceptedCount({ eventId: id }),
    event.hideAttendees
      ? Promise.resolve([])
      : getEventAttendeePreview({ eventId: id, take: ATTENDEE_PREVIEW_LIMIT }),
  ]);

  if (!host) {
    // The host relation cascades on delete, so a missing host means the
    // cached event is stale and the event no longer exists.
    notFound();
  }

  const isBranded = !!branding?.showBranding && !!branding.image;
  const brandingColor =
    branding?.showBranding && branding.primaryColor
      ? branding.primaryColor
      : null;

  const session = await getSession();
  const { t } = await getTranslation();

  return (
    <div className="page-bg-gray-50 absolute inset-0 h-dvh overflow-auto md:h-dvh md:items-center md:justify-center md:p-5 dark:bg-gray-900">
      <SessionRefresher />
      {brandingColor ? <BrandingStyle primaryColor={brandingColor} /> : null}
      <header className="fixed top-0 right-0 left-0 z-10 flex justify-between p-4">
        <Link href="/">
          <LogoMarkGray className="size-8 text-muted-foreground" />
        </Link>
        <div className="flex items-center gap-2">
          {session?.user.isGuest === false ? (
            <UserDropdown
              name={session.user.name}
              email={session.user.email}
              image={session.user.image ?? undefined}
            />
          ) : (
            <Link
              href="/login"
              className={buttonVariants({ variant: "ghost", size: "sm" })}
            >
              {t("signIn", { defaultValue: "Sign in" })}
            </Link>
          )}
        </div>
      </header>
      <main id="main-content" tabIndex={-1} className="mx-auto max-w-lg pt-16">
        <div className="flex flex-col justify-between gap-6 p-4">
          <EventHeader>
            {isBranded && branding ? (
              <SpaceBranding
                className="mb-4"
                name={branding.name}
                image={branding.image ?? undefined}
              />
            ) : null}
            <EventTitle>{event.title}</EventTitle>
            <EventSubtitle className="flex items-center gap-2">
              <OptimizedAvatarImage
                name={host.name}
                src={host.image ?? undefined}
                size="sm"
              />
              {t("eventPageHostedBy", {
                defaultValue: "Hosted by {name}",
                name: host.name,
              })}
            </EventSubtitle>
            <div className="mt-4 grid gap-4">
              <EventDetail>
                <CalendarCard>
                  <CalendarCardMonth>
                    {dayjs(event.start).format("MMM")}
                  </CalendarCardMonth>
                  <CalendarCardDay>
                    {dayjs(event.start).format("D")}
                  </CalendarCardDay>
                </CalendarCard>
                <EventDetailContent>
                  <EventDetailTitle>
                    {dayjs(event.start).format("dddd, D MMMM")}
                  </EventDetailTitle>
                  <EventDetailDescription>
                    {dayjs(event.start).format("LT")} -{" "}
                    {dayjs(event.end).format("LT z")}
                  </EventDetailDescription>
                </EventDetailContent>
              </EventDetail>
              {event.location ? (
                <EventDetail>
                  <EventDetailIcon>
                    <MapPinIcon />
                  </EventDetailIcon>
                  <EventDetailContent>
                    <EventDetailTitle>
                      {formatLocationText(event.location)}
                    </EventDetailTitle>
                  </EventDetailContent>
                </EventDetail>
              ) : null}
            </div>
          </EventHeader>
          <RsvpCard>
            <RsvpCardTitle>
              {t("rsvpCardTitle", { defaultValue: "Registration" })}
            </RsvpCardTitle>
            <RsvpCardContent>
              <RSVPArea
                eventId={event.id}
                status={event.status}
                start={event.start}
                end={event.end}
                capacity={event.capacity}
                acceptedCount={acceptedCount}
              />
            </RsvpCardContent>
          </RsvpCard>
          {event.description ? (
            <EventSection>
              <EventSectionTitle>
                {t("eventPageAbout", { defaultValue: "About" })}
              </EventSectionTitle>
              <p className="whitespace-pre-wrap text-pretty text-foreground text-sm leading-relaxed">
                <TruncatedLinkify>{event.description}</TruncatedLinkify>
              </p>
            </EventSection>
          ) : null}
          {visibleAttendees.length > 0 ? (
            <EventSection>
              <EventSectionTitle>
                {t("eventPageGoingCount", {
                  defaultValue:
                    "{count, plural, one {# going} other {# going}}",
                  count: acceptedCount,
                })}
              </EventSectionTitle>
              <AvatarGroup>
                {visibleAttendees.map((attendee) => (
                  <OptimizedAvatarImage
                    key={attendee.id}
                    name={attendee.name}
                    src={attendee.image}
                    size="md"
                  />
                ))}
                {acceptedCount > visibleAttendees.length ? (
                  <AvatarGroupCount>
                    +{acceptedCount - visibleAttendees.length}
                  </AvatarGroupCount>
                ) : null}
              </AvatarGroup>
            </EventSection>
          ) : null}
        </div>
      </main>
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
