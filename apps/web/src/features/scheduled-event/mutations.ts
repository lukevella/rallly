import "server-only";

import type { ScheduledEventInviteStatus } from "@rallly/database";
import { Prisma, prisma } from "@rallly/database";
import { nanoid } from "@rallly/utils/nanoid";
import { updateTag } from "next/cache";
import { scheduledEventTag } from "@/features/scheduled-event/constants";

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
