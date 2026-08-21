"use server";
import { subject } from "@casl/ability";
import { prisma } from "@rallly/database";
import { supportedLngs } from "@rallly/languages";
import { headers } from "next/headers";
import * as z from "zod";
import { avatarAssetProfile } from "@/features/user/constants";
import { isEmailTaken } from "@/features/user/data";
import { banUser, unbanUser, updateUserRole } from "@/features/user/mutations";
import { jobTitleFieldSchema } from "@/features/user/schema";
import authLib from "@/lib/auth";
import { timeFormatSchema, weekStartSchema } from "@/lib/datetime/schema";
import { AppError } from "@/lib/errors/app-error";
import { track } from "@/lib/posthog";
import {
  adminActionClient,
  authActionClient,
  createRateLimitMiddleware,
} from "@/lib/safe-action/server";
import {
  assertAssetKey,
  createAssetUploadUrl,
  replaceStoredAsset,
} from "@/lib/storage/asset-upload";
import { timezoneSchema } from "@/lib/utils/timezone-schema";

// Self-profile updates call Better-Auth's updateUser endpoint directly
// instead of going through a mutation: the target user is defined by the
// session (identity, not a privilege decision), and the endpoint refreshes
// both the session snapshot in secondary storage and the session cookie
// cache in one step. Writes that target an arbitrary userId (admin,
// moderation, system contexts) live in mutations.ts.

export const updateUserNameAction = authActionClient
  .metadata({ actionName: "update_user_name" })
  .inputSchema(
    z.object({
      name: z.string().trim().min(1).max(100),
    }),
  )
  .action(async ({ parsedInput }) => {
    await authLib.api.updateUser({
      body: { name: parsedInput.name },
      headers: await headers(),
    });
  });

/**
 * Self-declared role, collected at setup and editable on the profile page.
 * Optional and erasable — consent is the legal basis for holding it, so null
 * has to be a valid answer.
 */
export const updateJobTitleAction = authActionClient
  .metadata({ actionName: "update_job_title" })
  .inputSchema(
    z.object({
      jobTitle: jobTitleFieldSchema,
    }),
  )
  .action(async ({ ctx, parsedInput }) => {
    await authLib.api.updateUser({
      body: { jobTitle: parsedInput.jobTitle },
      headers: await headers(),
    });

    track(ctx.user, {
      event: "job_title_set",
      properties: {
        // Person property, so the segment can be joined against anything the
        // user does later — not just this event.
        $set: { job_title: parsedInput.jobTitle },
      },
    });
  });

export const updateLocalizationAction = authActionClient
  .metadata({ actionName: "update_localization" })
  .inputSchema(
    z.object({
      locale: z
        .string()
        .refine((value) => supportedLngs.includes(value))
        .optional(),
      timeZone: timezoneSchema.optional(),
      timeFormat: timeFormatSchema.optional(),
      weekStart: weekStartSchema.optional(),
    }),
  )
  .action(async ({ parsedInput }) => {
    // The locale cookie is written client-side (see localization-preferences.tsx).
    // Writing it here via next/headers would collide with updateUser's session
    // cookie and drop it.
    await authLib.api.updateUser({
      body: {
        locale: parsedInput.locale,
        timeZone: parsedInput.timeZone,
        timeFormat: parsedInput.timeFormat,
        weekStart: parsedInput.weekStart,
      },
      headers: await headers(),
    });
  });

// Better-Auth's request-email-change endpoint returns success without sending
// anything when the address already belongs to an account, to avoid confirming
// that it is registered. That leaves the caller unable to tell "code sent" from
// "silently skipped", so check first and report the conflict as a value. The
// address can still be claimed between this check and verification, which the
// verify step handles via its own "email already in use" error.
export const checkEmailAvailabilityAction = authActionClient
  .metadata({ actionName: "check_email_availability" })
  .use(createRateLimitMiddleware(10, "1 h"))
  .inputSchema(
    z.object({
      email: z.email(),
    }),
  )
  .action(async ({ ctx, parsedInput }) => {
    const email = parsedInput.email.toLowerCase();

    if (email === ctx.user.email.toLowerCase()) {
      return { ok: false as const, reason: "same_email" as const };
    }

    if (await isEmailTaken(email)) {
      return { ok: false as const, reason: "email_taken" as const };
    }

    return { ok: true as const };
  });

export const getAvatarUploadUrlAction = authActionClient
  .metadata({ actionName: "get_avatar_upload_url" })
  .use(createRateLimitMiddleware(10, "1 h"))
  .inputSchema(
    z.object({
      fileType: z.enum(avatarAssetProfile.accept),
      fileSize: z.number().int().positive().max(avatarAssetProfile.maxSize),
    }),
  )
  .action(async ({ ctx, parsedInput }) => {
    return await createAssetUploadUrl({
      profile: avatarAssetProfile,
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

    assertAssetKey(imageKey, {
      profile: avatarAssetProfile,
      entityId: ctx.user.id,
    });

    await replaceStoredAsset({
      currentKey: ctx.user.image,
      nextKey: imageKey,
      persist: async () => {
        await authLib.api.updateUser({
          body: { image: imageKey },
          headers: await headers(),
        });
      },
    });
  });

export const removeUserAvatarAction = authActionClient
  .metadata({ actionName: "remove_user_avatar" })
  .action(async ({ ctx }) => {
    await replaceStoredAsset({
      currentKey: ctx.user.image,
      nextKey: null,
      persist: async () => {
        await authLib.api.updateUser({
          body: { image: null },
          headers: await headers(),
        });
      },
    });
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

    await updateUserRole({ userId: targetUser.id, role });
  });

export const banUserAction = adminActionClient
  .metadata({ actionName: "ban_user" })
  .inputSchema(
    z.object({
      userId: z.string(),
      reason: z.string().trim().max(500).optional(),
    }),
  )
  .action(async ({ ctx, parsedInput }) => {
    const { userId, reason } = parsedInput;

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      throw new AppError({
        code: "NOT_FOUND",
        message: `User ${userId} not found`,
      });
    }

    if (targetUser.banned) {
      throw new AppError({
        code: "FORBIDDEN",
        message: "User is already banned",
      });
    }

    if (ctx.ability.cannot("update", subject("User", targetUser), "banned")) {
      throw new AppError({
        code: "UNAUTHORIZED",
        message: "Current user is not authorized to ban this user",
      });
    }

    await banUser({ userId, reason: reason || undefined });
  });

export const unbanUserAction = adminActionClient
  .metadata({ actionName: "unban_user" })
  .inputSchema(
    z.object({
      userId: z.string(),
    }),
  )
  .action(async ({ ctx, parsedInput }) => {
    const { userId } = parsedInput;

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      throw new AppError({
        code: "NOT_FOUND",
        message: `User ${userId} not found`,
      });
    }

    if (!targetUser.banned) {
      throw new AppError({
        code: "FORBIDDEN",
        message: "User is not banned",
      });
    }

    if (ctx.ability.cannot("update", subject("User", targetUser), "banned")) {
      throw new AppError({
        code: "UNAUTHORIZED",
        message: "Current user is not authorized to unban this user",
      });
    }

    await unbanUser({ userId });
  });
