import { prisma } from "@rallly/database";
import { TRPCError } from "@trpc/server";
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
});
