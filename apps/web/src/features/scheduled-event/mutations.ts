import "server-only";

import type { ScheduledEventInviteStatus } from "@rallly/database";
import { Prisma, prisma } from "@rallly/database";
import { sendEventCanceledEmail } from "@rallly/emails/templates/event-canceled";
import { sendFinalizeParticipantEmail } from "@rallly/emails/templates/finalized-participant";
import { shortUrl } from "@rallly/utils/absolute-url";
import { nanoid } from "@rallly/utils/nanoid";
import { Effect } from "effect";
import { updateTag } from "next/cache";
import { after } from "next/server";
import { getInstanceBranding, getSpaceBranding } from "@/emails/branding";
import { toEmailConferencing } from "@/emails/conferencing";
import { parseConferencing } from "@/features/conferencing/data";
import { getConferencingUri } from "@/features/conferencing/utils";
import {
  QueuedEmailFailed,
  QueuedEmailSkipped,
} from "@/features/email-queue/service";
import { parseLocation } from "@/features/location/data";
import { formatLocationText } from "@/features/location/utils";
import { scheduledEventTag } from "@/features/scheduled-event/constants";
import { createIcsEvent } from "@/lib/utils/ics";
import { getInviteEmailData } from "./data";
import { formatEventDateTime } from "./utils";

export async function createRsvp({
  eventId,
  name,
  email,
  status,
  inviteeId,
  locale,
  timeZone,
}: {
  eventId: string;
  name: string;
  email: string;
  status: Extract<ScheduledEventInviteStatus, "accepted" | "declined">;
  // Links the registration to a user account when the registrant is logged in.
  inviteeId?: string;
  // Captured at registration time so later emails (confirmation, cancellation)
  // can render in the invitee's language and zone.
  locale?: string;
  timeZone?: string;
}) {
  let invite: { uid: string };
  try {
    // The unique (scheduledEventId, inviteeEmail) index makes this atomic: a
    // concurrent duplicate fails with P2002 instead of racing past a prior
    // existence check.
    invite = await prisma.scheduledEventInvite.create({
      data: {
        uid: nanoid(),
        scheduledEventId: eventId,
        inviteeName: name,
        inviteeEmail: email,
        inviteeId,
        inviteeLocale: locale,
        inviteeTimeZone: timeZone,
        status,
      },
      select: { uid: true },
    });
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      return { ok: false, reason: "already_responded" } as const;
    }
    throw e;
  }

  updateTag(scheduledEventTag(eventId));

  return { ok: true, inviteUid: invite.uid } as const;
}

export async function cancelRsvp({ inviteUid }: { inviteUid: string }) {
  const invite = await prisma.scheduledEventInvite.findUnique({
    where: { uid: inviteUid },
    select: { id: true, scheduledEventId: true },
  });

  if (!invite) {
    return { ok: false, reason: "not_found" } as const;
  }

  await prisma.scheduledEventInvite.delete({ where: { id: invite.id } });

  updateTag(scheduledEventTag(invite.scheduledEventId));

  return { ok: true } as const;
}

const failWith = (message: string) => () => new QueuedEmailFailed({ message });

// The invitee's vote on the booked option, recorded on the invite when the
// poll was finalized. Pending means they never voted on it.
const voteByInviteStatus = {
  accepted: "yes",
  tentative: "ifNeedBe",
  declined: "no",
  pending: undefined,
} as const satisfies Record<ScheduledEventInviteStatus, string | undefined>;

/**
 * The queue handler for `scheduled_event_invite`: tells one invitee their
 * event is booked, built from the invite (the subject, by uid) and its event
 * as they are now. A canceled or deleted event, or a poll owner banned since
 * the booking, skips the email.
 */
export const sendScheduledEventInviteEmail = Effect.fn(
  "scheduledEvent.sendScheduledEventInviteEmail",
)(function* ({ subjectId }: { id: string; subjectId: string }) {
  const invite = yield* Effect.tryPromise({
    try: () => getInviteEmailData({ uid: subjectId }),
    catch: failWith("Failed to load the invite"),
  });
  const event = invite?.scheduledEvent;
  const poll = event?.polls[0];
  const host = poll?.user;
  if (!invite || !event || !poll || !host) {
    return yield* new QueuedEmailSkipped({ reason: "Invite no longer exists" });
  }
  if (event.deletedAt || event.status === "canceled") {
    return yield* new QueuedEmailSkipped({ reason: "Event was canceled" });
  }
  if (host.banned) {
    return yield* new QueuedEmailSkipped({ reason: "Poll owner is banned" });
  }

  const location = parseLocation(event.location, {
    scheduledEventId: event.id,
  });
  const conferencing = parseConferencing(event.conferencing, {
    scheduledEventId: event.id,
  });
  const locationText = location ? formatLocationText(location) : undefined;
  const conferencingUri = conferencing
    ? getConferencingUri(conferencing)
    : undefined;

  // The same event the host's confirmation carries: one UID, one organizer,
  // so every copy lands as the same calendar entry.
  const ics = createIcsEvent({
    uid: event.uid,
    sequence: event.sequence,
    title: event.title,
    location: locationText || conferencingUri,
    description:
      [event.description, conferencingUri].filter(Boolean).join("\n\n") ||
      undefined,
    start: event.start,
    end: event.end,
    allDay: event.allDay,
    timeZone: event.timeZone ?? undefined,
    organizer: { name: host.name, email: host.email },
  });
  if (ics.error || !ics.value) {
    return yield* new QueuedEmailFailed({
      message: ics.error?.message ?? "Failed to generate ics",
    });
  }
  const icsContent = ics.value;

  const locale = invite.inviteeLocale ?? undefined;
  const { date, time } = formatEventDateTime({
    start: event.start,
    end: event.end,
    allDay: event.allDay,
    timeZone: event.timeZone,
    inviteeTimeZone: invite.inviteeTimeZone,
    locale,
  });
  const branding = yield* Effect.tryPromise({
    try: () => getSpaceBranding(event.space),
    catch: failWith("Failed to load branding"),
  });

  // The mailer logs and swallows transport failures, so its result is what
  // tells a sent email from a failed one. A render error throws.
  const sent = yield* Effect.tryPromise({
    try: () =>
      sendFinalizeParticipantEmail({
        to: invite.inviteeEmail,
        locale,
        branding,
        icalEvent: {
          filename: "invite.ics",
          method: "request",
          content: icsContent,
        },
        props: {
          pollUrl: shortUrl(`/invite/${poll.id}`),
          title: event.title,
          hostName: host.name,
          location: locationText,
          conferencing: conferencing
            ? toEmailConferencing(conferencing)
            : undefined,
          date,
          time,
          vote: voteByInviteStatus[invite.status],
        },
      }),
    catch: (cause) =>
      new QueuedEmailFailed({
        message:
          cause instanceof Error ? cause.message : "Email failed to render",
      }),
  });
  if (!sent) {
    return yield* new QueuedEmailFailed({
      message: "Transport rejected the email",
    });
  }
});

/**
 * Tells every attendee who hasn't declined that the event is canceled, once
 * the response is out. Call after the cancellation has committed: the email
 * carries the event as it is now, with the bumped sequence.
 */
export async function sendScheduledEventCanceledEmails({
  eventId,
  organizer,
}: {
  eventId: string;
  organizer: { name: string; email: string };
}) {
  const event = await prisma.scheduledEvent.findUniqueOrThrow({
    where: { id: eventId },
    include: { invites: true },
  });

  const location = parseLocation(event.location, {
    scheduledEventId: event.id,
  });
  const conferencing = parseConferencing(event.conferencing, {
    scheduledEventId: event.id,
  });
  const locationText = location ? formatLocationText(location) : undefined;
  const conferencingUri = conferencing
    ? getConferencingUri(conferencing)
    : undefined;

  const ics = createIcsEvent({
    uid: event.uid,
    sequence: event.sequence,
    title: event.title,
    description:
      [event.description, conferencingUri].filter(Boolean).join("\n\n") ||
      undefined,
    location: locationText ?? conferencingUri,
    start: event.start,
    end: event.end,
    allDay: event.allDay,
    timeZone: event.timeZone ?? undefined,
    organizer,
    attendees: event.invites.map((invite) => ({
      name: invite.inviteeName,
      email: invite.inviteeEmail,
    })),
    method: "cancel",
    status: "CANCELLED",
  });

  if (ics.error || !ics.value) {
    throw new Error(
      `Failed to generate cancellation ICS: ${ics.error?.message ?? "empty"}`,
    );
  }
  const icsContent = ics.value;

  for (const invite of event.invites) {
    if (invite.status === "declined") {
      continue;
    }

    const { date, time } = formatEventDateTime({
      start: event.start,
      end: event.end,
      allDay: event.allDay,
      timeZone: event.timeZone,
      inviteeTimeZone: invite.inviteeTimeZone,
      locale: invite.inviteeLocale ?? undefined,
    });

    after(async () =>
      sendEventCanceledEmail({
        to: invite.inviteeEmail,
        locale: invite.inviteeLocale ?? undefined,
        branding: await getInstanceBranding(),
        icalEvent: {
          filename: "cancel.ics",
          method: "cancel",
          content: icsContent,
        },
        props: {
          title: event.title,
          hostName: organizer.name,
          date,
          time,
          location: locationText,
          // The meeting may no longer exist, so its link is dropped.
          conferencing: conferencing
            ? { ...toEmailConferencing(conferencing), url: undefined }
            : undefined,
        },
      }),
    );
  }
}
