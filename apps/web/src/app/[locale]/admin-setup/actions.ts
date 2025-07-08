import { authActionClient } from "@/features/safe-action/server";
import { ActionError } from "@/features/safe-action/server";
import { subject } from "@casl/ability";
import { prisma } from "@rallly/database";

export const makeMeAdminAction = authActionClient.action(async ({ ctx }) => {
  if (ctx.ability.cannot("update", subject("User", ctx.user), "role")) {
    throw new ActionError({
      code: "UNAUTHORIZED",
      message: "You are not authorized to update your role",
    });
  }

  await prisma.user.update({
    where: {
      id: ctx.user.id,
    },
    data: {
      role: "admin",
    },
  });
});
