import { subject } from "@casl/ability";
import { prisma } from "@rallly/database";
import { TRPCError } from "@trpc/server";
import * as z from "zod";
import { createSpaceDTO } from "@/features/space/data";
import { defineAbilityForMember } from "@/features/space/member/ability";
import { effectiveSpaceMemberWhere } from "@/features/space/member/utils";
import { createSpace } from "@/features/space/mutations";
import type { SpaceDTO } from "@/features/space/types";
import { fromDBRole } from "@/features/space/utils";
import { identifyGroup, track } from "@/lib/posthog";
import {
  createRateLimitMiddleware,
  privateProcedure,
  router,
  spaceProcedure,
} from "../trpc";

export const spaces = router({
  // ── Queries ──────────────────────────────────────────────────────────
  list: privateProcedure.query(async ({ ctx }) => {
    const { user } = ctx;

    if (!user) {
      return [];
    }

    const result = await prisma.spaceMember.findMany({
      where: effectiveSpaceMemberWhere({ userId: user.id }),
      select: {
        role: true,
        space: {
          select: {
            id: true,
            name: true,
            image: true,
            ownerId: true,
            tier: true,
            primaryColor: true,
            showBranding: true,
            _count: { select: { members: true } },
            subscriptions: {
              where: { active: true },
              select: { quantity: true },
              take: 1,
            },
          },
        },
      },
    });

    return result.map<SpaceDTO>((spaceMember) =>
      createSpaceDTO({
        ...spaceMember.space,
        role: spaceMember.role,
        memberCount: spaceMember.space._count.members,
        seatCount: spaceMember.space.subscriptions[0]?.quantity ?? 1,
      }),
    );
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
  // ── Mutations ────────────────────────────────────────────────────────
  create: privateProcedure
    .use(createRateLimitMiddleware("space_create", 5, "1 m"))
    .input(z.object({ name: z.string().min(1).max(100) }))
    .mutation(async ({ ctx, input }) => {
      const space = await createSpace({
        name: input.name,
        ownerId: ctx.user.id,
      });

      identifyGroup({
        groupType: "space",
        groupKey: space.id,
        properties: {
          name: space.name,
          member_count: 1,
          seat_count: 1,
          tier: "hobby",
        },
      });

      track(ctx.user, {
        event: "space_create",
        properties: {
          space_name: space.name,
        },
        groups: {
          space: space.id,
        },
      });

      return space;
    }),

  delete: spaceProcedure.mutation(async ({ ctx }) => {
    const memberAbility = defineAbilityForMember({
      user: ctx.user,
      space: ctx.space,
    });

    if (memberAbility.cannot("delete", subject("Space", ctx.space))) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You do not have permission to delete this space",
      });
    }

    const activeSubscriptionCount = await prisma.subscription.count({
      where: { spaceId: ctx.space.id, active: true },
    });

    if (activeSubscriptionCount > 0) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message:
          "Cannot delete space with an active subscription. Please cancel the subscription first.",
      });
    }

    await prisma.space.delete({
      where: { id: ctx.space.id },
    });

    track(ctx.user, {
      event: "space_delete",
      properties: {
        space_id: ctx.space.id,
      },
      groups: {
        space: ctx.space.id,
      },
    });
  }),

  leave: spaceProcedure.mutation(async ({ ctx }) => {
    if (ctx.space.ownerId === ctx.user.id) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message:
          "Space owners cannot leave their space. Transfer ownership first.",
      });
    }

    const member = await prisma.spaceMember.findFirst({
      where: {
        spaceId: ctx.space.id,
        userId: ctx.user.id,
      },
    });

    if (!member) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "You are not a member of this space",
      });
    }

    const userSpaces = await prisma.spaceMember.findMany({
      where: {
        userId: ctx.user.id,
        NOT: { spaceId: ctx.space.id },
      },
      orderBy: { lastSelectedAt: "desc" },
    });

    if (userSpaces.length === 0) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Cannot leave your last remaining space",
      });
    }

    await prisma.$transaction(async (tx) => {
      await tx.spaceMember.delete({
        where: { id: member.id },
      });

      await tx.spaceMember.update({
        where: { id: userSpaces[0].id },
        data: { lastSelectedAt: new Date() },
      });
    });

    const memberCount = await prisma.spaceMember.count({
      where: { spaceId: ctx.space.id },
    });

    track(ctx.user, {
      event: "space_member_leave",
      properties: {
        member_count: memberCount,
      },
      groups: {
        space: ctx.space.id,
      },
    });
  }),

  leaveFromAccount: privateProcedure
    .input(z.object({ spaceId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const space = await prisma.space.findUnique({
        where: { id: input.spaceId },
        select: { id: true, ownerId: true },
      });

      if (!space) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Space not found",
        });
      }

      if (space.ownerId === ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "Space owners cannot leave their space. Transfer ownership first.",
        });
      }

      const member = await prisma.spaceMember.findFirst({
        where: {
          spaceId: input.spaceId,
          userId: ctx.user.id,
        },
      });

      if (!member) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "You are not a member of this space",
        });
      }

      const userSpaces = await prisma.spaceMember.findMany({
        where: {
          userId: ctx.user.id,
          NOT: { spaceId: input.spaceId },
        },
        orderBy: { lastSelectedAt: "desc" },
      });

      if (userSpaces.length === 0) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Cannot leave your last remaining space",
        });
      }

      await prisma.$transaction(async (tx) => {
        await tx.spaceMember.delete({
          where: { id: member.id },
        });

        await tx.spaceMember.update({
          where: { id: userSpaces[0].id },
          data: { lastSelectedAt: new Date() },
        });
      });

      const memberCount = await prisma.spaceMember.count({
        where: { spaceId: input.spaceId },
      });

      track(ctx.user, {
        event: "space_member_leave",
        properties: {
          member_count: memberCount,
        },
        groups: {
          space: input.spaceId,
        },
      });
    }),
});
