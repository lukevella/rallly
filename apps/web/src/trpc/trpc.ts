import { prisma } from "@rallly/database";
import { initTRPC, TRPCError } from "@trpc/server";
import { Ratelimit } from "@upstash/ratelimit";
import { waitUntil } from "@vercel/functions";
import { kv } from "@vercel/kv";
import superjson from "superjson";
import { getCurrentUserSpace } from "@/auth/data";
import { PostHogClient } from "@/features/analytics/posthog";
import { isApiAccessEnabled } from "@/features/developer/data";
import { isQuickCreateEnabled } from "@/features/quick-create";
import { getActiveSpaceForUser } from "@/features/space/data";
import { getUser } from "@/features/user/data";
import { isSelfHosted } from "@/utils/constants";
import type { TRPCContext } from "./context";

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape }) {
    return shape;
  },
});

export const router = t.router;

export const middleware = t.middleware;

export const procedureWithAnalytics = t.procedure.use(async ({ next }) => {
  const posthog = PostHogClient();

  const res = await next({
    ctx: {
      posthog,
    },
  });

  if (posthog) {
    waitUntil(posthog.shutdown());
  }

  return res;
});

export const publicProcedure = procedureWithAnalytics;

export const possiblyPublicProcedure = procedureWithAnalytics.use(
  middleware(async ({ ctx, next }) => {
    // These procedures are public if Quick Create is enabled
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

// This procedure guarantees that a user will exist in the context
export const requireUserMiddleware = middleware(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "This method requires a user",
    });
  }

  if (!ctx.user.isGuest) {
    const dbUser = await prisma.user.findUnique({
      where: {
        id: ctx.user.id,
      },
      select: {
        banned: true,
      },
    });

    if (!dbUser) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Logged in user does not exist anymore",
      });
    }

    if (dbUser.banned) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Your account has been banned",
      });
    }
  }

  return next({
    ctx: {
      user: ctx.user,
    },
  });
});

export const privateProcedure = procedureWithAnalytics.use(
  async ({ ctx, next }) => {
    if (!ctx.user || ctx.user.isGuest !== false) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Login is required",
      });
    }

    const user = await getUser(ctx.user.id);

    if (!user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "User does not exist",
      });
    }

    return next({
      ctx: {
        user: ctx.user,
      },
    });
  },
);

export const proProcedure = privateProcedure.use(async ({ next }) => {
  if (isSelfHosted) {
    // Self-hosted instances don't have paid subscriptions
    return next();
  }

  const data = await getCurrentUserSpace();

  if (!data || data.space.tier !== "pro") {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message:
        "You must have an active paid subscription to perform this action",
    });
  }

  return next();
});

export const spaceOwnerCloudOnlyProcedure = privateProcedure.use(
  async ({ ctx, next }) => {
    const space = await getActiveSpaceForUser(ctx.user.id);

    if (!space) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "No active space found",
      });
    }

    const user = await getUser(ctx.user.id);

    if (!user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "User does not exist",
      });
    }

    const hasAccess = await isApiAccessEnabled(user, space);

    if (!hasAccess) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "API access is not enabled for this user or space",
      });
    }

    return next({
      ctx: {
        space,
        user: ctx.user,
      },
    });
  },
);

export const createRateLimitMiddleware = (
  name: string,
  requests: number,
  duration: "1 m" | "1 h",
) => {
  return middleware(async ({ ctx, next }) => {
    if (!process.env.KV_REST_API_URL) {
      return next();
    }

    if (!ctx.identifier) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get identifier",
      });
    }

    const ratelimit = new Ratelimit({
      redis: kv,
      limiter: Ratelimit.slidingWindow(requests, duration),
    });

    const res = await ratelimit.limit(`${name}:${ctx.identifier}`);

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
