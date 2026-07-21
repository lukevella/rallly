import "server-only";

import * as Sentry from "@sentry/nextjs";
import { APIError } from "better-auth/api";
import { createMiddleware, createSafeActionClient } from "next-safe-action";
import * as z from "zod";
import { defineAbilityFor } from "@/features/user/ability";
import { getCurrentUser } from "@/features/user/loaders";
import { signOut } from "@/lib/auth";
import { AppError } from "@/lib/errors/app-error";
import { InvalidSessionError } from "@/lib/errors/invalid-session-error";
import { assertAppAvailable } from "@/lib/maintenance-server";
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
  handleServerError: async (error, { metadata }) => {
    if (error instanceof InvalidSessionError) {
      // Expected condition, not reported to Sentry. Unlike server
      // components, server actions can write cookies, so revoke the
      // stale session directly instead of delegating to the client
      // error boundary.
      try {
        await signOut();
      } catch {
        // The error response must be returned regardless
      }
      return "UNAUTHORIZED" as const;
    }

    if (error instanceof AppError && error.code === "SERVICE_UNAVAILABLE") {
      // Maintenance mode — expected, not reported to Sentry
      return error.code;
    }

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

    if (error instanceof APIError) {
      switch (error.status) {
        case "UNAUTHORIZED":
        case "FORBIDDEN":
        case "NOT_FOUND":
        case "PAYMENT_REQUIRED":
        case "PAYLOAD_TOO_LARGE":
        case "TOO_MANY_REQUESTS":
        case "SERVICE_UNAVAILABLE":
          return error.status;
      }
    }

    return "INTERNAL_SERVER_ERROR" as const;
  },
}).use(async ({ next }) => {
  await assertAppAvailable();
  return next();
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
