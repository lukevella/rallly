"use server";
import { ActionError, authActionClient } from "@/features/safe-action/server";
import { subject } from "@casl/ability";
import { prisma } from "@rallly/database";
import { z } from "zod";
import { getUser } from "./queries";

export const changeRoleAction = authActionClient
  .inputSchema(
    z.object({
      userId: z.string().optional(),
      role: z.enum(["user", "admin"]),
    }),
  )
  .action(async ({ ctx, parsedInput }) => {
    const { userId, role } = parsedInput;

    const targetUser = userId ? await getUser(userId) : ctx.user;

    if (userId && !targetUser) {
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
        id: targetUser.id,
      },
      data: {
        role,
      },
    });
  });

export const deleteUserAction = authActionClient
  .inputSchema(
    z.object({
      userId: z.string(),
    }),
  )
  .action(async ({ ctx, parsedInput }) => {
    const userId = parsedInput.userId;

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

    return {
      success: true,
    };
  });
