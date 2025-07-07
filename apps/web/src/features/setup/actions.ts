"use server";
import { prisma } from "@rallly/database";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { authActionClient } from "@/features/safe-action/server";
import { setupSchema } from "./schema";

export const updateUserAction = authActionClient
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

    ctx.posthog?.capture({
      event: "user_setup_completed",
      distinctId: ctx.user.id,
      properties: {
        $set: {
          name,
          timeZone,
          locale,
        },
      },
    });

    revalidatePath("/", "layout");

    redirect("/");
  });
