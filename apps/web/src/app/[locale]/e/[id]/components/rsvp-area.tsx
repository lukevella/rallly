import { getEventRegistration } from "@/features/scheduled-event/data";
import { getSession } from "@/lib/auth";
import { RsvpStatus } from "./rsvp-status";

/**
 * Server component that decides what to show in the RSVP card. It checks
 * whether the signed-in user has already registered for the event (a dedicated
 * query keyed on their email) and renders the registered state, otherwise it
 * falls back to the registration call to action passed as children.
 */
export async function RSVPArea({
  eventId,
  children,
}: {
  eventId: string;
  children: React.ReactNode;
}) {
  const session = await getSession();
  const email =
    session?.user && !session.user.isGuest ? session.user.email : undefined;

  const registration = email
    ? await getEventRegistration({ eventId, email })
    : null;

  if (!registration) {
    return <>{children}</>;
  }

  return (
    <RsvpStatus
      name={registration.inviteeName}
      email={registration.inviteeEmail}
      inviteUid={registration.uid}
    />
  );
}
