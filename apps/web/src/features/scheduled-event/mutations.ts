import type { ScheduledEventInviteStatus } from "@rallly/database";
import { prisma } from "@rallly/database";
import { nanoid } from "@rallly/utils/nanoid";
import { updateTag } from "next/cache";
import { scheduledEventTag } from "@/features/scheduled-event/constants";

export async function createRsvp({
  eventId,
  name,
  email,
  status,
  inviteeId,
}: {
  eventId: string;
  name: string;
  email: string;
  status: Extract<ScheduledEventInviteStatus, "accepted" | "declined">;
  // Links the registration to a user account when the registrant is logged in.
  inviteeId?: string;
}) {
  const existing = await prisma.scheduledEventInvite.findFirst({
    where: { scheduledEventId: eventId, inviteeEmail: email },
    select: { id: true },
  });

  if (existing) {
    return { ok: false, reason: "already_responded" } as const;
  }

  const invite = await prisma.scheduledEventInvite.create({
    data: {
      uid: nanoid(),
      scheduledEventId: eventId,
      inviteeName: name,
      inviteeEmail: email,
      inviteeId,
      status,
    },
    select: { uid: true },
  });

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
