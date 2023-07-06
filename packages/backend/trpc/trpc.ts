import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";

import { getSubscriptionStatus } from "../utils/auth";
import { Context } from "./context";

const t = initTRPC.context<Context>().create({
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
    if (process.env.NEXT_PUBLIC_SELF_HOSTED === "true" && ctx.user.isGuest) {
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

export const mergeRouters = t.mergeRouters;
