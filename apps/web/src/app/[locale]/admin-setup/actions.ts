"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isInitialAdmin } from "@/features/setup/utils";
import { updateUserRole } from "@/features/user/mutations";
import { authLib } from "@/lib/auth";
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

    await updateUserRole({ userId: ctx.user.id, role: "admin" });

    // The session cookie cache still holds the old role, which would send
    // /control-panel straight back here. Re-issue it from the database
    // before redirecting.
    await authLib.api.getSession({
      headers: await headers(),
      query: {
        disableCookieCache: true,
      },
    });

    redirect("/control-panel");
  });
