import { subject } from "@casl/ability";
import { prisma } from "@rallly/database";
import { absoluteUrl } from "@rallly/utils/absolute-url";
import { TRPCError } from "@trpc/server";
import * as z from "zod";
import { posthog } from "@/features/analytics/posthog";
import { feedbackSchema } from "@/features/feedback/schema";
import { defaultNotificationPreferences } from "@/features/notifications/constants";
import { getNotificationPreferences } from "@/features/notifications/queries";
import { activityEventTypes } from "@/features/notifications/schema";
import { defineAbilityFor } from "@/features/user/ability";
import {
  deleteImageFromS3,
  getImageUploadUrl,
} from "@/lib/storage/image-upload";
import { getEmailClient } from "@/utils/emails";
import { createToken } from "@/utils/session";
import { timezoneSchema } from "@/utils/timezone-schema";
import {
  createRateLimitMiddleware,
  privateProcedure,
  publicProcedure,
  router,
} from "../trpc";

export const user = router({
  getMe: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      return null;
    }

    return ctx.user;
  }),
  getAuthed: privateProcedure.query(async ({ ctx }) => {
    return ctx.user;
  }),
  changeName: privateProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      await prisma.user.update({
        where: {
          id: ctx.user.id,
        },
        data: {
          name: input.name,
        },
      });
    }),
  updatePreferences: privateProcedure
    .input(
      z.object({
        locale: z.string().optional(),
        timeZone: timezoneSchema.optional(),
        weekStart: z.number().min(0).max(6).optional(),
        timeFormat: z.enum(["hours12", "hours24"]).optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.isGuest) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Guest users cannot update preferences",
        });
      }

      await prisma.user.update({
        where: {
          id: ctx.user.id,
        },
        data: input,
      });

      return { success: true };
    }),
  requestEmailChange: privateProcedure
    .input(z.object({ email: z.email() }))
    .use(createRateLimitMiddleware("request_email_change", 5, "1 h"))
    .mutation(async ({ input, ctx }) => {
      const currentUser = await prisma.user.findUnique({
        where: { id: ctx.user.id },
        select: { email: true, id: true, locale: true },
      });

      if (!currentUser) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "User not found",
        });
      }

      // check if the email is already in use
      const existingUser = await prisma.user.count({
        where: { email: input.email },
      });

      if (existingUser) {
        return {
          success: false as const,
          reason: "emailAlreadyInUse" as const,
        };
      }

      // create a verification token
      const token = await createToken(
        {
          userId: currentUser.id,
          toEmail: input.email,
        },
        {
          ttl: 60 * 10,
        },
      );

      const emailClient = await getEmailClient({
        locale: currentUser.locale ?? undefined,
      });

      emailClient.sendTemplate("ChangeEmailRequest", {
        to: input.email,
        props: {
          verificationUrl: absoluteUrl(
            `/api/user/verify-email-change?token=${token}`,
          ),
          fromEmail: currentUser.email,
          toEmail: input.email,
        },
      });

      posthog()?.capture({
        event: "account_email_change_request",
        distinctId: ctx.user.id,
        properties: {
          toEmail: input.email,
          fromEmail: currentUser.email,
        },
      });

      return { success: true as const };
    }),
  getAvatarUploadUrl: privateProcedure
    .use(createRateLimitMiddleware("get_avatar_upload_url", 10, "1 h"))
    .input(
      z.object({
        fileType: z.enum(["image/jpeg", "image/png"]),
        fileSize: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await getImageUploadUrl({
        keyPrefix: "avatars",
        entityId: ctx.user.id,
        fileType: input.fileType,
        fileSize: input.fileSize,
      });
    }),
  updateAvatar: privateProcedure
    .input(z.object({ imageKey: z.string().max(255) }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      const expectedPrefix = `avatars/${userId}-`;
      if (!input.imageKey.startsWith(expectedPrefix)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid image key",
        });
      }

      const oldImageKey = ctx.user.image;

      await prisma.user.update({
        where: { id: userId },
        data: { image: input.imageKey },
      });

      // Delete old image from S3 if it exists
      if (oldImageKey) {
        await deleteImageFromS3(oldImageKey);
      }

      return { success: true };
    }),
  removeAvatar: privateProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.user.id;
    const oldImageKey = ctx.user.image;

    await prisma.user.update({
      where: { id: userId },
      data: { image: null },
    });

    // Delete the avatar from storage if it's an internal avatar
    const isInternalAvatar = oldImageKey && !oldImageKey.startsWith("https://");

    if (isInternalAvatar) {
      await deleteImageFromS3(oldImageKey);
    }

    return { success: true };
  }),
  deleteMe: privateProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.user.id;

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
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    const ability = defineAbilityFor(ctx.user);

    if (ability.cannot("delete", subject("User", user))) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You are not authorized to delete this user",
      });
    }

    if (user.subscriptions.some((subscription) => subscription.active)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "User has active subscriptions",
      });
    }

    await prisma.user.delete({
      where: { id: userId },
    });
  }),
  getNotificationPreferences: privateProcedure.query(async ({ ctx }) => {
    return getNotificationPreferences(ctx.user.id);
  }),
  updateNotificationPreference: privateProcedure
    .input(
      z.object({
        eventType: z.enum(activityEventTypes),
        enabled: z.boolean(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const existing = await prisma.userNotificationPreferences.findUnique({
        where: { userId: ctx.user.id },
        select: { prefs: true },
      });

      const updatedPrefs = {
        ...defaultNotificationPreferences,
        ...(existing?.prefs as object),
        [input.eventType]: input.enabled,
      };

      await prisma.userNotificationPreferences.upsert({
        where: { userId: ctx.user.id },
        create: {
          userId: ctx.user.id,
          prefs: updatedPrefs,
        },
        update: {
          prefs: updatedPrefs,
        },
      });

      posthog()?.capture({
        event: "notification_preference_update",
        distinctId: ctx.user.id,
        properties: {
          eventType: input.eventType,
          enabled: input.enabled,
        },
      });
    }),
  updateLocale: privateProcedure
    .input(z.object({ locale: z.string() }))
    .mutation(async ({ input, ctx }) => {
      await prisma.user.update({
        where: { id: ctx.user.id },
        data: { locale: input.locale },
      });
    }),
  submitFeedback: privateProcedure
    .use(createRateLimitMiddleware("submit_feedback", 5, "1 h"))
    .input(feedbackSchema)
    .mutation(async ({ input, ctx }) => {
      const emailClient = await getEmailClient();
      emailClient.sendEmail({
        to: "feedback@rallly.co",
        subject: "Feedback",
        text: `User: ${ctx.user.name} (${ctx.user.email})\n\n${input.content}`,
      });

      posthog()?.capture({
        event: "feedback_send",
        distinctId: ctx.user.id,
      });
    }),
});
