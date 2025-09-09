"use server";

import { prisma } from "@rallly/database";
import { RedirectType, redirect } from "next/navigation";
import { AppError } from "@/lib/errors";
import { authActionClient } from "@/lib/safe-action/server";
import { isInitialAdmin } from "@/utils/is-initial-admin";

export const makeMeAdminAction = authActionClient
  .metadata({ actionName: "make_admin" })
  .action(async ({ ctx }) => {
    if (!isInitialAdmin(ctx.user.email)) {
      throw new AppError({
        code: "FORBIDDEN",
        message: "You are not authorized to update your role",
      });
    }

    try {
      await prisma.user.update({
        where: {
          id: ctx.user.id,
        },
        data: {
          role: "admin",
        },
      });
    } catch (error) {
      throw new AppError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to update user role",
        cause: error,
      });
    }

    redirect("/control-panel", RedirectType.replace);
  });
