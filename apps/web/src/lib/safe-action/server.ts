import "server-only";

import * as Sentry from "@sentry/nextjs";
import { waitUntil } from "@vercel/functions";
import { createMiddleware, createSafeActionClient } from "next-safe-action";
import * as z from "zod";
import { getCurrentUser, getCurrentUserSpace } from "@/auth/data";
import { PostHogClient } from "@/features/analytics/posthog";
import { defineAbilityForSpace } from "@/features/space/ability";
import { defineAbilityForMember } from "@/features/space/member/ability";
import { defineAbilityFor } from "@/features/user/ability";
import { AppError } from "@/lib/errors";
import type { Duration } from "@/lib/rate-limit";
import { createRatelimit } from "@/lib/rate-limit";

export const posthogMiddleware = createMiddleware().define(async ({ next }) => {
  const posthog = PostHogClient();

  const result = await next({
    ctx: {
      posthog,
    },
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
}).use(posthogMiddleware);

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

export const spaceActionClient = actionClient
  .use(async ({ next }) => {
    const data = await getCurrentUserSpace();

    if (!data) {
      throw new AppError({
        code: "UNAUTHORIZED",
        message: "You are not authenticated.",
      });
    }

    const { user, space } = data;
    const getUserAbility = () => defineAbilityFor(user);
    const getMemberAbility = () =>
      defineAbilityForMember({
        user,
        space,
      });
    const getSpaceAbility = () => defineAbilityForSpace(space);
    return next({
      ctx: {
        user,
        space,
        getUserAbility,
        getMemberAbility,
        getSpaceAbility,
      },
    });
  })
  .use(posthogMiddleware);
