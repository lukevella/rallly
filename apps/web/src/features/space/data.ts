import type {
  SpaceMemberRole as DBSpaceMemberRole,
  SpaceTier as DBSpaceTier,
} from "@rallly/database";
import { prisma } from "@rallly/database";

import type { MemberDTO } from "@/features/space/member/types";
import type { SpaceDTO } from "@/features/space/types";
import { fromDBRole } from "@/features/space/utils";
import { isSelfHosted } from "@/utils/constants";

function createMemberDTO(member: {
  id: string;
  userId: string;
  spaceId: string;
  role: DBSpaceMemberRole;
  space: {
    ownerId: string;
  };
  user: {
    name: string;
    email: string;
    image?: string | null;
  };
}) {
  return {
    id: member.id,
    name: member.user.name,
    userId: member.userId,
    spaceId: member.spaceId,
    email: member.user.email,
    image: member.user.image ?? undefined,
    role: fromDBRole(member.role),
    isOwner: member.userId === member.space.ownerId,
  } satisfies MemberDTO;
}

export async function getSpaceSeatCount(spaceId: string) {
  return await prisma.spaceMember.count({
    where: {
      spaceId: spaceId,
    },
  });
}

export function createSpaceDTO(space: {
  id: string;
  ownerId: string;
  name: string;
  role: DBSpaceMemberRole;
  image?: string | null;
  tier: DBSpaceTier;
  primaryColor?: string | null;
  showBranding: boolean;
}): SpaceDTO {
  return {
    id: space.id,
    name: space.name,
    ownerId: space.ownerId,
    tier: isSelfHosted ? "pro" : space.tier,
    role: fromDBRole(space.role),
    image: space.image ?? undefined,
    primaryColor: space.primaryColor ?? undefined,
    showBranding: space.showBranding,
  };
}

export const getMember = async (id: string) => {
  const member = await prisma.spaceMember.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
      userId: true,
      spaceId: true,
      role: true,
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
  });

  if (!member) {
    return null;
  }

  return createMemberDTO(member);
};

export const getActiveSpaceForUser = async (userId: string) => {
  const spaceMember = await prisma.spaceMember.findFirst({
    where: {
      userId,
    },
    orderBy: {
      lastSelectedAt: "desc",
    },
    include: {
      space: true,
    },
  });

  if (!spaceMember) {
    return null;
  }

  return createSpaceDTO({
    ...spaceMember.space,
    role: spaceMember.role,
  });
};
