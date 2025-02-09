import { initTRPC, TRPCError } from "@trpc/server";
import { Ratelimit } from "@upstash/ratelimit";
import { kv } from "@vercel/kv";
import superjson from "superjson";

import { isQuickCreateEnabled } from "@/features/quick-create";
import { isSelfHosted } from "@/utils/constants";
import { getSubscriptionStatus } from "@/utils/subscription";

import type { TRPCContext } from "./context";

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape }) {
    return shape;
  },
});

export const router = t.router;

export const publicProcedure = t.procedure;

export const middleware = t.middleware;

export const possiblyPublicProcedure = t.procedure.use(
  middleware(async ({ ctx, next }) => {
    // These procedurs are public if Quick Create is enabled
    const isGuest = !ctx.user || ctx.user.isGuest;
    if (isGuest && !isQuickCreateEnabled) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Login is required",
      });
    }

    return next();
  }),
);

// This procedure guarantees that a user will exist in the context by
// creating a guest user if needed
export const requireUserMiddleware = middleware(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "This method requires a user",
    });
  }

  return next({
    ctx: {
      user: ctx.user,
    },
  });
});

export const privateProcedure = t.procedure.use(async ({ ctx, next }) => {
  const { user } = ctx;
  if (!user || user.isGuest !== false) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Login is required",
    });
  }

  return next({
    ctx: {
      user,
    },
  });
});

export const proProcedure = privateProcedure.use(async ({ ctx, next }) => {
  if (isSelfHosted) {
    // Self-hosted instances don't have paid subscriptions
    return next();
  }

  const { active: isPro } = await getSubscriptionStatus(ctx.user.id);

  if (!isPro) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message:
        "You must have an active paid subscription to perform this action",
    });
  }

  return next();
});

export const createRateLimitMiddleware = (
  requests: number,
  duration: "1 m" | "1 h",
) => {
  return middleware(async ({ ctx, next }) => {
    if (!process.env.KV_REST_API_URL) {
      return next();
    }

    if (!ctx.ip) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get client IP",
      });
    }
    const ratelimit = new Ratelimit({
      redis: kv,
      limiter: Ratelimit.slidingWindow(requests, duration),
    });

    const res = await ratelimit.limit(ctx.ip);

    if (!res.success) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: "Too many requests",
      });
    }

    return next();
  });
};

export const mergeRouters = t.mergeRouters;
