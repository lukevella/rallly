import type { ScheduledEventStatus } from "@rallly/database";
import { getEventRegistration } from "@/features/scheduled-event/data";
import {
  getEventPhase,
  isEventFull,
} from "@/features/scheduled-event/registration";
import { getSession } from "@/lib/auth";
import { RsvpCancel } from "./rsvp-cancel";
import { RsvpNotice } from "./rsvp-notice";
import { RsvpOneClickRegister } from "./rsvp-one-click-register";
import { RsvpRegister } from "./rsvp-register";
import { RsvpRegistered } from "./rsvp-registered";
import { RsvpVerifyEmail } from "./rsvp-verify-email";

function Separator() {
  return <hr className="border-card-border" />;
}

/**
 * Server component that owns the RSVP card's dynamic content. It reads the
 * session, runs a dedicated query for the viewer's registration, and resolves
 * the event phase + capacity to decide which sections to render.
 */
export async function RSVPArea({
  eventId,
  status,
  start,
  end,
  capacity,
  acceptedCount,
}: {
  eventId: string;
  status: ScheduledEventStatus;
  start: Date;
  end: Date;
  capacity: number | null;
  acceptedCount: number;
}) {
  const session = await getSession();
  // The invite is tied to a user (real or anonymous), so any session can have
  // a registration. Only real accounts, though, get the one-click CTA — guests
  // without a registration are treated as logged out.
  const user = session?.user ?? null;
  const realUser = user && !user.isGuest ? user : null;

  const registration = user
    ? await getEventRegistration({ eventId, userId: user.id })
    : null;

  const phase = getEventPhase({ status, start, end, now: new Date() });

  // A canceled event overrides everything else.
  if (phase === "canceled") {
    return <RsvpNotice variant="canceled" />;
  }

  // Registered: show the status, layering a notice for started/ended events
  // and offering cancellation only while the event is still upcoming.
  if (registration) {
    const notice =
      phase === "ended" ? (
        <RsvpNotice variant="ended" />
      ) : phase === "inProgress" ? (
        <RsvpNotice variant="inProgress" />
      ) : null;

    return (
      <div className="flex flex-col gap-3">
        {notice ? (
          <>
            {notice}
            <Separator />
          </>
        ) : null}
        <RsvpRegistered
          name={registration.inviteeName}
          email={registration.inviteeEmail}
        />
        {phase === "upcoming" && !realUser ? (
          <>
            <Separator />
            <RsvpVerifyEmail
              email={registration.inviteeEmail}
              name={registration.inviteeName}
            />
          </>
        ) : null}
        {phase === "upcoming" ? (
          <>
            <Separator />
            <RsvpCancel inviteUid={registration.uid} />
          </>
        ) : null}
      </div>
    );
  }

  // Not registered: surface why registration is unavailable, otherwise the CTA.
  if (phase === "ended") {
    return <RsvpNotice variant="ended" />;
  }
  if (phase === "inProgress") {
    return <RsvpNotice variant="inProgress" />;
  }
  if (isEventFull({ capacity, acceptedCount })) {
    return <RsvpNotice variant="full" />;
  }

  if (realUser) {
    return (
      <RsvpOneClickRegister
        eventId={eventId}
        name={realUser.name}
        email={realUser.email}
        image={realUser.image ?? undefined}
      />
    );
  }

  return <RsvpRegister eventId={eventId} />;
}
