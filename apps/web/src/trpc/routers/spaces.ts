import { subject } from "@casl/ability";
import { prisma } from "@rallly/database";
import { createLogger } from "@rallly/logger";
import { absoluteUrl } from "@rallly/utils/absolute-url";
import { TRPCError } from "@trpc/server";
import { after } from "next/server";
import * as z from "zod";
import { posthog } from "@/features/analytics/posthog";
import { defineAbilityForSpace } from "@/features/space/ability";
import {
  createSpaceDTO,
  getActiveSpaceForUser,
  getMember,
  getSpaceSeatCount,
} from "@/features/space/data";
import { defineAbilityForMember } from "@/features/space/member/ability";
import { createSpace } from "@/features/space/mutations";
import { memberRoleSchema } from "@/features/space/schema";
import type { SpaceDTO } from "@/features/space/types";
import {
  fromDBRole,
  getTotalSeatsForSpace,
  toDBRole,
} from "@/features/space/utils";
import { setActiveSpace } from "@/features/user/mutations";
import {
  deleteImageFromS3,
  getImageUploadUrl,
} from "@/lib/storage/image-upload";
import { getEmailClient } from "@/utils/emails";
import {
  createRateLimitMiddleware,
  privateProcedure,
  router,
  spaceProcedure,
} from "../trpc";

const logger = createLogger("spaces/router");

export const spaces = router({
  // ── Queries ──────────────────────────────────────────────────────────
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
            primaryColor: true,
            showBranding: true,
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
  getCurrent: privateProcedure.query(async ({ ctx }) => {
    return await getActiveSpaceForUser(ctx.user.id);
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

  // ── Mutations ────────────────────────────────────────────────────────
  setActive: privateProcedure
    .input(z.object({ spaceId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const member = await prisma.spaceMember.findUnique({
        where: {
          spaceId_userId: {
            spaceId: input.spaceId,
            userId: ctx.user.id,
          },
        },
      });

      if (!member) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Space not found",
        });
      }

      await setActiveSpace({
        userId: ctx.user.id,
        spaceId: input.spaceId,
      });

      posthog()?.capture({
        distinctId: ctx.user.id,
        event: "space_set_active",
        properties: {
          space_id: input.spaceId,
        },
        groups: {
          space: input.spaceId,
        },
      });
    }),

  create: privateProcedure
    .use(createRateLimitMiddleware("space_create", 5, "1 m"))
    .input(z.object({ name: z.string().min(1).max(100) }))
    .mutation(async ({ ctx, input }) => {
      const space = await createSpace({
        name: input.name,
        ownerId: ctx.user.id,
      });

      posthog()?.groupIdentify({
        groupType: "space",
        groupKey: space.id,
        properties: {
          name: space.name,
          memberCount: 1,
          seatCount: 1,
          tier: "hobby",
        },
      });

      posthog()?.capture({
        distinctId: ctx.user.id,
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

    posthog()?.capture({
      distinctId: ctx.user.id,
      event: "space_delete",
      properties: {
        space_id: ctx.space.id,
      },
      groups: {
        space: ctx.space.id,
      },
    });
  }),

  update: spaceProcedure
    .input(z.object({ name: z.string().min(1).max(100) }))
    .mutation(async ({ ctx, input }) => {
      const memberAbility = defineAbilityForMember({
        user: ctx.user,
        space: ctx.space,
      });

      if (memberAbility.cannot("update", subject("Space", ctx.space))) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to update this space",
        });
      }

      await prisma.space.update({
        where: { id: ctx.space.id },
        data: { name: input.name },
      });

      posthog()?.capture({
        distinctId: ctx.user.id,
        event: "space_update",
        properties: {
          space_name: input.name,
        },
        groups: {
          space: ctx.space.id,
        },
      });
    }),

  updatePrimaryColor: spaceProcedure
    .input(
      z.object({
        primaryColor: z
          .string()
          .regex(/^#[0-9a-fA-F]{6}$/, "Invalid hex color")
          .nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const memberAbility = defineAbilityForMember({
        user: ctx.user,
        space: ctx.space,
      });

      if (memberAbility.cannot("update", subject("Space", ctx.space))) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to update this space",
        });
      }

      await prisma.space.update({
        where: { id: ctx.space.id },
        data: { primaryColor: input.primaryColor },
      });
    }),

  updateShowBranding: spaceProcedure
    .input(z.object({ showBranding: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const memberAbility = defineAbilityForMember({
        user: ctx.user,
        space: ctx.space,
      });

      if (memberAbility.cannot("update", subject("Space", ctx.space))) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to update this space",
        });
      }

      if (input.showBranding && ctx.space.tier !== "pro") {
        throw new TRPCError({
          code: "PAYMENT_REQUIRED",
          message: "You need a Pro subscription to enable custom branding",
        });
      }

      await prisma.space.update({
        where: { id: ctx.space.id },
        data: { showBranding: input.showBranding },
      });
    }),

  inviteMember: spaceProcedure
    .input(z.object({ email: z.email(), role: memberRoleSchema }))
    .mutation(async ({ ctx, input }) => {
      const spaceAbility = defineAbilityForSpace(ctx.space);

      if (spaceAbility.cannot("invite", "Member")) {
        throw new TRPCError({
          code: "PAYMENT_REQUIRED",
          message:
            "You need a Pro subscription to invite members to this space",
        });
      }

      const memberAbility = defineAbilityForMember({
        user: ctx.user,
        space: ctx.space,
      });

      if (memberAbility.cannot("create", "SpaceMemberInvite")) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to invite members to this space",
        });
      }

      // Check if user is already a member
      const existingUser = await prisma.user.findUnique({
        where: { email: input.email },
        include: {
          memberOf: {
            where: { spaceId: ctx.space.id },
          },
        },
      });

      if (existingUser?.memberOf && existingUser.memberOf.length > 0) {
        return {
          ok: false as const,
          code: "ALREADY_MEMBER" as const,
        };
      }

      // Check if there's already a pending invite
      const existingInvite = await prisma.spaceMemberInvite.findUnique({
        where: {
          spaceId_email: {
            spaceId: ctx.space.id,
            email: input.email,
          },
        },
      });

      if (existingInvite) {
        if (existingInvite.role !== toDBRole(input.role)) {
          await prisma.spaceMemberInvite.update({
            where: { id: existingInvite.id },
            data: { role: toDBRole(input.role) },
          });

          return {
            ok: true as const,
            code: "INVITE_UPDATED" as const,
          };
        }

        return {
          ok: false as const,
          code: "INVITE_PENDING" as const,
        };
      }

      // Check seat availability only for new invites
      const [currentSeatCount, totalSeats] = await Promise.all([
        getSpaceSeatCount(ctx.space.id),
        getTotalSeatsForSpace(ctx.space.id),
      ]);

      if (currentSeatCount >= totalSeats) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "There are not enough available seats to perform this action",
        });
      }

      const invite = await prisma.spaceMemberInvite.create({
        data: {
          spaceId: ctx.space.id,
          email: input.email,
          role: toDBRole(input.role),
          inviterId: ctx.user.id,
        },
      });

      const emailClient = await getEmailClient(
        existingUser?.locale ?? ctx.user.locale,
      );

      try {
        await emailClient.sendTemplate("SpaceInviteEmail", {
          to: input.email,
          props: {
            spaceName: ctx.space.name,
            inviterName: ctx.user.name,
            spaceRole: input.role,
            inviteUrl: absoluteUrl(`/accept-invite/${invite.id}`),
          },
        });
      } catch {
        // cleanup invite
        if (invite) {
          await prisma.spaceMemberInvite.delete({ where: { id: invite.id } });
        }
        return {
          ok: false as const,
          code: "INVITE_FAILED" as const,
        };
      }

      posthog()?.capture({
        distinctId: ctx.user.id,
        event: "space_member_invite",
        properties: {
          role: input.role,
        },
        groups: {
          space: ctx.space.id,
        },
      });

      return {
        ok: true as const,
        code: "INVITE_SENT" as const,
      };
    }),

  acceptInvite: privateProcedure
    .input(z.object({ spaceId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const spaceMemberInvite = await prisma.spaceMemberInvite.findUnique({
        where: {
          spaceId_email: {
            spaceId: input.spaceId,
            email: ctx.user.email,
          },
        },
      });

      if (!spaceMemberInvite) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No pending invite found for this space",
        });
      }

      const { memberCount } = await prisma.$transaction(async (tx) => {
        const [usedSeats, totalSeats] = await Promise.all([
          tx.spaceMember.count({ where: { spaceId: input.spaceId } }),
          getTotalSeatsForSpace(input.spaceId),
        ]);

        if (usedSeats >= totalSeats) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message:
              "There are not enough available seats to accept this invitation",
          });
        }

        await tx.spaceMember.create({
          data: {
            spaceId: input.spaceId,
            userId: ctx.user.id,
            role: spaceMemberInvite.role,
          },
        });

        await tx.spaceMemberInvite.delete({
          where: { id: spaceMemberInvite.id },
        });

        return { memberCount: usedSeats + 1 };
      });

      try {
        await setActiveSpace({
          userId: ctx.user.id,
          spaceId: input.spaceId,
        });
      } catch (error) {
        logger.warn({ error }, "Failed to update user's active space");
      }

      posthog()?.capture({
        distinctId: ctx.user.id,
        event: "space_member_join",
        properties: {
          member_count: memberCount,
        },
        groups: {
          space: input.spaceId,
        },
      });
    }),

  removeMember: spaceProcedure
    .input(z.object({ memberId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const member = await getMember(input.memberId);
      if (!member) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Member not found",
        });
      }

      const memberAbility = defineAbilityForMember({
        user: ctx.user,
        space: ctx.space,
      });

      if (memberAbility.cannot("delete", subject("SpaceMember", member))) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "You do not have permission to remove members from this space",
        });
      }

      const deletedMember = await prisma.spaceMember.delete({
        where: { id: input.memberId },
      });

      const memberCount = await prisma.spaceMember.count({
        where: { spaceId: member.spaceId },
      });

      posthog()?.capture({
        distinctId: ctx.user.id,
        event: "space_member_remove",
        properties: {
          member_count: memberCount,
          deleted_member_user_id: deletedMember.userId,
        },
        groups: {
          space: member.spaceId,
        },
      });
    }),

  changeMemberRole: spaceProcedure
    .input(z.object({ memberId: z.string(), role: memberRoleSchema }))
    .mutation(async ({ ctx, input }) => {
      const member = await getMember(input.memberId);
      if (!member) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Member not found",
        });
      }

      const memberAbility = defineAbilityForMember({
        user: ctx.user,
        space: ctx.space,
      });

      if (memberAbility.cannot("update", subject("SpaceMember", member))) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "You do not have permission to change member roles in this space",
        });
      }

      await prisma.spaceMember.update({
        where: { id: input.memberId },
        data: { role: toDBRole(input.role) },
      });
    }),

  cancelInvite: spaceProcedure
    .input(z.object({ inviteId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const invite = await prisma.spaceMemberInvite.findUnique({
        where: { id: input.inviteId },
      });

      if (!invite) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invite not found",
        });
      }

      if (invite.spaceId !== ctx.space.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have access to this invite",
        });
      }

      const memberAbility = defineAbilityForMember({
        user: ctx.user,
        space: ctx.space,
      });

      if (memberAbility.cannot("delete", "SpaceMemberInvite")) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to cancel invites",
        });
      }

      await prisma.spaceMemberInvite.delete({
        where: { id: input.inviteId },
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

    posthog()?.capture({
      distinctId: ctx.user.id,
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

      posthog()?.capture({
        distinctId: ctx.user.id,
        event: "space_member_leave",
        properties: {
          member_count: memberCount,
        },
        groups: {
          space: input.spaceId,
        },
      });
    }),

  getImageUploadUrl: spaceProcedure
    .input(
      z.object({
        fileType: z.enum(["image/jpeg", "image/png"]),
        fileSize: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const memberAbility = defineAbilityForMember({
        user: ctx.user,
        space: ctx.space,
      });

      if (memberAbility.cannot("update", subject("Space", ctx.space))) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to update this space",
        });
      }

      return await getImageUploadUrl({
        keyPrefix: "spaces",
        entityId: ctx.space.id,
        fileType: input.fileType,
        fileSize: input.fileSize,
      });
    }),

  updateImage: spaceProcedure
    .input(z.object({ imageKey: z.string().max(255) }))
    .mutation(async ({ ctx, input }) => {
      const memberAbility = defineAbilityForMember({
        user: ctx.user,
        space: ctx.space,
      });

      if (memberAbility.cannot("update", subject("Space", ctx.space))) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to update this space",
        });
      }

      const expectedPrefix = `spaces/${ctx.space.id}-`;
      if (!input.imageKey.startsWith(expectedPrefix)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid image key",
        });
      }

      const oldImageKey = ctx.space.image;

      await prisma.space.update({
        where: { id: ctx.space.id },
        data: { image: input.imageKey },
      });

      if (oldImageKey) {
        after(() => deleteImageFromS3(oldImageKey));
      }
    }),

  removeImage: spaceProcedure.mutation(async ({ ctx }) => {
    const memberAbility = defineAbilityForMember({
      user: ctx.user,
      space: ctx.space,
    });

    if (memberAbility.cannot("update", subject("Space", ctx.space))) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You do not have permission to update this space",
      });
    }

    const oldImageKey = ctx.space.image;

    await prisma.space.update({
      where: { id: ctx.space.id },
      data: { image: null },
    });

    if (oldImageKey) {
      await deleteImageFromS3(oldImageKey);
    }
  }),
});
