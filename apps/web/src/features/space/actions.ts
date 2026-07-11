"use server";

import { prisma } from "@rallly/database";
import * as z from "zod";
import { setActiveSpace } from "@/features/user/mutations";
import { AppError } from "@/lib/errors/app-error";
import { posthog } from "@/lib/posthog";
import { authActionClient } from "@/lib/safe-action/server";

export const setActiveSpaceAction = authActionClient
  .metadata({ actionName: "set_active_space" })
  .inputSchema(z.object({ spaceId: z.string() }))
  .action(async ({ ctx, parsedInput }) => {
    const member = await prisma.spaceMember.findUnique({
      where: {
        spaceId_userId: {
          spaceId: parsedInput.spaceId,
          userId: ctx.user.id,
        },
      },
    });

    if (!member) {
      throw new AppError({
        code: "NOT_FOUND",
        message: "Space not found",
      });
    }

    await setActiveSpace({
      userId: ctx.user.id,
      spaceId: parsedInput.spaceId,
    });

    posthog()?.capture({
      distinctId: ctx.user.id,
      event: "space_set_active",
      properties: {
        space_id: parsedInput.spaceId,
      },
      groups: {
        space: parsedInput.spaceId,
      },
    });
  });
