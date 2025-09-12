import { prisma } from "@rallly/database";
import { posthog } from "@rallly/posthog/server";
import { absoluteUrl } from "@rallly/utils/absolute-url";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  deleteImageFromS3,
  getImageUploadUrl,
} from "@/lib/storage/image-upload";
import { getEmailClient } from "@/utils/emails";
import { createToken } from "@/utils/session";
import {
  createRateLimitMiddleware,
  privateProcedure,
  publicProcedure,
  router,
} from "../trpc";

export const user = router({
  getByEmail: publicProcedure
    .input(z.object({ email: z.string() }))
    .query(async ({ input }) => {
      return await prisma.user.findUnique({
        where: {
          email: input.email,
        },
        select: {
          name: true,
          email: true,
          image: true,
        },
      });
    }),
  /**
   * @deprecated - Use server actions instead
   */
  delete: privateProcedure.mutation(async ({ ctx }) => {
    if (ctx.user.isGuest) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Guest users cannot be deleted",
      });
    }

    await prisma.user.delete({
      where: {
        id: ctx.user.id,
      },
    });
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
        timeZone: z.string().optional(),
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
        select: { email: true, id: true },
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

      getEmailClient(ctx.user.locale).sendTemplate("ChangeEmailRequest", {
        to: input.email,
        props: {
          verificationUrl: absoluteUrl(
            `/api/user/verify-email-change?token=${token}`,
          ),
          fromEmail: currentUser.email,
          toEmail: input.email,
        },
      });

      posthog?.capture({
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
});
