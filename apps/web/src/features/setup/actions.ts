"use server";
import { prisma } from "@rallly/database";
import { redirect } from "next/navigation";

import { authActionClient } from "@/features/safe-action/server";
import { setupSchema } from "./schema";

export const completeSetupAction = authActionClient
  .metadata({ actionName: "complete_setup" })
  .inputSchema(setupSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { name, timeZone, locale } = parsedInput;

    await prisma.user.update({
      where: { id: ctx.user.id },
      data: {
        name,
        timeZone,
        locale,
      },
    });

    ctx.capture({
      $set: {
        name,
        timeZone,
        locale,
      },
    });

    redirect("/");
  });
