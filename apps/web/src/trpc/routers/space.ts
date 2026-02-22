import { prisma } from "@rallly/database";
import { TRPCError } from "@trpc/server";
import { getActiveSpaceForUser } from "@/features/space/data";
import { AppError } from "@/lib/errors";
import { privateProcedure, router } from "../trpc";

export const space = router({
  getCurrent: privateProcedure.query(async ({ ctx }) => {
    const space = await getActiveSpaceForUser(ctx.user.id);

    if (!space) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "No active space found",
        cause: new AppError({
          code: "SETUP_REQUIRED",
          message: "User has no space configured",
        }),
      });
    }

    return space;
  }),
  members: privateProcedure.query(async ({ ctx }) => {
    const activeSpace = await getActiveSpaceForUser(ctx.user.id);

    if (!activeSpace) {
      return [];
    }

    const members = await prisma.spaceMember.findMany({
      where: {
        spaceId: activeSpace.id,
      },
      select: {
        userId: true,
        user: {
          select: {
            name: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return members.map((member) => ({
      userId: member.userId,
      name: member.user.name,
      image: member.user.image ?? undefined,
    }));
  }),
});
