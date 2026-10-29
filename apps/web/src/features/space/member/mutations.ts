import "server-only";

import type { Prisma } from "@rallly/database";
import { prisma } from "@rallly/database";
import { sendSpaceInviteEmail } from "@rallly/emails/templates/space-invite";
import { createLogger } from "@rallly/logger";
import { absoluteUrl } from "@rallly/utils/absolute-url";
import { revalidatePath, updateTag } from "next/cache";
import { getInstanceBranding } from "@/emails/branding";
import type { PollActivityWrite } from "@/features/activity/mutations";
import { recordPollActivities } from "@/features/activity/mutations";
import { scheduledEventTag } from "@/features/scheduled-event/constants";
import { sendScheduledEventCanceledEmails } from "@/features/scheduled-event/mutations";
import { activeScheduledEventWhere } from "@/features/scheduled-event/utils";
import { getTotalSeatsForSpace } from "@/features/space/data";
import { effectiveSpaceMemberWhere } from "@/features/space/member/utils";
import type { MemberRole } from "@/features/space/schema";
import { toDBRole } from "@/features/space/utils";

const logger = createLogger("space/member/mutations");

function revalidateMembersPage() {
  revalidatePath("/[locale]/(space)/(dashboard)/members", "page");
}

/**
 * Returns false when the user is not an effective member of the space.
 */
export async function setActiveSpace({
  userId,
  spaceId,
}: {
  userId: string;
  spaceId: string;
}) {
  const { count } = await prisma.spaceMember.updateMany({
    where: { spaceId, ...effectiveSpaceMemberWhere({ userId }) },
    data: { lastSelectedAt: new Date() },
  });

  return count > 0;
}

export async function inviteMember({
  spaceId,
  spaceName,
  email,
  role,
  inviter,
}: {
  spaceId: string;
  spaceName: string;
  email: string;
  role: MemberRole;
  inviter: { id: string; name: string; locale?: string };
}) {
  const existingUser = await prisma.user.findUnique({
    where: { email },
    include: {
      memberOf: {
        where: { spaceId },
      },
    },
  });

  if (existingUser?.memberOf && existingUser.memberOf.length > 0) {
    return { ok: false as const, reason: "ALREADY_MEMBER" as const };
  }

  const existingInvite = await prisma.spaceMemberInvite.findUnique({
    where: {
      spaceId_email: { spaceId, email },
    },
  });

  if (existingInvite) {
    if (existingInvite.role !== toDBRole(role)) {
      await prisma.spaceMemberInvite.update({
        where: { id: existingInvite.id },
        data: { role: toDBRole(role) },
      });

      revalidateMembersPage();

      return { ok: true as const, code: "INVITE_UPDATED" as const };
    }

    return { ok: false as const, reason: "INVITE_PENDING" as const };
  }

  // Seat availability only gates new invites
  const [usedSeats, totalSeats] = await Promise.all([
    prisma.spaceMember.count({ where: { spaceId } }),
    getTotalSeatsForSpace(spaceId),
  ]);

  if (usedSeats >= totalSeats) {
    return { ok: false as const, reason: "NOT_ENOUGH_SEATS" as const };
  }

  const invite = await prisma.spaceMemberInvite.create({
    data: {
      spaceId,
      email,
      role: toDBRole(role),
      inviterId: inviter.id,
    },
  });

  try {
    await sendSpaceInviteEmail({
      to: email,
      locale: existingUser?.locale ?? inviter.locale,
      branding: await getInstanceBranding(),
      props: {
        spaceName,
        inviterName: inviter.name,
        spaceRole: role,
        inviteUrl: absoluteUrl(`/accept-invite/${invite.id}`),
      },
    });
  } catch {
    await prisma.spaceMemberInvite.delete({ where: { id: invite.id } });
    return { ok: false as const, reason: "INVITE_FAILED" as const };
  }

  revalidateMembersPage();

  return { ok: true as const, code: "INVITE_SENT" as const };
}

export async function acceptInvite({
  spaceId,
  user,
}: {
  spaceId: string;
  user: { id: string; email: string };
}) {
  const invite = await prisma.spaceMemberInvite.findUnique({
    where: {
      spaceId_email: { spaceId, email: user.email },
    },
  });

  if (!invite) {
    return { ok: false as const, reason: "INVITE_NOT_FOUND" as const };
  }

  const result = await prisma.$transaction(async (tx) => {
    const [usedSeats, totalSeats] = await Promise.all([
      tx.spaceMember.count({ where: { spaceId } }),
      getTotalSeatsForSpace(spaceId),
    ]);

    if (usedSeats >= totalSeats) {
      return { ok: false as const, reason: "NOT_ENOUGH_SEATS" as const };
    }

    await tx.spaceMember.create({
      data: {
        spaceId,
        userId: user.id,
        role: invite.role,
      },
    });

    await tx.spaceMemberInvite.delete({
      where: { id: invite.id },
    });

    return { ok: true as const, memberCount: usedSeats + 1 };
  });

  if (!result.ok) {
    return result;
  }

  try {
    await setActiveSpace({ userId: user.id, spaceId });
  } catch (error) {
    logger.warn({ error }, "Failed to update user's active space");
  }

  revalidateMembersPage();

  return result;
}

export async function cancelInvite({ inviteId }: { inviteId: string }) {
  await prisma.spaceMemberInvite.delete({
    where: { id: inviteId },
  });

  revalidateMembersPage();
}

/** Content in one space, by id. */
export type SpaceContentIds = {
  pollIds: string[];
  eventIds: string[];
  eventTypeIds: string[];
  sheetIds: string[];
};

/** Everything the user created in the space that hasn't been deleted. */
async function findOwnedContentIds(
  tx: Prisma.TransactionClient,
  { spaceId, userId }: { spaceId: string; userId: string },
): Promise<SpaceContentIds> {
  const polls = await tx.poll.findMany({
    where: { spaceId, userId, deleted: false },
    select: { id: true },
  });
  const events = await tx.scheduledEvent.findMany({
    where: { spaceId, userId, deletedAt: null },
    select: { id: true },
  });
  const eventTypes = await tx.eventType.findMany({
    where: { spaceId, hostId: userId, deleted: false },
    select: { id: true },
  });
  const sheets = await tx.sheet.findMany({
    where: { spaceId, hostId: userId, deleted: false },
    select: { id: true },
  });

  return {
    pollIds: polls.map(({ id }) => id),
    eventIds: events.map(({ id }) => id),
    eventTypeIds: eventTypes.map(({ id }) => id),
    sheetIds: sheets.map(({ id }) => id),
  };
}

/**
 * Makes the recipient the organizer of the given content, whatever its
 * status. Ids outside the space are ignored. Each poll that changes hands
 * records poll_organizer_changed so its history explains the new organizer.
 */
export async function reassignSpaceContent(
  tx: Prisma.TransactionClient,
  {
    spaceId,
    actorId,
    toUserId,
    reason,
    content,
  }: {
    spaceId: string;
    actorId: string;
    toUserId: string;
    reason: "member_removed";
    content: SpaceContentIds;
  },
) {
  const recipient = await tx.user.findUniqueOrThrow({
    where: { id: toUserId },
    select: { id: true, name: true },
  });

  const polls = await tx.poll.findMany({
    where: {
      id: { in: content.pollIds },
      spaceId,
      userId: { not: toUserId },
    },
    select: { id: true, user: { select: { id: true, name: true } } },
  });

  await tx.poll.updateMany({
    where: { id: { in: content.pollIds }, spaceId },
    data: { userId: toUserId },
  });
  await tx.scheduledEvent.updateMany({
    where: { id: { in: content.eventIds }, spaceId },
    data: { userId: toUserId },
  });
  await tx.eventType.updateMany({
    where: { id: { in: content.eventTypeIds }, spaceId },
    data: { hostId: toUserId },
  });
  await tx.sheet.updateMany({
    where: { id: { in: content.sheetIds }, spaceId },
    data: { hostId: toUserId },
  });

  await recordPollActivities(
    tx,
    polls.flatMap((poll): PollActivityWrite[] =>
      poll.user
        ? [
            {
              pollId: poll.id,
              type: "poll_organizer_changed",
              userId: actorId,
              payload: { from: poll.user, to: recipient, reason },
            },
          ]
        : [],
    ),
  );
}

/**
 * Deletes the given content. Polls, event types and sheets are soft deleted;
 * events are soft deleted too, and the ones still ahead are canceled first.
 * Returns the canceled events: their attendees are told once the caller's
 * transaction commits.
 */
export async function deleteSpaceContent(
  tx: Prisma.TransactionClient,
  {
    spaceId,
    actorId,
    content,
    now,
    timeZone,
  }: {
    spaceId: string;
    actorId: string;
    content: SpaceContentIds;
    now: Date;
    timeZone: string;
  },
) {
  const polls = await tx.poll.findMany({
    where: { id: { in: content.pollIds }, spaceId, deletedAt: null },
    select: { id: true },
  });
  await tx.poll.updateMany({
    where: { id: { in: polls.map(({ id }) => id) } },
    data: { deleted: true, deletedAt: now },
  });
  // The webhook outbox: the scheduled delivery run sends poll.deleted.
  await recordPollActivities(
    tx,
    polls.map(({ id }) => ({
      pollId: id,
      type: "poll_deleted" as const,
      userId: actorId,
      payload: {},
    })),
  );

  const activeEvents = await tx.scheduledEvent.findMany({
    where: {
      id: { in: content.eventIds },
      spaceId,
      ...activeScheduledEventWhere({ now, timeZone }),
    },
    select: { id: true },
  });
  const canceledEventIds = activeEvents.map(({ id }) => id);
  await tx.scheduledEvent.updateMany({
    where: { id: { in: canceledEventIds } },
    data: { status: "canceled", sequence: { increment: 1 } },
  });
  await tx.scheduledEvent.updateMany({
    where: { id: { in: content.eventIds }, spaceId, deletedAt: null },
    data: { deletedAt: now },
  });

  await tx.eventType.updateMany({
    where: { id: { in: content.eventTypeIds }, spaceId, deleted: false },
    data: { deleted: true, deletedAt: now },
  });
  await tx.sheet.updateMany({
    where: { id: { in: content.sheetIds }, spaceId, deleted: false },
    data: { deleted: true, deletedAt: now },
  });

  return { canceledEventIds };
}

class RecipientNotAvailableError extends Error {}

/**
 * Removes the membership and settles everything the member created in the
 * space, in one transaction so a failure leaves the membership in place:
 * reassigned to a current, effective member of the space, or deleted.
 */
export async function removeMember({
  memberId,
  actor,
  content,
  now,
  timeZone,
}: {
  memberId: string;
  actor: { id: string; name: string; email: string };
  content: { reassignToUserId: string } | { delete: true };
  now: Date;
  timeZone: string;
}) {
  let result: {
    spaceId: string;
    removedUserId: string;
    memberCount: number;
    contentIds: SpaceContentIds;
    canceledEventIds: string[];
  };

  try {
    result = await prisma.$transaction(async (tx) => {
      const removedMember = await tx.spaceMember.delete({
        where: { id: memberId },
      });
      const { spaceId, userId } = removedMember;

      const contentIds = await findOwnedContentIds(tx, { spaceId, userId });
      let canceledEventIds: string[] = [];

      if ("reassignToUserId" in content) {
        // Checked after the delete so the member leaving can't receive it.
        const recipient = await tx.spaceMember.findFirst({
          where: {
            spaceId,
            ...effectiveSpaceMemberWhere({ userId: content.reassignToUserId }),
          },
          select: { id: true },
        });

        if (!recipient) {
          throw new RecipientNotAvailableError();
        }

        await reassignSpaceContent(tx, {
          spaceId,
          actorId: actor.id,
          toUserId: content.reassignToUserId,
          reason: "member_removed",
          content: contentIds,
        });
      } else {
        ({ canceledEventIds } = await deleteSpaceContent(tx, {
          spaceId,
          actorId: actor.id,
          content: contentIds,
          now,
          timeZone,
        }));
      }

      const memberCount = await tx.spaceMember.count({ where: { spaceId } });

      return {
        spaceId,
        removedUserId: userId,
        memberCount,
        contentIds,
        canceledEventIds,
      };
    });
  } catch (error) {
    if (error instanceof RecipientNotAvailableError) {
      return { ok: false as const, reason: "RECIPIENT_NOT_AVAILABLE" as const };
    }
    throw error;
  }

  for (const eventId of result.canceledEventIds) {
    try {
      await sendScheduledEventCanceledEmails({
        eventId,
        organizer: { name: actor.name, email: actor.email },
      });
    } catch (error) {
      logger.error(
        { error, eventId },
        "Failed to send cancellation emails for a removed member's event",
      );
    }
  }

  for (const eventId of result.contentIds.eventIds) {
    updateTag(scheduledEventTag(eventId));
  }

  logger.info(
    {
      spaceId: result.spaceId,
      actorId: actor.id,
      removedUserId: result.removedUserId,
      memberCount: result.memberCount,
      outcome: "reassignToUserId" in content ? "reassign" : "delete",
      recipientUserId:
        "reassignToUserId" in content ? content.reassignToUserId : null,
      pollCount: result.contentIds.pollIds.length,
      eventCount: result.contentIds.eventIds.length,
      eventTypeCount: result.contentIds.eventTypeIds.length,
      sheetCount: result.contentIds.sheetIds.length,
      canceledEventCount: result.canceledEventIds.length,
      ...result.contentIds,
      canceledEventIds: result.canceledEventIds,
    },
    "Space member removed",
  );

  revalidateMembersPage();

  return {
    ok: true as const,
    removedUserId: result.removedUserId,
    memberCount: result.memberCount,
  };
}

export async function changeMemberRole({
  memberId,
  role,
}: {
  memberId: string;
  role: MemberRole;
}) {
  await prisma.spaceMember.update({
    where: { id: memberId },
    data: { role: toDBRole(role) },
  });

  revalidateMembersPage();
}
