"use server";

import { subject } from "@casl/ability";
import { accessibleBy } from "@casl/prisma";
import { prisma } from "@rallly/database";
import { absoluteUrl } from "@rallly/utils/absolute-url";
import { z } from "zod";
import { updateSeatCount } from "@/features/billing/mutations";
import { getMember } from "@/features/space/data";
import { memberRoleSchema } from "@/features/space/schema";
import { toDBRole } from "@/features/space/utils";
import { setActiveSpace } from "@/features/user/mutations";
import { AppError } from "@/lib/errors";
import { isFeatureEnabled } from "@/lib/feature-flags/server";
import { authActionClient, spaceActionClient } from "@/lib/safe-action/server";
import { getEmailClient } from "@/utils/emails";

export const setActiveSpaceAction = authActionClient
  .inputSchema(
    z.object({
      spaceId: z.string(),
    }),
  )
  .metadata({
    actionName: "space_set_active",
  })
  .action(async ({ ctx, parsedInput }) => {
    const space = await prisma.space.findFirst({
      where: {
        AND: [accessibleBy(ctx.ability).Space, { id: parsedInput.spaceId }],
      },
      include: {
        members: {
          where: {
            userId: ctx.user.id,
          },
        },
      },
    });

    if (!space) {
      throw new AppError({
        code: "NOT_FOUND",
        message: "Space not found",
      });
    }

    if (!ctx.ability.can("read", subject("Space", space))) {
      throw new AppError({
        code: "FORBIDDEN",
        message: "You do not have access to this space",
      });
    }

    await setActiveSpace({
      userId: ctx.user.id,
      spaceId: parsedInput.spaceId,
    });
  });

export const createSpaceAction = authActionClient
  .metadata({
    actionName: "space_create",
  })
  .inputSchema(
    z.object({
      name: z.string().min(1).max(100),
    }),
  )
  .action(async ({ ctx, parsedInput }) => {
    await prisma.space.create({
      data: {
        name: parsedInput.name,
        ownerId: ctx.user.id,
        members: {
          create: {
            userId: ctx.user.id,
            role: "ADMIN",
            lastSelectedAt: new Date(),
          },
        },
      },
    });
  });

export const deleteSpaceAction = authActionClient
  .metadata({
    actionName: "space_delete",
  })
  .inputSchema(
    z.object({
      spaceId: z.string(),
    }),
  )
  .action(async ({ ctx, parsedInput }) => {
    const space = await prisma.space.findFirst({
      where: {
        AND: [accessibleBy(ctx.ability).Space, { id: parsedInput.spaceId }],
      },
      include: {
        subscription: true,
      },
    });

    if (!space) {
      throw new AppError({
        code: "NOT_FOUND",
        message: "Space not found",
      });
    }

    if (ctx.ability.cannot("delete", subject("Space", space))) {
      throw new AppError({
        code: "FORBIDDEN",
        message: "You do not have access to this space",
      });
    }

    await prisma.space.delete({
      where: {
        id: parsedInput.spaceId,
      },
    });
  });

export const inviteMemberAction = spaceActionClient
  .metadata({
    actionName: "space_invite_member",
  })
  .inputSchema(
    z.object({
      email: z.string().email(),
      role: memberRoleSchema,
    }),
  )
  .action(async ({ ctx, parsedInput }) => {
    if (ctx.getSpaceAbility().cannot("invite", "Member")) {
      throw new AppError({
        code: "PAYMENT_REQUIRED",
        message: "You need a Pro subscription to invite members to this space",
      });
    }

    if (ctx.getMemberAbility().cannot("create", "SpaceMemberInvite")) {
      throw new AppError({
        code: "FORBIDDEN",
        message: "You do not have permission to invite members to this space",
      });
    }

    // Check if user is already a member
    const existingUser = await prisma.user.findUnique({
      where: { email: parsedInput.email },
      include: {
        memberOf: {
          where: { spaceId: ctx.space.id },
        },
      },
    });

    if (existingUser?.memberOf && existingUser.memberOf.length > 0) {
      return {
        success: false,
        code: "ALREADY_MEMBER" as const,
        message: "This person is already a member of this space",
      };
    }

    // Check if there's already a pending invite
    const existingInvite = await prisma.spaceMemberInvite.findUnique({
      where: {
        spaceId_email: {
          spaceId: ctx.space.id,
          email: parsedInput.email,
        },
      },
    });

    if (existingInvite) {
      // Update existing invite if role is different
      if (existingInvite.role !== toDBRole(parsedInput.role)) {
        await prisma.spaceMemberInvite.update({
          where: { id: existingInvite.id },
          data: { role: toDBRole(parsedInput.role) },
        });

        return {
          success: true,
          code: "INVITE_UPDATED" as const,
          message: "Invitation updated with new role",
        };
      }

      return {
        success: false,
        code: "INVITE_PENDING" as const,
        message: "An invitation has already been sent to this email address",
      };
    }

    try {
      await prisma.$transaction(async (tx) => {
        const invite = await tx.spaceMemberInvite.create({
          data: {
            spaceId: ctx.space.id,
            email: parsedInput.email,
            role: toDBRole(parsedInput.role),
            inviterId: ctx.user.id,
          },
        });

        const emailClient = getEmailClient(
          existingUser?.locale ?? ctx.user.locale,
        );

        await emailClient.sendTemplate("SpaceInviteEmail", {
          to: parsedInput.email,
          props: {
            spaceName: ctx.space.name,
            inviterName: ctx.user.name,
            spaceRole: parsedInput.role,
            inviteUrl: absoluteUrl(`/accept-invite/${invite.id}`),
          },
        });
      });

      return {
        success: true,
        code: "INVITE_SENT" as const,
        message: "Invitation sent successfully",
      };
    } catch {
      console.error("Failed to send invitation");
      return {
        success: false,
        code: "INVITE_FAILED" as const,
        message: "Unable to send invitation. Please try again.",
      };
    }
  });

export const acceptInviteAction = authActionClient
  .metadata({
    actionName: "space_accept_invite",
  })
  .inputSchema(
    z.object({
      spaceId: z.string(),
    }),
  )
  .action(async ({ ctx, parsedInput }) => {
    const spaceMemberInvite = await prisma.spaceMemberInvite.findUnique({
      where: {
        spaceId_email: {
          spaceId: parsedInput.spaceId,
          email: ctx.user.email,
        },
      },
    });

    if (!spaceMemberInvite) {
      throw new AppError({
        code: "NOT_FOUND",
        message: "No pending invite found for this space",
      });
    }

    await prisma.$transaction(async (tx) => {
      await tx.spaceMember.create({
        data: {
          spaceId: parsedInput.spaceId,
          userId: ctx.user.id,
          role: spaceMemberInvite.role,
        },
      });

      await tx.spaceMemberInvite.delete({
        where: {
          id: spaceMemberInvite.id,
        },
      });

      if (isFeatureEnabled("billing")) {
        await updateSeatCount(spaceMemberInvite.spaceId, 1);
      }
    });

    try {
      await setActiveSpace({
        userId: ctx.user.id,
        spaceId: parsedInput.spaceId,
      });
    } catch {
      console.warn("Failed to update user's active space");
    }
  });

export const removeMemberAction = spaceActionClient
  .metadata({
    actionName: "space_remove_member",
  })
  .inputSchema(
    z.object({
      memberId: z.string(),
    }),
  )
  .action(async ({ ctx, parsedInput }) => {
    const member = await getMember(parsedInput.memberId);
    if (!member) {
      throw new AppError({
        code: "NOT_FOUND",
        message: "Member not found",
      });
    }

    if (
      ctx.getMemberAbility().cannot("delete", subject("SpaceMember", member))
    ) {
      throw new AppError({
        code: "FORBIDDEN",
        message: "You do not have permission to remove members from this space",
      });
    }

    await prisma.$transaction(async (tx) => {
      await tx.spaceMember.delete({
        where: {
          id: parsedInput.memberId,
        },
      });

      if (isFeatureEnabled("billing")) {
        await updateSeatCount(member.spaceId, -1);
      }
    });
  });

export const changeMemberRoleAction = spaceActionClient
  .metadata({
    actionName: "space_change_member_role",
  })
  .inputSchema(
    z.object({
      memberId: z.string(),
      role: memberRoleSchema,
    }),
  )
  .action(async ({ ctx, parsedInput }) => {
    const member = await getMember(parsedInput.memberId);
    if (!member) {
      throw new AppError({
        code: "NOT_FOUND",
        message: "Member not found",
      });
    }

    if (
      ctx.getMemberAbility().cannot("update", subject("SpaceMember", member))
    ) {
      throw new AppError({
        code: "FORBIDDEN",
        message:
          "You do not have permission to change member roles in this space",
      });
    }

    await prisma.spaceMember.update({
      where: {
        id: parsedInput.memberId,
      },
      data: {
        role: toDBRole(parsedInput.role),
      },
    });
  });

export const cancelInviteAction = spaceActionClient
  .metadata({
    actionName: "space_cancel_invite",
  })
  .inputSchema(
    z.object({
      inviteId: z.string(),
    }),
  )
  .action(async ({ ctx, parsedInput }) => {
    const invite = await prisma.spaceMemberInvite.findUnique({
      where: { id: parsedInput.inviteId },
    });

    if (!invite) {
      throw new AppError({
        code: "NOT_FOUND",
        message: "Invite not found",
      });
    }

    if (invite.spaceId !== ctx.space.id) {
      throw new AppError({
        code: "FORBIDDEN",
        message: "You do not have access to this invite",
      });
    }

    if (ctx.getMemberAbility().cannot("delete", "SpaceMemberInvite")) {
      throw new AppError({
        code: "FORBIDDEN",
        message: "You do not have permission to cancel invites",
      });
    }

    await prisma.spaceMemberInvite.delete({
      where: { id: parsedInput.inviteId },
    });
  });
