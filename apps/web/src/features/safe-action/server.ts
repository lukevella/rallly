"server-only";
import { requireUserAbility } from "@/auth/queries";
import { posthog } from "@rallly/posthog/server";
import { waitUntil } from "@vercel/functions";
import { createMiddleware, createSafeActionClient } from "next-safe-action";
import { revalidatePath } from "next/cache";

type ActionErrorCode =
  | "UNAUTHORIZED"
  | "NOT_FOUND"
  | "FORBIDDEN"
  | "INTERNAL_SERVER_ERROR";

export class ActionError extends Error {
  code: ActionErrorCode;
  constructor({
    code,
    message,
    cause,
  }: {
    code: ActionErrorCode;
    message: string;
    cause?: unknown;
  }) {
    super(`[${code}]: ${message}`);
    this.name = "ActionError";
    this.code = code;
    this.cause = cause;
  }
}

const autoRevalidateMiddleware = createMiddleware().define(({ next }) => {
  const result = next();
  revalidatePath("/", "layout");
  return result;
});

const posthogMiddleware = createMiddleware<{
  ctx: { user: { id: string } };
}>().define(({ ctx, next }) => {
  const result = next({
    ctx: {
      posthog,
      capture: (event: string, properties?: Record<string, unknown>) => {
        posthog?.capture({
          distinctId: ctx.user.id,
          event,
          properties,
        });
      },
    },
  });

  waitUntil(Promise.all([posthog?.shutdown()]));

  return result;
});

export const actionClient = createSafeActionClient({
  handleServerError: async (error) => {
    if (error instanceof ActionError) {
      return error.code;
    }

    return "INTERNAL_SERVER_ERROR";
  },
}).use(autoRevalidateMiddleware);

export const authActionClient = actionClient
  .use(async ({ next }) => {
    const { user, ability } = await requireUserAbility();

    return next({
      ctx: { user, ability },
    });
  })
  .use(posthogMiddleware);
