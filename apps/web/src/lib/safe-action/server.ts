import "server-only";

import { posthog } from "@rallly/posthog/server";
import * as Sentry from "@sentry/nextjs";
import { waitUntil } from "@vercel/functions";
import { createMiddleware, createSafeActionClient } from "next-safe-action";
import z from "zod";
import { getCurrentUser, getCurrentUserSpace } from "@/auth/data";
import { defineAbilityForSpace } from "@/features/space/ability";
import { defineAbilityForMember } from "@/features/space/member/ability";
import { defineAbilityFor } from "@/features/user/ability";
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
  handleServerError: async (error, { metadata }) => {
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

    return "INTERNAL_SERVER_ERROR";
  },
});

export const authActionClient = actionClient
  .use(async ({ next }) => {
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
        userId: user.id,
        spaceId: space.id,
        role: space.role,
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
