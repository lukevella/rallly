"use server";

import { ActionError, authActionClient } from "@/features/safe-action/server";
import { signOut } from "@/next-auth";
import { subject } from "@casl/ability";
import { prisma } from "@rallly/database";

export const deleteCurrentUserAction = authActionClient
  .metadata({ actionName: "delete_current_user" })
  .action(async ({ ctx }) => {
    const userId = ctx.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { spaces: { include: { subscription: true } } },
    });

    if (!user) {
      throw new ActionError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    if (ctx.ability.cannot("delete", subject("User", user))) {
      throw new ActionError({
        code: "UNAUTHORIZED",
        message: "You are not authorized to delete this user",
      });
    }

    await prisma.user.delete({
      where: {
        id: userId,
      },
    });

    await signOut();

    return {
      success: true,
    };
  });
