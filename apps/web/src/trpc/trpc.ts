import { initTRPC, TRPCError } from "@trpc/server";
import { Ratelimit } from "@upstash/ratelimit";
import { kv } from "@vercel/kv";
import requestIp from "request-ip";
import superjson from "superjson";

import { isSelfHosted } from "@/utils/constants";
import { getSubscriptionStatus } from "@/utils/subscription";

import { TRPCContext } from "./context";

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
    // On self-hosted instances, these procedures require login
    if (isSelfHosted && ctx.user.isGuest) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Login is required",
      });
    }
    return next();
  }),
);

export const proProcedure = t.procedure.use(
  middleware(async ({ ctx, next }) => {
    if (ctx.user.isGuest) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Login is required",
      });
    }

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
  }),
);

export const privateProcedure = t.procedure.use(
  middleware(async ({ ctx, next }) => {
    if (ctx.user.isGuest) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Login is required",
      });
    }
    return next();
  }),
);

export const rateLimitMiddleware = middleware(async ({ ctx, next }) => {
  if (!process.env.KV_REST_API_URL) {
    return next();
  }

  const ratelimit = new Ratelimit({
    redis: kv,
    limiter: Ratelimit.slidingWindow(5, "1 m"),
  });

  const clientIp = requestIp.getClientIp(ctx.req);

  if (!clientIp) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to get client IP",
    });
  }

  const res = await ratelimit.limit(clientIp);

  if (!res.success) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: "Too many requests",
    });
  }

  return next();
});

export const mergeRouters = t.mergeRouters;
