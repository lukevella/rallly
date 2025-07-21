"use server";
import { subject } from "@casl/ability";
import { prisma } from "@rallly/database";
import { z } from "zod";
import { AppError } from "@/lib/errors";
import { adminActionClient } from "@/lib/safe-action/server";

export const changeRoleAction = adminActionClient
  .metadata({ actionName: "change_role" })
  .inputSchema(
    z.object({
      userId: z.string(),
      role: z.enum(["user", "admin"]),
    }),
  )
  .action(async ({ ctx, parsedInput }) => {
    const { userId, role } = parsedInput;

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      throw new AppError({
        code: "NOT_FOUND",
        message: `User ${userId} not found`,
      });
    }

    if (targetUser.role === role) {
      throw new AppError({
        code: "FORBIDDEN",
        message: "User is already this role",
      });
    }

    if (ctx.ability.cannot("update", subject("User", targetUser), "role")) {
      throw new AppError({
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

export const deleteUserAction = adminActionClient
  .metadata({ actionName: "delete_user" })
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
      throw new AppError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    if (ctx.ability.cannot("delete", subject("User", user))) {
      throw new AppError({
        code: "FORBIDDEN",
        message: "This user cannot be deleted",
        cause: ctx.ability.relevantRuleFor("delete", subject("User", user)),
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
