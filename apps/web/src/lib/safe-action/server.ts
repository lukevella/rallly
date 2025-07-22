import "server-only";

import { posthog } from "@rallly/posthog/server";
import { waitUntil } from "@vercel/functions";
import { createMiddleware, createSafeActionClient } from "next-safe-action";
import z from "zod";
import { getCurrentUser, getCurrentUserSpace } from "@/auth/data";
import { defineAbilityFor } from "@/lib/ability-manager";
import { AppError } from "@/lib/errors";
import type { Duration } from "@/lib/rate-limit";
import { rateLimit } from "@/lib/rate-limit";

const posthogMiddleware = createMiddleware<{
  ctx: { user: { id: string } };
  metadata: { actionName: string };
}>().define(async ({ ctx, next, metadata }) => {
  let properties: Record<string, unknown> | undefined;

  const result = await next({
    ctx: {
      posthog,
      captureProperties: (props?: Record<string, unknown>) => {
        properties = props;
      },
    },
  });

  posthog?.capture({
    distinctId: ctx.user.id,
    event: metadata.actionName,
    properties,
  });

  if (posthog) {
    waitUntil(posthog.shutdown());
  }

  return result;
});

export const createRateLimitMiddleware = (
  requests: number,
  duration: Duration,
) =>
  createMiddleware<{
    metadata: {
      actionName: string;
    };
  }>().define<{
    ctx: { user: { id: string } };
  }>(async ({ next, metadata }) => {
    const res = await rateLimit(metadata.actionName, requests, duration);

    if (!res.success) {
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
  handleServerError: async (error) => {
    if (error instanceof AppError) {
      return error.code;
    }

    return "INTERNAL_SERVER_ERROR";
  },
});

export const authActionClient = actionClient
  .use(async ({ next }) => {
    try {
      const user = await getCurrentUser();
      const ability = defineAbilityFor(user);
      return next({
        ctx: { user, ability },
      });
    } catch (error) {
      throw new AppError({
        code: "UNAUTHORIZED",
        message: "You are not authenticated.",
        cause: error,
      });
    }
  })
  .use(posthogMiddleware);

export const adminActionClient = authActionClient.use(async ({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new AppError({
      code: "FORBIDDEN",
      message: "You do not have permission to perform this action.",
    });
  }

  return next();
});

export const spaceActionClient = actionClient
  .use(async ({ next }) => {
    try {
      const { user, space } = await getCurrentUserSpace();
      const ability = defineAbilityFor(user, {
        space,
      });
      return next({
        ctx: {
          user,
          space,
          ability,
        },
      });
    } catch (error) {
      throw new AppError({
        code: "UNAUTHORIZED",
        message: "You are not authenticated.",
        cause: error,
      });
    }
  })
  .use(posthogMiddleware);
