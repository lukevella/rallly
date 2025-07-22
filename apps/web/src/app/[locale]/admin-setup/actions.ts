"use server";

import { subject } from "@casl/ability";
import { prisma } from "@rallly/database";
import { redirect } from "next/navigation";
import { AppError } from "@/lib/errors";
import { authActionClient } from "@/lib/safe-action/server";

export const makeMeAdminAction = authActionClient
  .metadata({ actionName: "make_admin" })
  .action(async ({ ctx }) => {
    if (ctx.ability.cannot("update", subject("User", ctx.user), "role")) {
      throw new AppError({
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

    redirect("/control-panel");
  });
