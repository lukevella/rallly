import { prisma } from "@rallly/database";
import { TRPCError } from "@trpc/server";
import * as z from "zod";
import { fromDBRole } from "@/features/space/utils";
import { identifyGroup, track } from "@/lib/posthog";
import { privateProcedure, router, spaceProcedure } from "../trpc";

export const spaces = router({
  // ── Queries ──────────────────────────────────────────────────────────
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

    identifyGroup({
      groupType: "space",
      groupKey: ctx.space.id,
      properties: {
        member_count: memberCount,
      },
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

      identifyGroup({
        groupType: "space",
        groupKey: input.spaceId,
        properties: {
          member_count: memberCount,
        },
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
