"use server";

import { ActionError, authActionClient } from "@/features/safe-action/server";
import { subject } from "@casl/ability";
import { prisma } from "@rallly/database";

export const deleteUserAction = authActionClient
  .use(async ({ ctx, next }) => {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: ctx.user.id },
      include: { spaces: { include: { subscription: true } } },
    });

    if (ctx.ability.cannot("delete", subject("User", user))) {
      throw new ActionError({
        code: "UNAUTHORIZED",
        message: "You are not authorized to delete this user",
      });
    }

    return next();
  })
  .action(async ({ ctx }) => {
    await prisma.user.delete({
      where: {
        id: ctx.user.id,
      },
    });

    return {
      success: true,
    };
  });
