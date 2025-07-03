"use server";
import { ActionError, authActionClient } from "@/features/safe-action/server";
import { subject } from "@casl/ability";
import { prisma } from "@rallly/database";
import { z } from "zod";
import { getUser } from "./queries";

export const changeRoleAction = authActionClient
  .inputSchema(
    z.object({
      userId: z.string(),
      role: z.enum(["user", "admin"]),
    }),
  )
  .action(async ({ ctx, parsedInput }) => {
    const { userId, role } = parsedInput;

    const targetUser = await getUser(userId);

    if (!targetUser) {
      throw new ActionError({
        code: "NOT_FOUND",
        message: `User ${userId} not found`,
      });
    }

    if (targetUser.role === role) {
      throw new ActionError({
        code: "FORBIDDEN",
        message: "User is already this role",
      });
    }

    if (ctx.ability.cannot("update", subject("User", targetUser), "role")) {
      throw new ActionError({
        code: "UNAUTHORIZED",
        message: "Current user is not authorized to update role",
      });
    }

    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        role,
      },
    });
  });
