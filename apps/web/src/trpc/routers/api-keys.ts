import { prisma } from "@rallly/database";
import { TRPCError } from "@trpc/server";
import * as z from "zod";
import { createApiKey } from "@/features/developer/utils";
import { router, spaceOwnerCloudOnlyProcedure } from "../trpc";

export const apiKeys = router({
  list: spaceOwnerCloudOnlyProcedure.query(async ({ ctx }) => {
    const keys = await prisma.spaceApiKey.findMany({
      where: {
        spaceId: ctx.space.id,
      },
      select: {
        id: true,
        name: true,
        prefix: true,
        revokedAt: true,
        lastUsedAt: true,
        expiresAt: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return keys;
  }),
  create: spaceOwnerCloudOnlyProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { apiKey, prefix, hashedKey } = await createApiKey();

      await prisma.spaceApiKey.create({
        data: {
          spaceId: ctx.space.id,
          name: input.name,
          prefix,
          hashedKey,
        },
      });

      return { apiKey };
    }),
  revoke: spaceOwnerCloudOnlyProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const apiKey = await prisma.spaceApiKey.findUnique({
        where: { id: input.id },
        select: { spaceId: true, revokedAt: true },
      });

      if (!apiKey) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "API key not found",
        });
      }

      if (apiKey.spaceId !== ctx.space.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to revoke this API key",
        });
      }

      if (apiKey.revokedAt) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "API key is already revoked",
        });
      }

      await prisma.spaceApiKey.update({
        where: { id: input.id },
        data: { revokedAt: new Date() },
      });
    }),
});
