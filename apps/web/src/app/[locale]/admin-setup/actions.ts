"use server";

import { prisma } from "@rallly/database";
import { redirect } from "next/navigation";
import { isInitialAdmin } from "@/features/setup/utils";
import { AppError } from "@/lib/errors/app-error";
import { authActionClient } from "@/lib/safe-action/server";

export const makeMeAdminAction = authActionClient
  .metadata({ actionName: "make_admin" })
  .action(async ({ ctx }) => {
    if (!isInitialAdmin(ctx.user.email)) {
      throw new AppError({
        code: "FORBIDDEN",
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

    redirect("/control-panel");
  });
