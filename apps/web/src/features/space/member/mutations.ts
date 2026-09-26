import "server-only";

import type { Prisma } from "@rallly/database";
import { prisma } from "@rallly/database";
import { sendSpaceInviteEmail } from "@rallly/emails/templates/space-invite";
import { createLogger } from "@rallly/logger";
import { absoluteUrl } from "@rallly/utils/absolute-url";
import { revalidatePath } from "next/cache";
import { getInstanceBranding } from "@/emails/branding";
import { liveScheduledEventWhere } from "@/features/scheduled-event/utils";
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

/**
 * Removes the membership and hands the member's live content in that space
 * to another member, in one transaction so a failed transfer leaves the
 * membership in place. Live is what still has something ahead: open polls,
 * scheduled polls whose event is still to come (with that event), upcoming
 * and unconfirmed events, event types and sheets. Settled content (closed
 * polls, past and cancelled events) keeps its author; membership checks on
 * management and notifications already make it inert for them.
 */
export async function removeMember({
  memberId,
  transferToUserId,
  now,
  timeZone,
}: {
  memberId: string;
  transferToUserId: string;
  now: Date;
  timeZone: string;
}) {
  const result = await prisma.$transaction(async (tx) => {
    const removedMember = await tx.spaceMember.delete({
      where: { id: memberId },
    });

    await transferLiveContent(tx, {
      spaceId: removedMember.spaceId,
      fromUserId: removedMember.userId,
      toUserId: transferToUserId,
      now,
      timeZone,
    });

    const memberCount = await tx.spaceMember.count({
      where: { spaceId: removedMember.spaceId },
    });

    return { removedUserId: removedMember.userId, memberCount };
  });

  revalidateMembersPage();

  return result;
}

async function transferLiveContent(
  tx: Prisma.TransactionClient,
  {
    spaceId,
    fromUserId,
    toUserId,
    now,
    timeZone,
  }: {
    spaceId: string;
    fromUserId: string;
    toUserId: string;
    now: Date;
    timeZone: string;
  },
) {
  const liveEvent = liveScheduledEventWhere({ now, timeZone });

  await tx.poll.updateMany({
    where: {
      spaceId,
      userId: fromUserId,
      deleted: false,
      OR: [
        { status: "open" },
        { status: "scheduled", scheduledEvent: liveEvent },
      ],
    },
    data: { userId: toUserId },
  });

  await tx.scheduledEvent.updateMany({
    where: { spaceId, userId: fromUserId, ...liveEvent },
    data: { userId: toUserId },
  });

  await tx.eventType.updateMany({
    where: { spaceId, hostId: fromUserId, deleted: false },
    data: { hostId: toUserId },
  });

  await tx.sheet.updateMany({
    where: { spaceId, hostId: fromUserId, deleted: false },
    data: { hostId: toUserId },
  });
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
