import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { prisma } from "@rallly/database";
import { absoluteUrl } from "@rallly/utils/absolute-url";
import { TRPCError } from "@trpc/server";
import { waitUntil } from "@vercel/functions";
import { z } from "zod";

import { env } from "@/env";
import { getS3Client } from "@/utils/s3";
import { createToken } from "@/utils/session";
import { getSubscriptionStatus } from "@/utils/subscription";

import {
  possiblyPublicProcedure,
  privateProcedure,
  publicProcedure,
  rateLimitMiddleware,
  router,
} from "../trpc";

const mimeToExtension = {
  "image/jpeg": "jpg",
  "image/png": "png",
} as const;

export const user = router({
  getBilling: possiblyPublicProcedure.query(async ({ ctx }) => {
    return await prisma.userPaymentData.findUnique({
      select: {
        subscriptionId: true,
        status: true,
        planId: true,
        endDate: true,
        updateUrl: true,
        cancelUrl: true,
      },
      where: {
        userId: ctx.user.id,
      },
    });
  }),
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
  subscription: possiblyPublicProcedure.query(
    async ({ ctx }): Promise<{ legacy?: boolean; active: boolean }> => {
      if (ctx.user.isGuest) {
        // guest user can't have an active subscription
        return {
          active: false,
        };
      }

      return await getSubscriptionStatus(ctx.user.id);
    },
  ),
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
  requestEmailChange: privateProcedure
    .use(rateLimitMiddleware)
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input, ctx }) => {
      // create a verification token
      const token = await createToken({
        fromEmail: ctx.user.email,
        toEmail: input.email,
      });

      const verificationToken = await prisma.verificationToken.create({
        data: {
          identifier: input.email,
          token,
          expires: new Date(Date.now() + 1000 * 60 * 10),
        },
      });

      ctx.user.getEmailClient().sendTemplate("ChangeEmailRequest", {
        to: input.email,
        props: {
          verificationUrl: absoluteUrl(
            `/api/user/verify-email-change?token=${verificationToken.token}`,
          ),
          fromEmail: ctx.user.email,
          toEmail: input.email,
        },
      });
    }),
  getAvatarUploadUrl: privateProcedure
    .use(rateLimitMiddleware)
    .input(
      z.object({
        fileType: z.enum(["image/jpeg", "image/png"]),
        fileSize: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const s3Client = getS3Client();

      if (!s3Client) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "S3 storage has not been configured",
        });
      }

      const userId = ctx.user.id;
      const key = `avatars/${userId}-${Date.now()}.${mimeToExtension[input.fileType]}`;

      if (input.fileSize > 2 * 1024 * 1024) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "File size too large",
        });
      }

      const command = new PutObjectCommand({
        Bucket: env.S3_BUCKET_NAME,
        Key: key,
        ContentType: input.fileType,
        ContentLength: input.fileSize,
      });

      const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

      return {
        success: true,
        url,
        fields: {
          key,
        },
      } as const;
    }),
  updateAvatar: privateProcedure
    .input(z.object({ imageKey: z.string().max(255) }))
    .use(rateLimitMiddleware)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      const oldImageKey = ctx.user.image;

      await prisma.user.update({
        where: { id: userId },
        data: { image: input.imageKey },
      });

      const s3Client = getS3Client();

      if (oldImageKey && s3Client) {
        waitUntil(
          s3Client?.send(
            new DeleteObjectCommand({
              Bucket: env.S3_BUCKET_NAME,
              Key: oldImageKey,
            }),
          ),
        );
      }

      return { success: true };
    }),
  removeAvatar: privateProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.user.id;

    await prisma.user.update({
      where: { id: userId },
      data: { image: null },
    });

    // Delete the avatar from storage if it's an internal avatar
    const isInternalAvatar =
      ctx.user.image && !ctx.user.image.startsWith("https://");

    if (isInternalAvatar) {
      const s3Client = getS3Client();

      if (s3Client) {
        waitUntil(
          s3Client.send(
            new DeleteObjectCommand({
              Bucket: env.S3_BUCKET_NAME,
              Key: ctx.user.image,
            }),
          ),
        );
      }

      return { success: true };
    }
  }),
});
