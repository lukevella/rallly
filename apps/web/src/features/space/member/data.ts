import "server-only";

import { prisma } from "@rallly/database";
import type { MemberDTO, MemberInviteDTO } from "@/features/space/member/types";
import type { AuthorizedSpaceId } from "@/features/space/types";
import { fromDBRole } from "@/features/space/utils";

export async function getInvite(inviteId: string) {
  return prisma.spaceMemberInvite.findUnique({
    where: { id: inviteId },
    select: {
      id: true,
      spaceId: true,
    },
  });
}

export async function listSpaceMembers({
  spaceId,
}: {
  spaceId: AuthorizedSpaceId;
}) {
  const members = await prisma.spaceMember.findMany({
    where: {
      spaceId,
    },
    select: {
      id: true,
      userId: true,
      role: true,
      spaceId: true,
      space: {
        select: {
          ownerId: true,
        },
      },
      user: {
        select: {
          name: true,
          email: true,
          image: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  return members.map(
    (member) =>
      ({
        id: member.id,
        userId: member.userId,
        spaceId: member.spaceId,
        name: member.user.name,
        email: member.user.email,
        image: member.user.image ?? undefined,
        role: fromDBRole(member.role),
        isOwner: member.userId === member.space.ownerId,
      }) satisfies MemberDTO,
  );
}

export async function listSpaceInvites({
  spaceId,
}: {
  spaceId: AuthorizedSpaceId;
}) {
  const invites = await prisma.spaceMemberInvite.findMany({
    where: {
      spaceId,
    },
    select: {
      id: true,
      email: true,
      spaceId: true,
      role: true,
      invitedBy: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return invites.map(
    (invite) =>
      ({
        ...invite,
        role: fromDBRole(invite.role),
      }) satisfies MemberInviteDTO,
  );
}
