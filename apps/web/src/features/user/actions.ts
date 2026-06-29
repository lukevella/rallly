"use server";
import { subject } from "@casl/ability";
import { prisma } from "@rallly/database";
import * as z from "zod";
import {
  updateUserImage,
  updateUserLocalization,
  updateUserName,
} from "@/features/user/mutations";
import { AppError } from "@/lib/errors";
import { timeFormatSchema, weekStartSchema } from "@/lib/localization/schema";
import {
  adminActionClient,
  authActionClient,
  createRateLimitMiddleware,
} from "@/lib/safe-action/server";
import {
  deleteImageFromS3,
  getImageUploadUrl,
} from "@/lib/storage/image-upload";
import { timezoneSchema } from "@/utils/timezone-schema";

export const updateUserNameAction = authActionClient
  .metadata({ actionName: "update_user_name" })
  .inputSchema(
    z.object({
      name: z.string().trim().min(1).max(100),
    }),
  )
  .action(async ({ ctx, parsedInput }) => {
    await updateUserName({ userId: ctx.user.id, name: parsedInput.name });
  });

export const updateLocalizationAction = authActionClient
  .metadata({ actionName: "update_localization" })
  .inputSchema(
    z.object({
      timeZone: timezoneSchema.optional(),
      timeFormat: timeFormatSchema.optional(),
      weekStart: weekStartSchema.optional(),
    }),
  )
  .action(async ({ ctx, parsedInput }) => {
    await updateUserLocalization({
      userId: ctx.user.id,
      timeZone: parsedInput.timeZone,
      timeFormat: parsedInput.timeFormat,
      weekStart: parsedInput.weekStart,
    });
  });

export const getAvatarUploadUrlAction = authActionClient
  .metadata({ actionName: "get_avatar_upload_url" })
  .use(createRateLimitMiddleware(10, "1 h"))
  .inputSchema(
    z.object({
      fileType: z.enum(["image/jpeg", "image/png"]),
      fileSize: z.number(),
    }),
  )
  .action(async ({ ctx, parsedInput }) => {
    return await getImageUploadUrl({
      keyPrefix: "avatars",
      entityId: ctx.user.id,
      fileType: parsedInput.fileType,
      fileSize: parsedInput.fileSize,
    });
  });

export const updateUserAvatarAction = authActionClient
  .metadata({ actionName: "update_user_avatar" })
  .inputSchema(
    z.object({
      imageKey: z.string().max(255),
    }),
  )
  .action(async ({ ctx, parsedInput }) => {
    const { imageKey } = parsedInput;

    if (!imageKey.startsWith(`avatars/${ctx.user.id}-`)) {
      throw new AppError({
        code: "FORBIDDEN",
        message: "Invalid image key",
      });
    }

    const oldImageKey = ctx.user.image;

    await updateUserImage({ userId: ctx.user.id, image: imageKey });

    // Only delete from storage if it's an internal avatar, not an external
    // URL from an OAuth provider.
    if (oldImageKey && !oldImageKey.startsWith("https://")) {
      await deleteImageFromS3(oldImageKey);
    }
  });

export const removeUserAvatarAction = authActionClient
  .metadata({ actionName: "remove_user_avatar" })
  .action(async ({ ctx }) => {
    const oldImageKey = ctx.user.image;

    await updateUserImage({ userId: ctx.user.id, image: null });

    // Only delete from storage if it's an internal avatar, not an external
    // URL from an OAuth provider.
    const isInternalAvatar = oldImageKey && !oldImageKey.startsWith("https://");

    if (isInternalAvatar) {
      await deleteImageFromS3(oldImageKey);
    }
  });

export const changeRoleAction = adminActionClient
  .metadata({ actionName: "change_role" })
  .inputSchema(
    z.object({
      userId: z.string(),
      role: z.enum(["user", "admin"]),
    }),
  )
  .action(async ({ ctx, parsedInput }) => {
    const { userId, role } = parsedInput;

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      throw new AppError({
        code: "NOT_FOUND",
        message: `User ${userId} not found`,
      });
    }

    if (targetUser.role === role) {
      throw new AppError({
        code: "FORBIDDEN",
        message: "User is already this role",
      });
    }

    if (ctx.ability.cannot("update", subject("User", targetUser), "role")) {
      throw new AppError({
        code: "UNAUTHORIZED",
        message: "Current user is not authorized to update role",
      });
    }

    await prisma.user.update({
      where: {
        id: targetUser.id,
      },
      data: {
        role,
      },
    });
  });

export const deleteUserAction = adminActionClient
  .metadata({ actionName: "delete_user" })
  .inputSchema(
    z.object({
      userId: z.string(),
    }),
  )
  .action(async ({ parsedInput }) => {
    const userId = parsedInput.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscriptions: {
          select: {
            active: true,
          },
        },
      },
    });

    if (!user) {
      throw new AppError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    // Check if user has active subscriptions
    if (user.subscriptions.some((subscription) => subscription.active)) {
      throw new AppError({
        code: "FORBIDDEN",
        message: "User has active subscriptions",
      });
    }

    await prisma.user.delete({
      where: {
        id: userId,
      },
    });

    return {
      success: true,
    };
  });
