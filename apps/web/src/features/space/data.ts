import { accessibleBy } from "@casl/prisma";
import type {
  SpaceMemberRole as DBSpaceMemberRole,
  SpaceTier as DBSpaceTier,
} from "@rallly/database";
import { prisma } from "@rallly/database";
import { createLogger } from "@rallly/logger";
import { cache } from "react";
import { requireSpace, requireUser } from "@/auth/data";

const logger = createLogger("space/data");

import type { MemberDTO } from "@/features/space/member/types";
import type { SpaceDTO } from "@/features/space/types";
import { fromDBRole } from "@/features/space/utils";
import { defineAbilityFor } from "@/features/user/ability";
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
}) {
  return {
    id: space.id,
    name: space.name,
    ownerId: space.ownerId,
    tier: isSelfHosted ? "pro" : space.tier,
    role: fromDBRole(space.role),
    image: space.image ?? undefined,
  } satisfies SpaceDTO;
}

export const loadSpaces = cache(async () => {
  const user = await requireUser();
  const ability = defineAbilityFor(user);
  const spaces = await prisma.space.findMany({
    where: accessibleBy(ability).Space,
    select: {
      id: true,
      name: true,
      ownerId: true,
      image: true,
      tier: true,
      members: {
        where: {
          userId: user.id,
        },
        select: {
          role: true,
        },
      },
    },
  });

  return spaces
    .map((space) => {
      const role = space.members[0]?.role;

      if (!role) {
        logger.warn(
          { userId: user.id, spaceId: space.id },
          "User does not have access to space",
        );
        return null;
      }

      return {
        id: space.id,
        name: space.name,
        ownerId: space.ownerId,
        tier: isSelfHosted ? "pro" : space.tier,
        role: fromDBRole(role),
        image: space.image ?? undefined,
      } satisfies SpaceDTO;
    })
    .filter(Boolean) as SpaceDTO[];
});

export const loadSpace = cache(async ({ id }: { id: string }) => {
  const spaces = await loadSpaces();
  const space = spaces.find((space) => space.id === id);

  if (!space) {
    const user = await requireUser();
    throw new Error(`User ${user.id} does not have access to space ${id}`);
  }

  return space;
});

export const loadPaymentMethods = cache(async () => {
  const user = await requireUser();
  const paymentMethods = await prisma.paymentMethod.findMany({
    where: {
      userId: user.id,
    },
    select: {
      id: true,
      type: true,
      data: true,
    },
  });

  return paymentMethods;
});

export const loadMembers = cache(async () => {
  const space = await requireSpace();

  const [members, totalCount] = await Promise.all([
    prisma.spaceMember.findMany({
      where: {
        spaceId: space.id,
      },
      select: {
        id: true,
        userId: true,
        role: true,
        spaceId: true,
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
    }),
    prisma.spaceMember.count({
      where: {
        spaceId: space.id,
      },
    }),
  ]);

  return {
    total: totalCount,
    data: members.map((member) => createMemberDTO({ ...member, space })),
  };
});

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

export const loadInvites = cache(async () => {
  const space = await requireSpace();

  const invites = await prisma.spaceMemberInvite.findMany({
    where: {
      spaceId: space.id,
    },
    include: {
      invitedBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return invites.map((invite) => ({
    ...invite,
    role: fromDBRole(invite.role),
  }));
});

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
