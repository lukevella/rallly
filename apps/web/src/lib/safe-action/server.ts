import "server-only";

import type { WideEvent } from "@rallly/logger";
import { createWideEvent, logger } from "@rallly/logger";
import * as Sentry from "@sentry/nextjs";
import { APIError } from "better-auth/api";
import { headers } from "next/headers";
import { after } from "next/server";
import { createMiddleware, createSafeActionClient } from "next-safe-action";
import * as z from "zod";
import { defineAbilityFor } from "@/features/user/ability";
import { loadOptionalActor, loadOptionalUser } from "@/features/user/loaders";
import { signOut } from "@/lib/auth";
import { AppError } from "@/lib/errors/app-error";
import { InvalidSessionError } from "@/lib/errors/invalid-session-error";
import { assertAppAvailable } from "@/lib/maintenance-server";
import { flushPostHog } from "@/lib/posthog";
import type { Duration } from "@/lib/rate-limit";
import { createRateLimitGuard } from "@/lib/rate-limit";

/**
 * Limits an action per user or per client address. Limit by address where a
 * caller can repeat the action under a fresh guest session. An unknown
 * address (a self-hosted instance with no proxy headers) is not limited, so
 * unrelated visitors never share one bucket.
 */
export const createRateLimitMiddleware = ({
  requests,
  duration,
  by,
}: {
  requests: number;
  duration: Duration;
  by: "user" | "ip";
}) => {
  const guard = createRateLimitGuard(requests, duration);

  return createMiddleware<{
    metadata: {
      actionName: string;
    };
    ctx: { user?: { id: string } | null; event: WideEvent };
  }>().define(async ({ next, metadata, ctx }) => {
    const id = by === "user" ? ctx.user?.id : ctx.event.ip;

    if (id) {
      await guard(`${metadata.actionName}:${by}:${id}`, ctx.event);
    }

    return next();
  });
};

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
})
  // One wide event per action call, emitted once the result is known.
  .use(async ({ next, metadata }) => {
    const headerList = await headers();
    const startTime = Date.now();
    const event = createWideEvent({
      service: "action",
      requestId:
        headerList.get("x-vercel-id") ??
        headerList.get("x-request-id") ??
        undefined,
      actionName: metadata.actionName,
      // x-real-ip is what Vercel sets; self-hosted proxies set the other.
      ip:
        headerList.get("x-real-ip") ??
        headerList.get("x-forwarded-for")?.split(",")[0]?.trim(),
      ja4Digest: headerList.get("x-vercel-ja4-digest") ?? undefined,
    });

    try {
      const result = await next({ ctx: { event } });
      if (typeof result.serverError === "string") {
        event.errorCode = result.serverError;
      } else if (result.validationErrors) {
        event.errorCode = "VALIDATION_ERROR";
      }
      return result;
    } finally {
      event.durationMs = Date.now() - startTime;
      if (event.errorCode === "INTERNAL_SERVER_ERROR") {
        logger.error(event);
      } else if (event.errorCode) {
        logger.warn(event);
      } else {
        logger.info(event);
      }
    }
  })
  // The PostHog client only enqueues; a serverless function freezes once the
  // action response is sent, so the buffer must be flushed here. Route
  // handlers get the same through withPostHog. Runs in finally so a failed
  // action's events still flush.
  .use(async ({ next }) => {
    try {
      return await next();
    } finally {
      after(() => flushPostHog());
    }
  })
  .use(async ({ next }) => {
    await assertAppAvailable();
    return next();
  });

export const authActionClient = actionClient.use(async ({ ctx, next }) => {
  const user = await loadOptionalUser();

  if (!user) {
    throw new AppError({
      code: "UNAUTHORIZED",
      message: "You are not authenticated.",
    });
  }

  const ability = defineAbilityFor(user);

  ctx.event.userId = user.id;
  ctx.event.isGuest = user.isGuest;

  return next({
    ctx: { user, ability },
  });
});

/**
 * For writes on public pages: the session user may be a guest, and there
 * may be none at all when the credential is a token from an emailed link.
 */
export const optionalUserActionClient = actionClient.use(
  async ({ ctx, next }) => {
    const user = await loadOptionalActor();

    if (user) {
      ctx.event.userId = user.id;
      ctx.event.isGuest = user.isGuest;
    }

    return next({
      ctx: { user },
    });
  },
);

/**
 * For writes a guest may perform. The client creates the guest session
 * first (createGuestIfNeeded), so a missing user is a stale page, not an
 * anonymous visitor.
 */
export const anyUserActionClient = optionalUserActionClient.use(
  async ({ ctx, next }) => {
    if (!ctx.user) {
      throw new AppError({
        code: "UNAUTHORIZED",
        message: "You are not authenticated.",
      });
    }

    return next({
      ctx: { user: ctx.user },
    });
  },
);

export const adminActionClient = authActionClient.use(async ({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new AppError({
      code: "FORBIDDEN",
      message: "You do not have permission to perform this action.",
    });
  }

  return next();
});
