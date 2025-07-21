"use server";

import { subject } from "@casl/ability";
import { accessibleBy } from "@casl/prisma";
import { prisma } from "@rallly/database";
import { z } from "zod";
import { authActionClient } from "@/features/safe-action/server";
import { AppError } from "@/lib/errors";

export const setActiveSpaceAction = authActionClient
  .inputSchema(
    z.object({
      spaceId: z.string(),
    }),
  )
  .metadata({
    actionName: "space_set_active",
  })
  .action(async ({ ctx, parsedInput }) => {
    const space = await prisma.space.findFirst({
      where: {
        AND: [accessibleBy(ctx.ability).Space, { id: parsedInput.spaceId }],
      },
      include: {
        members: {
          where: {
            userId: ctx.user.id,
          },
        },
      },
    });

    if (!space) {
      throw new AppError({
        code: "NOT_FOUND",
        message: "Space not found",
      });
    }

    if (!ctx.ability.can("read", subject("Space", space))) {
      throw new AppError({
        code: "FORBIDDEN",
        message: "You do not have access to this space",
      });
    }

    await prisma.user.update({
      where: {
        id: ctx.user.id,
      },
      data: {
        activeSpaceId: parsedInput.spaceId,
      },
    });
  });

export const createSpaceAction = authActionClient
  .metadata({
    actionName: "space_create",
  })
  .inputSchema(
    z.object({
      name: z.string().min(1).max(100),
    }),
  )
  .action(async ({ ctx, parsedInput }) => {
    const space = await prisma.space.create({
      data: {
        name: parsedInput.name,
        ownerId: ctx.user.id,
        members: {
          create: {
            userId: ctx.user.id,
            role: "OWNER",
          },
        },
      },
    });

    try {
      await prisma.user.update({
        where: {
          id: ctx.user.id,
        },
        data: {
          activeSpaceId: space.id,
        },
      });
    } catch (error) {
      console.error(error);
    }
  });

export const deleteSpaceAction = authActionClient
  .metadata({
    actionName: "space_delete",
  })
  .inputSchema(
    z.object({
      spaceId: z.string(),
    }),
  )
  .action(async ({ ctx, parsedInput }) => {
    const space = await prisma.space.findFirst({
      where: {
        AND: [accessibleBy(ctx.ability).Space, { id: parsedInput.spaceId }],
      },
      include: {
        subscription: true,
      },
    });

    if (!space) {
      throw new AppError({
        code: "NOT_FOUND",
        message: "Space not found",
      });
    }

    if (ctx.ability.cannot("delete", subject("Space", space))) {
      throw new AppError({
        code: "FORBIDDEN",
        message: "You do not have access to this space",
      });
    }

    await prisma.space.delete({
      where: {
        id: parsedInput.spaceId,
      },
    });
  });
