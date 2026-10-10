import { TRPCError } from "@trpc/server";
import { AppError } from "@/lib/errors/app-error";
import type { Duration } from "@/lib/rate-limit";
import { createRateLimitGuard, createRatelimit } from "@/lib/rate-limit";
import { t } from "./init";

export const createRateLimitMiddleware = (
  name: string,
  requests: number,
  duration: "1 m" | "1 h",
) => {
  const ratelimit = createRatelimit(requests, duration);

  return t.middleware(async ({ ctx, next }) => {
    if (ctx.event) {
      ctx.event.rateLimiter = ratelimit?.name ?? "none";
    }

    if (!ratelimit) {
      return next();
    }

    if (!ctx.identifier) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get identifier",
      });
    }

    const { success, remainingPoints } = await ratelimit.limit(
      `${name}:${ctx.identifier}`,
    );

    if (ctx.event) {
      ctx.event.rateLimiterRemainingPoints = remainingPoints;
    }

    if (!success) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: "Too many requests",
      });
    }

    return next();
  });
};

/**
 * Limits guests per client address. A guest's user id is a cookie, so a
 * per-user limit resets with a cleared cookie; the address does not.
 * Registered users pass through. An unknown address is not limited, so
 * unrelated visitors never share one bucket.
 */
export const createGuestIpRateLimitMiddleware = ({
  name,
  requests,
  duration,
}: {
  name: string;
  requests: number;
  duration: Duration;
}) => {
  const guard = createRateLimitGuard(requests, duration);

  return t.middleware(async ({ ctx, next }) => {
    if (!ctx.user?.isGuest || !ctx.ip) {
      return next();
    }

    try {
      await guard(`${name}:guest_ip:${ctx.ip}`, ctx.event);
    } catch (error) {
      if (error instanceof AppError && error.code === "TOO_MANY_REQUESTS") {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Too many requests",
          cause: error,
        });
      }
      throw error;
    }

    return next();
  });
};
