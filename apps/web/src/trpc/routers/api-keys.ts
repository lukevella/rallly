import { prisma } from "@rallly/database";
import { TRPCError } from "@trpc/server";
import { isApiAccessEnabled } from "@/features/api-keys/data";
import { router, spaceOwnerProcedure } from "../trpc";

const apiAccessProcedure = spaceOwnerProcedure.use(async ({ ctx, next }) => {
  const hasAccess = await isApiAccessEnabled(ctx.user, ctx.space);

  if (!hasAccess) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "API access is not enabled for this user or space",
    });
  }

  return next();
});

export const apiKeys = router({
  list: apiAccessProcedure.query(async ({ ctx }) => {
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
});
