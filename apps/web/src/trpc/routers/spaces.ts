import { prisma } from "@rallly/database";
import { createSpaceDTO, getSpaceSeatCount } from "@/features/space/data";
import type { SpaceDTO } from "@/features/space/types";
import { fromDBRole, getTotalSeatsForSpace } from "@/features/space/utils";
import { privateProcedure, router, spaceProcedure } from "../trpc";

export const spaces = router({
  list: privateProcedure.query(async ({ ctx }) => {
    const { user } = ctx;

    if (!user) {
      return [];
    }

    const result = await prisma.spaceMember.findMany({
      where: {
        userId: user.id,
      },
      select: {
        role: true,
        space: {
          select: {
            id: true,
            name: true,
            image: true,
            ownerId: true,
            tier: true,
          },
        },
      },
    });

    return result.map<SpaceDTO>((spaceMember) =>
      createSpaceDTO({
        ...spaceMember.space,
        role: spaceMember.role,
      }),
    );
  }),
  getCurrent: spaceProcedure.query(async ({ ctx }) => {
    return ctx.space;
  }),
  listMembers: spaceProcedure.query(async ({ ctx }) => {
    const [members, totalCount] = await Promise.all([
      prisma.spaceMember.findMany({
        where: {
          spaceId: ctx.space.id,
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
          spaceId: ctx.space.id,
        },
      }),
    ]);

    return {
      total: totalCount,
      data: members.map((member) => ({
        id: member.id,
        userId: member.userId,
        spaceId: member.spaceId,
        name: member.user.name,
        email: member.user.email,
        image: member.user.image ?? undefined,
        role: fromDBRole(member.role),
        isOwner: member.userId === ctx.space.ownerId,
      })),
    };
  }),
  listInvites: spaceProcedure.query(async ({ ctx }) => {
    const invites = await prisma.spaceMemberInvite.findMany({
      where: {
        spaceId: ctx.space.id,
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
  }),
  getSeats: spaceProcedure.query(async ({ ctx }) => {
    const [total, used] = await Promise.all([
      getTotalSeatsForSpace(ctx.space.id),
      getSpaceSeatCount(ctx.space.id),
    ]);

    return { total, used };
  }),
});
