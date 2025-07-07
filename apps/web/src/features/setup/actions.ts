"use server";

import { prisma } from "@rallly/database";
import { posthog } from "@rallly/posthog/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { authActionClient } from "@/safe-action";
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

    posthog?.capture({
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

    await posthog?.shutdown();

    revalidatePath("/", "layout");

    redirect("/");
  });
