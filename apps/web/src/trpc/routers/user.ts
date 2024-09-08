import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { prisma } from "@rallly/database";
import { TRPCError } from "@trpc/server";
import { waitUntil } from "@vercel/functions";
import { z } from "zod";

import { env } from "@/env";
import { getSubscriptionStatus } from "@/utils/subscription";

import {
  possiblyPublicProcedure,
  privateProcedure,
  publicProcedure,
  rateLimitMiddleware,
  router,
} from "../trpc";

const s3Client = new S3Client({
  region: env.AWS_REGION,
  forcePathStyle: true,
});

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
        },
      });
    }),
  delete: privateProcedure.mutation(async ({ ctx }) => {
    await prisma.$transaction(async (tx) => {
      const polls = await tx.poll.findMany({
        select: { id: true },
        where: { userId: ctx.user.id },
      });
      const pollIds = polls.map((poll) => poll.id);
      await tx.comment.deleteMany({
        where: { pollId: { in: pollIds } },
      });
      await tx.option.deleteMany({
        where: { pollId: { in: pollIds } },
      });
      await tx.participant.deleteMany({
        where: { OR: [{ pollId: { in: pollIds } }, { userId: ctx.user.id }] },
      });
      await tx.watcher.deleteMany({
        where: { OR: [{ pollId: { in: pollIds } }, { userId: ctx.user.id }] },
      });
      await tx.vote.deleteMany({
        where: { pollId: { in: pollIds } },
      });
      await tx.event.deleteMany({
        where: { userId: ctx.user.id },
      });
      await tx.comment.deleteMany({
        where: { OR: [{ pollId: { in: pollIds } }, { userId: ctx.user.id }] },
      });
      await tx.poll.deleteMany({
        where: { userId: ctx.user.id },
      });
      await tx.account.deleteMany({
        where: { userId: ctx.user.id },
      });
      await tx.userPaymentData.deleteMany({
        where: { userId: ctx.user.id },
      });
      await tx.user.delete({
        where: {
          id: ctx.user.id,
        },
      });
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
  getAvatarUploadUrl: privateProcedure
    .use(rateLimitMiddleware)
    .input(z.object({ fileType: z.string(), fileSize: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (
        !env.AWS_S3_BUCKET_NAME ||
        !env.AWS_REGION ||
        !env.AWS_ACCESS_KEY_ID ||
        !env.AWS_SECRET_ACCESS_KEY
      ) {
        return {
          success: false,
          cause: "object-storage-not-enabled",
        } as const;
      }

      const userId = ctx.user.id;
      const key = `avatars/${userId}-${Date.now()}.jpg`;

      if (input.fileSize > 10 * 1024 * 1024) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "File size too large",
        });
      }

      const command = new PutObjectCommand({
        Bucket: env.AWS_S3_BUCKET_NAME,
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

      if (oldImageKey) {
        waitUntil(
          s3Client.send(
            new DeleteObjectCommand({
              Bucket: env.AWS_S3_BUCKET_NAME,
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
      waitUntil(
        s3Client.send(
          new DeleteObjectCommand({
            Bucket: env.AWS_S3_BUCKET_NAME,
            Key: ctx.user.image,
          }),
        ),
      );
    }

    return { success: true };
  }),
});
