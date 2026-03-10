import "server-only";

import * as Sentry from "@sentry/nextjs";
import { createMiddleware, createSafeActionClient } from "next-safe-action";
import * as z from "zod";
import { getCurrentUser } from "@/auth/data";
import { defineAbilityFor } from "@/features/user/ability";
import { AppError } from "@/lib/errors";
import type { Duration } from "@/lib/rate-limit";
import { createRatelimit } from "@/lib/rate-limit";

export const createRateLimitMiddleware = (
  requests: number,
  duration: Duration,
) =>
  createMiddleware<{
    metadata: {
      actionName: string;
    };
    ctx: { user: { id: string } };
  }>().define(async ({ next, metadata, ctx }) => {
    const ratelimit = createRatelimit(requests, duration);

    if (!ratelimit) {
      return next();
    }

    const { success } = await ratelimit.limit(
      `${metadata.actionName}:${ctx.user.id}`,
    );

    if (!success) {
      throw new AppError({
        code: "TOO_MANY_REQUESTS",
        message: "You are making too many requests.",
      });
    }

    return next();
  });

export const actionClient = createSafeActionClient({
  defineMetadataSchema: () =>
    z.object({
      actionName: z.string(),
    }),
  handleServerError: (error, { metadata }) => {
    Sentry.captureException(error, {
      tags: {
        errorHandler: "safe-action",
      },
      extra: {
        actionName: metadata.actionName,
      },
    });

    if (error instanceof AppError) {
      return error.code;
    }

    return "INTERNAL_SERVER_ERROR" as const;
  },
});

export const authActionClient = actionClient.use(async ({ next }) => {
  const user = await getCurrentUser();

  if (!user) {
    throw new AppError({
      code: "UNAUTHORIZED",
      message: "You are not authenticated.",
    });
  }

  const ability = defineAbilityFor(user);

  return next({
    ctx: { user, ability },
  });
});

export const adminActionClient = authActionClient.use(async ({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new AppError({
      code: "FORBIDDEN",
      message: "You do not have permission to perform this action.",
    });
  }

  return next();
});
