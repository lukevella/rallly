"use server";

import { subject } from "@casl/ability";
import { accessibleBy } from "@casl/prisma";
import { prisma } from "@rallly/database";
import { absoluteUrl } from "@rallly/utils/absolute-url";
import { waitUntil } from "@vercel/functions";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  trackInviteSent,
  trackMemberJoin,
  trackMemberLeaveSpace,
  trackMemberRemoved,
  trackSetActiveSpace,
  trackSpaceCreated,
  trackSpaceDeleted,
  trackSpaceUpdated,
} from "@/features/space/analytics";
import { getMember, getSpaceSeatCount } from "@/features/space/data";
import { createSpace } from "@/features/space/mutations";
import { memberRoleSchema } from "@/features/space/schema";
import { getTotalSeatsForSpace, toDBRole } from "@/features/space/utils";
import { setActiveSpace } from "@/features/user/mutations";
import { AppError } from "@/lib/errors";
import {
  authActionClient,
  createRateLimitMiddleware,
  spaceActionClient,
} from "@/lib/safe-action/server";
import {
  deleteImageFromS3,
  getImageUploadUrl,
} from "@/lib/storage/image-upload";
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

    trackSetActiveSpace({
      spaceId: parsedInput.spaceId,
      userId: ctx.user.id,
      name: space.name,
    });
  });

export const createSpaceAction = authActionClient
  .metadata({
    actionName: "space_create",
  })
  .use(createRateLimitMiddleware(5, "1h"))
  .inputSchema(
    z.object({
      name: z.string().min(1).max(100),
    }),
  )
  .action(async ({ ctx, parsedInput }) => {
    const space = await createSpace({
      name: parsedInput.name,
      ownerId: ctx.user.id,
    });

    trackSpaceCreated({ space, userId: ctx.user.id });

    revalidatePath("/", "layout");

    return space;
  });

export const deleteSpaceAction = spaceActionClient
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
        id: parsedInput.spaceId,
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

    if (ctx.getMemberAbility().cannot("delete", subject("Space", space))) {
      throw new AppError({
        code: "FORBIDDEN",
        message: "You do not have access to this space",
      });
    }

    // Check if space has an active subscription
    if (space.subscription?.active) {
      throw new AppError({
        code: "FORBIDDEN",
        message:
          "Cannot delete space with an active subscription. Please cancel the subscription first.",
      });
    }

    await prisma.space.delete({
      where: {
        id: parsedInput.spaceId,
      },
    });

    trackSpaceDeleted({
      spaceId: space.id,
      userId: ctx.user.id,
    });

    revalidatePath("/", "layout");
  });

export const inviteMemberAction = spaceActionClient
  .metadata({
    actionName: "space_invite_member",
  })
  .inputSchema(
    z.object({
      email: z.email(),
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
      // Update existing invite if role is different (allow regardless of seats)
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

    // Check seat availability only for new invites
    const [currentSeatCount, totalSeats] = await Promise.all([
      getSpaceSeatCount(ctx.space.id),
      getTotalSeatsForSpace(ctx.space.id),
    ]);

    if (currentSeatCount >= totalSeats) {
      throw new AppError({
        code: "FORBIDDEN",
        message: "There are not enough available seats to perform this action",
      });
    }

    try {
      const invite = await prisma.spaceMemberInvite.create({
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

      trackInviteSent({
        spaceId: ctx.space.id,
        userId: ctx.user.id,
        role: parsedInput.role,
        email: parsedInput.email,
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

    const { memberCount } = await prisma.$transaction(async (tx) => {
      // Check seat availability before accepting the invite
      const [usedSeats, totalSeats] = await Promise.all([
        tx.spaceMember.count({ where: { spaceId: parsedInput.spaceId } }),
        getTotalSeatsForSpace(parsedInput.spaceId),
      ]);

      if (usedSeats >= totalSeats) {
        throw new AppError({
          code: "FORBIDDEN",
          message:
            "There are not enough available seats to accept this invitation",
        });
      }

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

      return { memberCount: usedSeats + 1 };
    });

    try {
      await setActiveSpace({
        userId: ctx.user.id,
        spaceId: parsedInput.spaceId,
      });
    } catch {
      console.warn("Failed to update user's active space");
    }

    trackMemberJoin({
      spaceId: parsedInput.spaceId,
      userId: ctx.user.id,
      memberCount,
    });
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

    const deletedMember = await prisma.spaceMember.delete({
      where: {
        id: parsedInput.memberId,
      },
    });

    const memberCount = await prisma.spaceMember.count({
      where: {
        spaceId: member.spaceId,
      },
    });

    trackMemberRemoved({
      spaceId: member.spaceId,
      userId: deletedMember.userId,
      memberCount,
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

export const updateSpaceAction = spaceActionClient
  .metadata({
    actionName: "space_update",
  })
  .inputSchema(
    z.object({
      name: z.string().min(1).max(100),
      image: z.string().optional(),
    }),
  )
  .action(async ({ ctx, parsedInput }) => {
    if (
      ctx
        .getMemberAbility()
        .cannot(
          "update",
          subject("Space", { id: ctx.space.id, ownerId: ctx.space.ownerId }),
        )
    ) {
      throw new AppError({
        code: "FORBIDDEN",
        message: "You do not have permission to update this space",
      });
    }

    const oldImage = ctx.space.image;

    await prisma.space.update({
      where: {
        id: ctx.space.id,
      },
      data: {
        name: parsedInput.name,
        image: parsedInput.image,
      },
    });

    // Delete old image from S3 if it exists and we're updating to a new image
    if (oldImage && parsedInput.image && oldImage !== parsedInput.image) {
      await deleteImageFromS3(oldImage);
    }

    trackSpaceUpdated({
      spaceId: ctx.space.id,
      userId: ctx.user.id,
      name: parsedInput.name,
    });
  });

export const getSpaceImageUploadUrlAction = spaceActionClient
  .metadata({
    actionName: "space_get_image_upload_url",
  })
  .inputSchema(
    z.object({
      fileType: z.enum(["image/jpeg", "image/png"]),
      fileSize: z.number(),
    }),
  )
  .action(async ({ ctx, parsedInput }) => {
    if (
      ctx
        .getMemberAbility()
        .cannot(
          "update",
          subject("Space", { id: ctx.space.id, ownerId: ctx.space.ownerId }),
        )
    ) {
      throw new AppError({
        code: "FORBIDDEN",
        message: "You do not have permission to update this space",
      });
    }

    return await getImageUploadUrl({
      keyPrefix: "spaces",
      entityId: ctx.space.id,
      fileType: parsedInput.fileType,
      fileSize: parsedInput.fileSize,
    });
  });

export const updateSpaceImageAction = spaceActionClient
  .metadata({
    actionName: "space_update_image",
  })
  .inputSchema(
    z.object({
      imageKey: z.string().max(255),
    }),
  )
  .action(async ({ ctx, parsedInput }) => {
    if (
      ctx
        .getMemberAbility()
        .cannot(
          "update",
          subject("Space", { id: ctx.space.id, ownerId: ctx.space.ownerId }),
        )
    ) {
      throw new AppError({
        code: "FORBIDDEN",
        message: "You do not have permission to update this space",
      });
    }

    const oldImageKey = ctx.space.image;

    await prisma.space.update({
      where: { id: ctx.space.id },
      data: { image: parsedInput.imageKey },
    });

    // Delete old image from S3 if it exists
    if (oldImageKey) {
      waitUntil(deleteImageFromS3(oldImageKey));
    }
  });

export const removeSpaceImageAction = spaceActionClient
  .metadata({
    actionName: "space_remove_image",
  })
  .action(async ({ ctx }) => {
    if (
      ctx
        .getMemberAbility()
        .cannot(
          "update",
          subject("Space", { id: ctx.space.id, ownerId: ctx.space.ownerId }),
        )
    ) {
      throw new AppError({
        code: "FORBIDDEN",
        message: "You do not have permission to update this space",
      });
    }

    const oldImageKey = ctx.space.image;

    await prisma.space.update({
      where: { id: ctx.space.id },
      data: { image: null },
    });

    // Delete image from S3 if it exists
    if (oldImageKey) {
      await deleteImageFromS3(oldImageKey);
    }
  });

export const leaveSpaceFromAccountAction = authActionClient
  .metadata({
    actionName: "space_leave_from_account",
  })
  .inputSchema(
    z.object({
      spaceId: z.string(),
    }),
  )
  .action(async ({ ctx, parsedInput }) => {
    const space = await prisma.space.findUnique({
      where: {
        id: parsedInput.spaceId,
      },
      select: {
        id: true,
        ownerId: true,
      },
    });

    if (!space) {
      throw new AppError({
        code: "NOT_FOUND",
        message: "Space not found",
      });
    }

    // Check if user is the space owner
    if (space.ownerId === ctx.user.id) {
      throw new AppError({
        code: "FORBIDDEN",
        message:
          "Space owners cannot leave their space. Transfer ownership first.",
      });
    }

    // Get the user's member record
    const member = await prisma.spaceMember.findFirst({
      where: {
        spaceId: parsedInput.spaceId,
        userId: ctx.user.id,
      },
    });

    if (!member) {
      throw new AppError({
        code: "NOT_FOUND",
        message: "You are not a member of this space",
      });
    }

    // Check if user has other spaces
    const userSpaces = await prisma.spaceMember.findMany({
      where: {
        userId: ctx.user.id,
        NOT: {
          spaceId: parsedInput.spaceId,
        },
      },
      orderBy: {
        lastSelectedAt: "desc",
      },
    });

    if (userSpaces.length === 0) {
      throw new AppError({
        code: "FORBIDDEN",
        message: "Cannot leave your last remaining space",
      });
    }

    await prisma.$transaction(async (tx) => {
      // Remove the user from the space
      await tx.spaceMember.delete({
        where: {
          id: member.id,
        },
      });

      // Update the most recent remaining space to be current
      // (this handles the case where they're leaving their active space)
      await tx.spaceMember.update({
        where: {
          id: userSpaces[0].id,
        },
        data: {
          lastSelectedAt: new Date(),
        },
      });
    });

    const memberCount = await prisma.spaceMember.count({
      where: {
        spaceId: parsedInput.spaceId,
      },
    });

    trackMemberLeaveSpace({
      spaceId: parsedInput.spaceId,
      userId: ctx.user.id,
      memberCount,
    });
  });

export const leaveSpaceAction = spaceActionClient
  .metadata({
    actionName: "space_leave",
  })
  .action(async ({ ctx }) => {
    // Check if user is the space owner
    if (ctx.space.ownerId === ctx.user.id) {
      throw new AppError({
        code: "FORBIDDEN",
        message:
          "Space owners cannot leave their space. Transfer ownership first.",
      });
    }

    // Get the user's member record
    const member = await prisma.spaceMember.findFirst({
      where: {
        spaceId: ctx.space.id,
        userId: ctx.user.id,
      },
    });

    if (!member) {
      throw new AppError({
        code: "NOT_FOUND",
        message: "You are not a member of this space",
      });
    }

    // Check if user has other spaces
    const userSpaces = await prisma.spaceMember.findMany({
      where: {
        userId: ctx.user.id,
        NOT: {
          spaceId: ctx.space.id,
        },
      },
      orderBy: {
        lastSelectedAt: "desc",
      },
    });

    if (userSpaces.length === 0) {
      throw new AppError({
        code: "FORBIDDEN",
        message: "Cannot leave your last remaining space",
      });
    }

    await prisma.$transaction(async (tx) => {
      // Remove the user from the space
      await tx.spaceMember.delete({
        where: {
          id: member.id,
        },
      });

      // Update the most recent remaining space to be current
      // (this handles the case where they're leaving their active space)
      await tx.spaceMember.update({
        where: {
          id: userSpaces[0].id,
        },
        data: {
          lastSelectedAt: new Date(),
        },
      });
    });

    const memberCount = await prisma.spaceMember.count({
      where: {
        spaceId: ctx.space.id,
      },
    });

    trackMemberLeaveSpace({
      spaceId: ctx.space.id,
      userId: ctx.user.id,
      memberCount,
    });
  });
