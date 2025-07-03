"use server";

import { authActionClient } from "@/features/safe-action/server";
import { ActionError } from "@/features/safe-action/server";
import { getUser } from "@/features/user/queries";
import { subject } from "@casl/ability";
import { prisma } from "@rallly/database";

export const deleteUserAction = authActionClient.action(async ({ ctx }) => {
  const user = await getUser(ctx.user.id);

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
      id: ctx.user.id,
    },
  });

  return {
    success: true,
  };
});
