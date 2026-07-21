import "server-only";

import { prisma } from "@rallly/database";
import { sendSpaceInviteEmail } from "@rallly/emails/templates/space-invite";
import { createLogger } from "@rallly/logger";
import { absoluteUrl } from "@rallly/utils/absolute-url";
import { getInstanceBranding } from "@/emails/branding";
import { getTotalSeatsForSpace } from "@/features/space/data";
import type { MemberRole } from "@/features/space/schema";
import { toDBRole } from "@/features/space/utils";
import { setActiveSpace } from "@/features/user/mutations";

const logger = createLogger("space/member/mutations");

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

  return result;
}

export async function cancelInvite({ inviteId }: { inviteId: string }) {
  await prisma.spaceMemberInvite.delete({
    where: { id: inviteId },
  });
}

export async function removeMember({ memberId }: { memberId: string }) {
  const removedMember = await prisma.spaceMember.delete({
    where: { id: memberId },
  });

  const memberCount = await prisma.spaceMember.count({
    where: { spaceId: removedMember.spaceId },
  });

  return { removedUserId: removedMember.userId, memberCount };
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
}
