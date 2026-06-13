import { buttonVariants } from "@rallly/ui";
import { AvatarGroup } from "@rallly/ui/avatar";
import { absoluteUrl } from "@rallly/utils/absolute-url";
import { ArrowLeftIcon, CircleCheckIcon, MapPinIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { SpaceBranding } from "@/app/[locale]/e/[id]/components/space-branding";
import { UserDropdown } from "@/app/[locale]/e/[id]/components/user-dropdown";
import LogoMark from "@/assets/logo-mark.svg";
import { OptimizedAvatarImage } from "@/components/optimized-avatar-image";
import TruncatedLinkify from "@/components/poll/truncated-linkify";
import { BrandingStyle } from "@/features/branding/branding-style";
import { formatLocationText } from "@/features/location/utils";
import { isScheduledEventEnabled } from "@/features/scheduled-event/constants";
import {
  createScheduledEventDTO,
  getPublicScheduledEvent,
} from "@/features/scheduled-event/data";
import { getSpaceBranding } from "@/features/space/data";
import { getUserProfile } from "@/features/user/data";
import { Trans } from "@/i18n/client";
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
import {
  RegistrationFlow,
  RegistrationFlowRedirect,
  RegistrationFlowTrigger,
  RegistrationFlowView,
} from "./components/registration-flow";
import { RegistrationForm } from "./components/registration-form";
import { RSVPArea } from "./components/rsvp-area";
import {
  RsvpCard,
  RsvpCardContent,
  RsvpCardTitle,
} from "./components/rsvp-card";

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
  const [branding, host] = await Promise.all([
    getSpaceBranding(event.spaceId),
    getUserProfile(event.userId),
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
  const visibleAttendees = event.hideAttendees
    ? []
    : event.invites
        .filter((invite) => invite.status !== "pending")
        .map((invite) => ({
          id: invite.id,
          name: invite.inviteeName,
          image: invite.user?.image ?? undefined,
          status: invite.status,
        }));

  const session = await getSession();

  return (
    <div className="page-bg-gray-50 absolute inset-0 h-dvh overflow-auto md:h-dvh md:items-center md:justify-center md:p-5 dark:bg-gray-900">
      {brandingColor ? <BrandingStyle primaryColor={brandingColor} /> : null}
      <header className="fixed top-0 right-0 left-0 z-10 flex justify-between p-4">
        <Link href="/">
          <LogoMark className="size-8" />
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
              <Trans i18nKey="signIn" defaults="Sign in" />
            </Link>
          )}
        </div>
      </header>
      <div className="mx-auto max-w-lg pt-16">
        <RegistrationFlow>
          <RegistrationFlowView view="details">
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
                  Hosted by {host.name}
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
                  <Trans i18nKey="rsvpCardTitle" defaults="Registration" />
                </RsvpCardTitle>
                <RsvpCardContent>
                  <RSVPArea eventId={event.id}>
                    <p className="text-muted-foreground text-sm">
                      <Trans
                        i18nKey="rsvpCardDescription"
                        defaults="To join this event, please register below."
                      />
                    </p>
                    <RegistrationFlowTrigger
                      view="register"
                      size="lg"
                      variant="primary"
                      className="flex-2/3"
                    >
                      <Trans i18nKey="register" defaults="Register" />
                    </RegistrationFlowTrigger>
                  </RSVPArea>
                </RsvpCardContent>
              </RsvpCard>
              {event.description ? (
                <EventSection>
                  <EventSectionTitle>
                    <Trans i18nKey="eventPageAbout" defaults="About" />
                  </EventSectionTitle>
                  <p className="whitespace-pre-wrap text-pretty text-foreground text-sm leading-relaxed">
                    <TruncatedLinkify>{event.description}</TruncatedLinkify>
                  </p>
                </EventSection>
              ) : null}
              {visibleAttendees.length > 0 ? (
                <EventSection>
                  <EventSectionTitle>
                    <Trans
                      i18nKey="eventPageGoingCount"
                      defaults="{count, plural, one {# going} other {# going}}"
                      values={{ count: visibleAttendees.length }}
                    />
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
                  </AvatarGroup>
                </EventSection>
              ) : null}
            </div>
          </RegistrationFlowView>
          <RegistrationFlowView view="register">
            <div className="flex flex-col gap-6 p-6">
              <div className="flex items-start gap-4">
                <RegistrationFlowTrigger
                  view="details"
                  variant="ghost"
                  size="icon"
                  className="-mx-2"
                >
                  <ArrowLeftIcon />
                  <span className="sr-only">
                    <Trans i18nKey="back" defaults="Back" />
                  </span>
                </RegistrationFlowTrigger>
                <EventDetail>
                  <EventDetailContent>
                    <EventDetailTitle>{event.title}</EventDetailTitle>
                    <EventDetailDescription>
                      {dayjs(event.start).format("dddd, D MMMM")} ·{" "}
                      {dayjs(event.start).format("LT z")}
                    </EventDetailDescription>
                  </EventDetailContent>
                </EventDetail>
              </div>
              <EventSection className="gap-4">
                <h1 className="font-semibold text-lg tracking-tight">
                  <Trans
                    i18nKey="eventRegisterYourDetails"
                    defaults="Your details"
                  />
                </h1>
                <RegistrationForm eventId={event.id} />
              </EventSection>
            </div>
          </RegistrationFlowView>
          <RegistrationFlowView view="success">
            <RegistrationFlowRedirect view="details" />
            <div className="flex flex-col items-center gap-4 p-6 py-16 text-center">
              <CircleCheckIcon className="size-10 text-green-600" />
              <div className="grid gap-1">
                <h1 className="font-semibold text-lg tracking-tight">
                  <Trans
                    i18nKey="eventRegisterSuccessTitle"
                    defaults="You're registered"
                  />
                </h1>
                <p className="text-muted-foreground text-sm">
                  <Trans
                    i18nKey="eventRegisterSuccessDescription"
                    defaults="You're going to {title}"
                    values={{ title: event.title }}
                  />
                </p>
              </div>
            </div>
          </RegistrationFlowView>
        </RegistrationFlow>
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
