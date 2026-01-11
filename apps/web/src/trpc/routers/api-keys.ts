import { prisma } from "@rallly/database";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getCurrentUserSpace } from "@/auth/data";
import { privateProcedure, router } from "../trpc";

export const apiKeys = router({
  list: privateProcedure.query(async () => {
    const data = await getCurrentUserSpace();

    if (!data) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "User must be logged in with a space selected",
      });
    }

    const keys = await prisma.spaceApiKey.findMany({
      where: {
        spaceId: data.space.id,
        revokedAt: null,
      },
      select: {
        id: true,
        name: true,
        prefix: true,
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
  delete: privateProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      const data = await getCurrentUserSpace();

      if (!data) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User must be logged in with a space selected",
        });
      }

      const apiKey = await prisma.spaceApiKey.findUnique({
        where: { id: input.id },
        select: { spaceId: true },
      });

      if (!apiKey) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "API key not found",
        });
      }

      if (apiKey.spaceId !== data.space.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to delete this API key",
        });
      }

      await prisma.spaceApiKey.delete({
        where: { id: input.id },
      });
    }),
});
